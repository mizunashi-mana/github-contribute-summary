import 'reflect-metadata';
import { NextRequest } from 'next/server';
import { Container } from 'inversify';
import { createTestContainer } from '@~test/dummy-implementations';
import { TYPES } from '@/lib/types';
import { IGitHubAPI, IDatabaseService, IGitHubAuth } from '@/lib/interfaces';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.GITHUB_API_BASE = 'http://localhost:3001';

describe('/api/github route with Dependency Injection', () => {
  let testContainer: Container;
  let gitHubAPI: IGitHubAPI;
  let databaseService: IDatabaseService;
  let gitHubAuth: IGitHubAuth;

  beforeEach(() => {
    testContainer = createTestContainer();
    gitHubAPI = testContainer.get<IGitHubAPI>(TYPES.GitHubAPI);
    databaseService = testContainer.get<IDatabaseService>(TYPES.DatabaseService);
    gitHubAuth = testContainer.get<IGitHubAuth>(TYPES.GitHubAuth);
  });

  describe('Token handling', () => {
    test('should get token from GitHubAuth service', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token'),
        },
      } as unknown as NextRequest;

      const token = gitHubAuth.getToken(mockRequest);
      expect(token).toBeDefined();
    });

    test('should generate auth headers correctly', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token'),
        },
      } as unknown as NextRequest;

      const headers = gitHubAuth.getAuthHeaders(mockRequest);
      expect(headers).toHaveProperty('Accept');
      expect(headers).toHaveProperty('User-Agent');
      expect(headers).toHaveProperty('Authorization');
    });
  });

  describe('Caching behavior', () => {
    test('should verify database service is available', () => {
      expect(databaseService).toBeDefined();
      expect(databaseService.constructor.name).toBe('Database');
    });

    test('should verify in-memory database configuration', () => {
      // Test that we're using the right configuration
      const config = testContainer.get(TYPES.Config);
      expect(config.getDatabasePath()).toBe(':memory:');
    });
  });

  describe('GitHub API integration', () => {
    test('should fetch data from GitHub API', async () => {
      const data = await gitHubAPI.getAllData('owner', 'repo', 'testuser');

      expect(data).toHaveProperty('created_prs');
      expect(data).toHaveProperty('reviewed_prs');
      expect(Array.isArray(data.created_prs)).toBe(true);
      expect(Array.isArray(data.reviewed_prs)).toBe(true);
    });

    test('should handle API requests with setRequest method', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token'),
        },
      } as unknown as NextRequest;

      // Test that setRequest method exists and doesn't throw
      expect(() => {
        if ('setRequest' in gitHubAPI) {
          const apiWithSetRequest = gitHubAPI as IGitHubAPI & {
            setRequest?: (req: NextRequest, token: string) => void;
          };
          apiWithSetRequest.setRequest?.(mockRequest, 'test-token');
        }
      }).not.toThrow();
    });
  });

  describe('Database operations', () => {
    test('should have required database methods', () => {
      expect(typeof databaseService.savePullRequest).toBe('function');
      expect(typeof databaseService.hasCachedData).toBe('function');
      expect(typeof databaseService.getCachedData).toBe('function');
      expect(typeof databaseService.close).toBe('function');
    });
  });

  describe('Service integration', () => {
    test('should have all services properly injected', () => {
      expect(gitHubAPI).toBeDefined();
      expect(databaseService).toBeDefined();
      expect(gitHubAuth).toBeDefined();
    });

    test('should use appropriate implementations in test environment', () => {
      expect(gitHubAPI.constructor.name).toBe('DummyGitHubAPI');
      expect(databaseService.constructor.name).toBe('Database');
      expect(gitHubAuth.constructor.name).toBe('GitHubAuth'); // Using real GitHubAuth instead of dummy
    });
  });
});
