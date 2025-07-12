import 'reflect-metadata';
import { Container } from 'inversify';
import { initConfig } from '@/lib/config';
import { TYPES } from '@/lib/types';
import type { IGitHubAPI } from '@/lib/interfaces';
import { NextRequest } from 'next/server';
import { Server } from 'node:http';
import { buildApp, startServer } from '@~test/mock/github-api/server';
import { createTestContainer } from '@~test/dummy-implementations';

describe('GitHubAPI with Mock Server (Real Implementation)', () => {
  let server: Server;
  let port: number;
  let api: IGitHubAPI;
  let container: Container;

  beforeAll(async () => {
    // Start mock server
    const app = buildApp();
    server = await startServer(app, {});

    const address = server.address();
    if (typeof address === 'string' || address === null) {
      server.close();
      throw new Error(`Server address is not valid: ${address}`);
    }

    port = address.port;

    console.log(`Mock server running on port ${port}`);
  }, 5000);

  beforeEach(() => {
    // Create config instance with current environment
    const config = initConfig({
      GITHUB_API_BASE: `http://localhost:${port}/api/v3`,
      GITHUB_TOKEN: 'mock-token-for-testing',
    });
    container = createTestContainer({
      config,
    });

    api = container.get<IGitHubAPI>(TYPES.GitHubAPI);
  });

  afterAll(() => {
    // Close mock server
    if (server) {
      server.close();
    }
  });

  describe('Real GitHubAPI Integration Tests', () => {
    test('should fetch user created PRs from mock server', async () => {
      const data = await api.getPullRequestsByUser('facebook', 'react', 'testuser');

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      // Verify structure of returned data
      const firstPR = data[0];
      expect(firstPR).toHaveProperty('id');
      expect(firstPR).toHaveProperty('number');
      expect(firstPR).toHaveProperty('title');
      expect(firstPR).toHaveProperty('user');
      expect(firstPR).toHaveProperty('reviews');
      expect(firstPR.user.login).toBe('testuser');

      // Check for review timestamps
      expect(firstPR).toHaveProperty('review_started_at');
      expect(firstPR).toHaveProperty('review_approved_at');
    });

    test('should fetch user reviewed PRs from mock server', async () => {
      const data = await api.getReviewedPullRequests('facebook', 'react', 'testuser');

      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const firstPR = data[0];
        expect(firstPR).toHaveProperty('id');
        expect(firstPR).toHaveProperty('number');
        expect(firstPR).toHaveProperty('title');
        expect(firstPR).toHaveProperty('reviews');

        // User should not be the author of PRs they reviewed
        expect(firstPR.user.login).not.toBe('testuser');

        // Should have reviews by the user
        const userReviews = firstPR.reviews.filter(review => review.user.login === 'testuser');
        expect(userReviews.length).toBeGreaterThan(0);
      }
    });

    test('should get all data using getAllData method', async () => {
      const data = await api.getAllData('facebook', 'react', 'testuser');

      expect(data).toHaveProperty('created_prs');
      expect(data).toHaveProperty('reviewed_prs');
      expect(Array.isArray(data.created_prs)).toBe(true);
      expect(Array.isArray(data.reviewed_prs)).toBe(true);

      // Verify created PRs are by the user
      data.created_prs.forEach((pr) => {
        expect(pr.user.login).toBe('testuser');
      });

      // Verify reviewed PRs are not by the user but have user reviews
      data.reviewed_prs.forEach((pr) => {
        expect(pr.user.login).not.toBe('testuser');
        const userReviews = pr.reviews.filter(review => review.user.login === 'testuser');
        expect(userReviews.length).toBeGreaterThan(0);
      });
    });

    test('should handle different repositories', async () => {
      const reactData = await api.getAllData('facebook', 'react', 'testuser');
      const vscodeData = await api.getAllData('microsoft', 'vscode', 'testuser');

      expect(reactData.created_prs.length).toBeGreaterThan(0);
      expect(vscodeData.created_prs.length).toBeGreaterThan(0);

      // Verify different repositories return different data
      const reactPRNumbers = reactData.created_prs.map(pr => pr.number);
      const vscodePRNumbers = vscodeData.created_prs.map(pr => pr.number);

      // Should have different PR numbers (different repos)
      const hasOverlap = reactPRNumbers.some(num => vscodePRNumbers.includes(num));
      expect(hasOverlap).toBe(false);
    });

    test('should include review data with correct structure', async () => {
      const data = await api.getPullRequestsByUser('facebook', 'react', 'testuser');

      expect(data.length).toBeGreaterThan(0);

      const prWithReviews = data.find(pr => pr.reviews && pr.reviews.length > 0);
      expect(prWithReviews).toBeDefined();

      if (prWithReviews) {
        const review = prWithReviews.reviews[0];
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('user');
        expect(review).toHaveProperty('body');
        expect(review).toHaveProperty('state');
        expect(review).toHaveProperty('submitted_at');
        expect(review.user).toHaveProperty('login');
        expect(review.user).toHaveProperty('id');
      }
    });

    test('should handle setRequest method', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token'),
        },
      } as unknown as NextRequest;

      expect(() => {
        api.setRequest(mockRequest, 'client-token');
      }).not.toThrow();
    });

    test('should handle non-existent repository gracefully', async () => {
      const data = await api.getAllData('nonexistent', 'repo', 'testuser');
      expect(data.created_prs).toHaveLength(0);
      expect(data.reviewed_prs).toHaveLength(0);
    });

    test('should handle non-existent user gracefully', async () => {
      const data = await api.getAllData('facebook', 'react', 'nonexistentuser');

      expect(data.created_prs).toHaveLength(0);
      expect(data.reviewed_prs).toHaveLength(0);
    });
  });

  describe('Mock Server Data Validation', () => {
    test('should return consistent data structure', async () => {
      const data = await api.getAllData('facebook', 'react', 'testuser');

      // Validate created PRs structure
      data.created_prs.forEach((pr) => {
        expect(pr).toMatchObject({
          id: expect.any(Number),
          number: expect.any(Number),
          title: expect.any(String),
          state: expect.stringMatching(/^(open|closed)$/),
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
          html_url: expect.stringMatching(/^https:\/\/github\.com\//),
          user: {
            login: expect.any(String),
            id: expect.any(Number),
          },
          assignees: expect.any(Array),
          requested_reviewers: expect.any(Array),
          labels: expect.any(Array),
          reviews: expect.any(Array),
        });
      });

      // Validate reviewed PRs structure
      data.reviewed_prs.forEach((pr) => {
        expect(pr.reviews.length).toBeGreaterThan(0);

        pr.reviews.forEach((review) => {
          expect(review).toMatchObject({
            id: expect.any(Number),
            user: {
              login: expect.any(String),
              id: expect.any(Number),
            },
            body: expect.any(String),
            state: expect.stringMatching(/^(COMMENTED|CHANGES_REQUESTED|APPROVED|DISMISSED)$/),
            submitted_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
          });
        });
      });
    });

    test('should have proper review timestamps', async () => {
      const data = await api.getPullRequestsByUser('facebook', 'react', 'testuser');

      const prWithReviews = data.find(pr => pr.reviews && pr.reviews.length > 0);
      if (prWithReviews) {
        // Should have review_started_at if there are reviews
        expect(prWithReviews.review_started_at).toBeDefined();

        // If there's an approved review, should have review_approved_at
        const hasApprovedReview = prWithReviews.reviews.some(r => r.state === 'APPROVED');
        if (hasApprovedReview) {
          expect(prWithReviews.review_approved_at).toBeDefined();
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle server errors gracefully', async () => {
      const data = await api.getAllData('invalid', 'repo', 'user');
      expect(data.created_prs).toHaveLength(0);
      expect(data.reviewed_prs).toHaveLength(0);
    });
  });
});
