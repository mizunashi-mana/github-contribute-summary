import 'reflect-metadata';
import { Container } from 'inversify';
import { createTestContainer } from '@~test/dummy-implementations';
import { TYPES } from '@/lib/types';
import type { IGitHubAPI } from '@/lib/interfaces';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GITHUB_API_BASE = 'http://localhost:3001';

describe('GitHubAPI with DI', () => {
  let api: IGitHubAPI;
  let container: Container;

  beforeEach(() => {
    container = createTestContainer();
    api = container.get<IGitHubAPI>(TYPES.GitHubAPI);
  });

  test('should fetch data from GitHub API', async () => {
    const data = await api.getAllData('owner', 'repo', 'testuser');

    expect(data).toHaveProperty('created_prs');
    expect(data).toHaveProperty('reviewed_prs');
    expect(Array.isArray(data.created_prs)).toBe(true);
    expect(Array.isArray(data.reviewed_prs)).toBe(true);
  });

  test('should handle setRequest method if available', () => {
    if ('setRequest' in api) {
      expect(() => {
        const apiWithSetRequest = api as IGitHubAPI & {
          setRequest?: (req: unknown, token: string) => void;
        };
        apiWithSetRequest.setRequest?.(undefined, 'test-token');
      }).not.toThrow();
    }
  });

  test('should use dummy implementation in test environment', () => {
    expect(api.constructor.name).toBe('DummyGitHubAPI');
  });
});
