import { Container } from 'inversify';
import { type IGitHubAPI, type IConfig, type IDatabaseService, type IGitHubAuth, type ILogger, LogLevel } from '@/lib/interfaces';
import { GitHubAuth } from '@/lib/github-auth';
import { Database } from '@/lib/database';
import { Logger } from '@/lib/logger';
import { GitHubAPI } from '@/lib/github-api';
import { TYPES } from '@/lib/types';
import { Config } from '@/lib/config';

export function createTestContainer(params?: {
  config?: IConfig;
  githubAuth?: IGitHubAuth;
  databaseService?: IDatabaseService;
  githubAPI?: IGitHubAPI;
  logger?: ILogger;
}): Container {
  const testContainer = new Container();

  testContainer.bind<IConfig>(TYPES.Config).toConstantValue(params?.config ?? new Config({
    githubApiBase: 'http://localhost:3001',
    githubToken: 'ghp_test1234567890abcdef1234567890abcdef',
    encryptionPassword: 'test-password',
    databasePath: ':memory:',
    logLevel: LogLevel.DISABLED,
  }));

  if (params?.logger) {
    testContainer.bind<ILogger>(TYPES.Logger).toConstantValue(params.logger);
  }
  else {
    testContainer.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
  }

  if (params?.githubAuth) {
    testContainer.bind<IGitHubAuth>(TYPES.GitHubAuth).toConstantValue(params.githubAuth);
  }
  else {
    testContainer.bind<IGitHubAuth>(TYPES.GitHubAuth).to(GitHubAuth);
  }

  if (params?.databaseService) {
    testContainer.bind<IDatabaseService>(TYPES.DatabaseService).toConstantValue(params.databaseService);
  }
  else {
    testContainer.bind<IDatabaseService>(TYPES.DatabaseService).to(Database);
  }

  if (params?.githubAPI) {
    testContainer.bind<IGitHubAPI>(TYPES.GitHubAPI).toConstantValue(params.githubAPI);
  }
  else {
    testContainer.bind<IGitHubAPI>(TYPES.GitHubAPI).to(GitHubAPI);
  }

  return testContainer;
};

export const testContainer = createTestContainer();
