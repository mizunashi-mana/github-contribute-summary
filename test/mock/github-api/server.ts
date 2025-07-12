import express from 'express';
import cors from 'cors';
import { Server } from 'node:http';
import { mockData } from '@~test/mock/github-api/data';

export function buildApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // GitHub API v3 base path
  const API_BASE = '/api/v3';

  // Helper function for GitHub API responses
  const sendGitHubResponse = (res: express.Response, data: unknown) => {
    res.header('X-GitHub-Media-Type', 'github.v3; format=json');
    res.header('X-RateLimit-Limit', '5000');
    res.header('X-RateLimit-Remaining', '4999');
    res.header('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600));
    res.json(data);
  };

  // Repository information
  app.get(`${API_BASE}/repos/:owner/:repo`, (req, res) => {
    const { owner, repo } = req.params;
    const repoKey = `${owner}/${repo}`;

    const repository = mockData.repositories[repoKey];
    if (!repository) {
      return res.status(404).json({
        message: 'Not Found',
        documentation_url: 'https://docs.github.com/rest',
      });
    }

    sendGitHubResponse(res, repository);
  });

  // Pull requests list
  app.get(`${API_BASE}/repos/:owner/:repo/pulls`, (req, res) => {
    const { owner, repo } = req.params;
    const { state = 'open', per_page = 100, page = 1 } = req.query;
    const repoKey = `${owner}/${repo}`;

    const pullRequests = mockData.pullRequests[repoKey] || [];

    // Filter by state
    let filteredPRs = pullRequests;
    if (state !== 'all') {
      filteredPRs = pullRequests.filter((pr: unknown) => (pr as { state: string }).state === state);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(per_page);
    const endIndex = startIndex + Number(per_page);
    const paginatedPRs = filteredPRs.slice(startIndex, endIndex);

    sendGitHubResponse(res, paginatedPRs);
  });

  // Specific pull request
  app.get(`${API_BASE}/repos/:owner/:repo/pulls/:pull_number`, (req, res) => {
    const { owner, repo, pull_number } = req.params;
    const repoKey = `${owner}/${repo}`;

    const pullRequests = mockData.pullRequests[repoKey] || [];
    const pullRequest = pullRequests.find((pr: unknown) => (pr as { number: number }).number === parseInt(pull_number));

    if (!pullRequest) {
      return res.status(404).json({
        message: 'Not Found',
        documentation_url: 'https://docs.github.com/rest',
      });
    }

    sendGitHubResponse(res, pullRequest);
  });

  // Pull request reviews
  app.get(`${API_BASE}/repos/:owner/:repo/pulls/:pull_number/reviews`, (req, res) => {
    const { pull_number } = req.params;

    const reviews = mockData.reviews[pull_number] || [];
    sendGitHubResponse(res, reviews);
  });

  // User information
  app.get(`${API_BASE}/users/:username`, (req, res) => {
    const { username } = req.params;

    const user = mockData.users[username];
    if (!user) {
      return res.status(404).json({
        message: 'Not Found',
        documentation_url: 'https://docs.github.com/rest',
      });
    }

    sendGitHubResponse(res, user);
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      message: 'Not Found',
      documentation_url: 'https://docs.github.com/rest',
    });
  });

  return app;
}

export function startServer(app: express.Application, options: { port?: number } = {}): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(options.port || 0, (err?: Error) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(server);
      }
    });
  });
}
