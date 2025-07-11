import { injectable, Container } from 'inversify';
import { PullRequestWithReviews } from '@/types';
import type { IGitHubAPI, IConfig, IDatabaseService, IGitHubAuth } from '@/lib/interfaces';
import { GitHubAuth } from '@/lib/github-auth';
import { Database } from '@/lib/database';
import { TYPES } from '@/lib/types';

@injectable()
export class DummyGitHubAPI implements IGitHubAPI {
  private mockData = {
    created_prs: [
      {
        id: 1,
        number: 123,
        title: 'Test PR',
        state: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        html_url: 'https://github.com/owner/repo/pull/123',
        user: { id: 1, login: 'testuser' },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        reviews: [],
      },
    ] as PullRequestWithReviews[],
    reviewed_prs: [] as PullRequestWithReviews[],
  };

  public setRequest(/* _request?: NextRequest, _token?: string */): void {
    // No-op for dummy implementation
  }

  async getAllData(
    /* _owner: string,
    _repo: string,
    _user: string */
  ): Promise<{ created_prs: PullRequestWithReviews[]; reviewed_prs: PullRequestWithReviews[] }> {
    return Promise.resolve(this.mockData);
  }
}

@injectable()
export class DummyConfig implements IConfig {
  getGitHubApiBase(): string {
    return 'http://localhost:3001';
  }

  getGitHubToken(): string | undefined {
    return 'ghp_test1234567890abcdef1234567890abcdef';
  }

  getEncryptionPassword(): string | undefined {
    return 'test-password';
  }

  getDatabasePath(): string {
    return ':memory:';
  }

  isTestEnvironment(): boolean {
    return true;
  }
}

// Test container factory for dummy implementations
export const createTestContainer = (): Container => {
  const testContainer = new Container();

  testContainer.bind<IConfig>(TYPES.Config).to(DummyConfig);
  testContainer.bind<IGitHubAuth>(TYPES.GitHubAuth).to(GitHubAuth); // Use real GitHubAuth
  testContainer.bind<IDatabaseService>(TYPES.DatabaseService).to(Database);
  testContainer.bind<IGitHubAPI>(TYPES.GitHubAPI).to(DummyGitHubAPI);

  return testContainer;
};
