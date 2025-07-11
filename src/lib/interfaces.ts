import { PullRequestWithReviews } from '@/types';
import { NextRequest } from 'next/server';

export interface IGitHubAPI {
  getAllData(
    owner: string,
    repo: string,
    user: string
  ): Promise<{
    created_prs: PullRequestWithReviews[];
    reviewed_prs: PullRequestWithReviews[];
  }>;
}

export interface IDatabaseService {
  init(): Promise<void>;
  hasCachedData(userLogin: string, repository: string): Promise<boolean>;
  getCachedData(userLogin: string, repository: string): Promise<{
    created_prs: PullRequestWithReviews[];
    reviewed_prs: PullRequestWithReviews[];
  }>;
  savePullRequest(pr: PullRequestWithReviews, repository: string): Promise<void>;
  close(): Promise<void>;
}

export interface IGitHubAuth {
  getToken(request?: NextRequest, clientToken?: string): string | undefined;
  getAuthHeaders(request?: NextRequest, clientToken?: string): Record<string, string>;
  isTokenAvailable(request?: NextRequest, clientToken?: string): boolean;
}

export interface IConfig {
  getGitHubApiBase(): string;
  getGitHubToken(): string | undefined;
  getEncryptionPassword(): string | undefined;
  getDatabasePath(): string;
  isTestEnvironment(): boolean;
}
