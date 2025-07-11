import { injectable } from 'inversify';

export interface IConfig {
  getGitHubApiBase(): string;
  getGitHubToken(): string | undefined;
  getEncryptionPassword(): string | undefined;
  getDatabasePath(): string;
  isTestEnvironment(): boolean;
}

@injectable()
export class Config implements IConfig {
  getGitHubApiBase(): string {
    return process.env.GITHUB_API_BASE || 'https://api.github.com';
  }

  getGitHubToken(): string | undefined {
    return process.env.GITHUB_TOKEN;
  }

  getEncryptionPassword(): string | undefined {
    return process.env.ENCRYPTION_PASSWORD;
  }

  getDatabasePath(): string {
    return process.env.DATABASE_PATH || 'github_data.db';
  }

  isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test';
  }
}

@injectable()
export class TestConfig implements IConfig {
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
