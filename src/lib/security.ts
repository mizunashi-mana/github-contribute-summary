export function validateGitHubUsername(username: string): boolean {
  // GitHub username validation rules
  if (!username || username.length === 0) return false;
  if (username.length > 39) return false;
  if (username.startsWith('-') || username.endsWith('-')) return false;
  if (username.includes('--')) return false;

  // Only alphanumeric characters and hyphens
  const validPattern = /^[a-zA-Z0-9-]+$/;
  return validPattern.test(username);
}

export function validateRepositoryName(repo: string): boolean {
  // Repository format validation: owner/repo
  if (!repo || !repo.includes('/')) return false;

  const parts = repo.split('/');
  if (parts.length !== 2) return false;

  const [owner, repoName] = parts;

  // Validate owner and repo names
  if (!validateGitHubUsername(owner)) return false;
  if (!repoName || repoName.length === 0 || repoName.length > 100) return false;

  // Repository name pattern (more permissive than username)
  const repoPattern = /^[a-zA-Z0-9._-]+$/;
  return repoPattern.test(repoName);
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters but keep / for repository names
  return input.trim().replace(/[<>"\\&]/g, '');
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(clientId: string): boolean {
    const now = Date.now();

    // Get or create request history for this client
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }

    const clientRequests = this.requests.get(clientId)!;

    // Clean old requests
    const filteredRequests = clientRequests.filter(time => now - time < this.windowMs);
    this.requests.set(clientId, filteredRequests);

    if (filteredRequests.length >= this.maxRequests) {
      return false;
    }

    filteredRequests.push(now);
    return true;
  }
}
