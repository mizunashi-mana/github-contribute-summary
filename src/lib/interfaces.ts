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
  getPullRequestsByUser(owner: string, repo: string, user: string): Promise<PullRequestWithReviews[]>;
  getReviewedPullRequests(owner: string, repo: string, user: string): Promise<PullRequestWithReviews[]>;
  setRequest(request?: NextRequest, token?: string): void;
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
  getLogLevel(): LogLevel;
}

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
  isEnabled(level: LogLevel): boolean;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  DISABLED = 4,
}
