import 'reflect-metadata';
import { NextRequest } from 'next/server';
import { Container } from 'inversify';
import { createTestContainer } from '@~test/dummy-implementations';
import { TYPES } from '@/lib/types';
import { IGitHubAPI, IDatabaseService, IGitHubAuth } from '@/lib/interfaces';

// Set test environment
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
    });
  });

  describe('GitHubAPI service', () => {
    test('should handle API requests with setRequest method', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token'),
        },
      } as unknown as NextRequest;

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
  });
});
