import { IConfig, LogLevel } from '@/lib/interfaces';

export class Config implements IConfig {
  private readonly githubApiBase: string;
  private readonly githubToken: string | undefined;
  private readonly encryptionPassword: string | undefined;
  private readonly databasePath: string;
  private readonly logLevel: LogLevel;

  constructor(params: {
    githubApiBase: string;
    githubToken: string | undefined;
    encryptionPassword: string | undefined;
    databasePath: string;
    logLevel: LogLevel;
  }) {
    this.githubApiBase = params.githubApiBase;
    this.githubToken = params.githubToken;
    this.encryptionPassword = params.encryptionPassword;
    this.databasePath = params.databasePath;
    this.logLevel = params.logLevel;
  }

  getGitHubApiBase(): string {
    return this.githubApiBase;
  }

  getGitHubToken(): string | undefined {
    return this.githubToken;
  }

  getEncryptionPassword(): string | undefined {
    return this.encryptionPassword;
  }

  getDatabasePath(): string {
    return this.databasePath;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

export function initConfig(env: Record<string, string | undefined>): IConfig {
  return new Config({
    githubApiBase: env.GITHUB_API_BASE || 'http://localhost:3001',
    githubToken: env.GITHUB_TOKEN,
    encryptionPassword: env.ENCRYPTION_PASSWORD,
    databasePath: env.DATABASE_PATH || 'github_data.db',
    logLevel: env.LOG_LEVEL !== undefined ? parseLogLevelFromEnv(env.LOG_LEVEL) : LogLevel.INFO,
  });
}

function parseLogLevelFromEnv(envLevel: string): LogLevel {
  const level = envLevel.toUpperCase();
  switch (level) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'DISABLED':
    case 'DISABLE':
    case 'OFF':
      return LogLevel.DISABLED;
    default:
      throw new Error(`Invalid log level: ${envLevel}`);
  }
}
