import { injectable, inject } from 'inversify';
import { PullRequest, Review, PullRequestWithReviews } from '@/types';
import type { IGitHubAuth, IGitHubAPI, IConfig } from '@/lib/interfaces';
import { TYPES } from '@/lib/types';
import { NextRequest } from 'next/server';

@injectable()
class GitHubAPI implements IGitHubAPI {
  private request?: NextRequest;
  private clientToken?: string;

  constructor(
    @inject(TYPES.GitHubAuth) private auth: IGitHubAuth,
    @inject(TYPES.Config) private config: IConfig,
  ) {}

  public setRequest(request?: NextRequest, token?: string): void {
    this.request = request;
    this.clientToken = token;
  }

  private logApiAccess(url: string, method: string = 'GET'): void {
    const apiPath = url.replace(this.config.getGitHubApiBase(), '');
    const timestamp = new Date().toISOString();
    const token = this.auth.getToken(this.request, this.clientToken);
    const hasToken = !!token;
    const tokenSource = token ? this.getTokenSource(token) : 'none';
    console.log(
      `[GitHub API] ${timestamp} ${method} ${apiPath} (auth: ${hasToken ? 'yes' : 'no'}, source: ${tokenSource})`,
    );
  }

  private getTokenSource(token: string): string {
    if (this.clientToken && this.clientToken === token) {
      return 'client';
    }
    if (this.request) {
      const authHeader = this.request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ') && authHeader.substring(7) === token) {
        return 'header';
      }
    }
    return 'env';
  }

  private async fetchWithAuth(url: string): Promise<Response> {
    this.logApiAccess(url);

    const headers = this.auth.getAuthHeaders(this.request, this.clientToken);
    const response = await fetch(url, {
      headers,
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      if (response.status === 403) {
        const remainingRequests = response.headers.get('X-RateLimit-Remaining');
        if (remainingRequests === '0') {
          throw new Error('GitHub API rate limit exceeded');
        }
        const errorBody = await response.text();
        if (errorBody.includes('insufficient_scope') || errorBody.includes('scope')) {
          throw new Error(
            'Fine-grained token に必要な権限がありません。Contents: Read, Metadata: Read, Pull requests: Read 権限を確認してください。',
          );
        }
        throw new Error('GitHub API access forbidden. Check token permissions.');
      }
      if (response.status === 404) {
        const token = this.auth.getToken(this.request, this.clientToken);
        const tokenType = token?.startsWith('github_pat_')
          ? 'Fine-grained'
          : token?.startsWith('ghp_')
            ? 'Classic'
            : 'Unknown';
        throw new Error(`Repository or user not found. ${tokenType} tokenの場合、リポジトリへのアクセス権限とMetadata: Read権限を確認してください。`);
      }
      if (response.status === 401) {
        throw new Error('GitHub authentication failed. Please check your token.');
      }
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async getPullRequestsByUser(owner: string, repo: string, user: string): Promise<PullRequestWithReviews[]> {
    const url = `${this.config.getGitHubApiBase()}/repos/${owner}/${repo}/pulls?state=all&per_page=100`;
    const response = await this.fetchWithAuth(url);
    const allPrs: PullRequest[] = await response.json();

    const userPrs = allPrs.filter(pr => pr.user.login === user);
    const result: PullRequestWithReviews[] = [];

    for (const pr of userPrs) {
      const reviews = await this.getReviewsForPR(owner, repo, pr.number);

      const firstReview = reviews.find(
        r => r.state === 'COMMENTED' || r.state === 'CHANGES_REQUESTED' || r.state === 'APPROVED',
      );
      const approvedReview = reviews.find(r => r.state === 'APPROVED');

      result.push({
        ...pr,
        reviews,
        review_started_at: firstReview?.submitted_at,
        review_approved_at: approvedReview?.submitted_at,
      });
    }

    return result;
  }

  async getReviewedPullRequests(owner: string, repo: string, user: string): Promise<PullRequestWithReviews[]> {
    const url = `${this.config.getGitHubApiBase()}/repos/${owner}/${repo}/pulls?state=all&per_page=100`;
    const response = await this.fetchWithAuth(url);
    const allPrs: PullRequest[] = await response.json();

    const result: PullRequestWithReviews[] = [];

    for (const pr of allPrs) {
      if (pr.user.login === user) continue;

      const reviews = await this.getReviewsForPR(owner, repo, pr.number);
      const userReviews = reviews.filter(review => review.user.login === user);

      if (userReviews.length > 0) {
        const firstUserReview = userReviews[0];
        const approvedUserReview = userReviews.find(r => r.state === 'APPROVED');

        result.push({
          ...pr,
          reviews,
          review_started_at: firstUserReview?.submitted_at,
          review_approved_at: approvedUserReview?.submitted_at,
        });
      }
    }

    return result;
  }

  private async getReviewsForPR(owner: string, repo: string, prNumber: number): Promise<Review[]> {
    const url = `${this.config.getGitHubApiBase()}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;

    try {
      const response = await this.fetchWithAuth(url);
      return await response.json();
    }
    catch (error) {
      console.warn(`Failed to fetch reviews for PR #${prNumber}:`, error);
      return [];
    }
  }

  async getAllData(owner: string, repo: string, user: string): Promise<{
    created_prs: PullRequestWithReviews[];
    reviewed_prs: PullRequestWithReviews[];
  }> {
    const [created_prs, reviewed_prs] = await Promise.all([
      this.getPullRequestsByUser(owner, repo, user),
      this.getReviewedPullRequests(owner, repo, user),
    ]);

    return { created_prs, reviewed_prs };
  }
}

export { GitHubAPI };
