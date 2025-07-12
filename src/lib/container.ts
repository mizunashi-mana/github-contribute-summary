import 'reflect-metadata';
import { Container } from 'inversify';
import type { IGitHubAPI, IDatabaseService, IGitHubAuth, IConfig, ILogger } from '@/lib/interfaces';
import { GitHubAPI } from '@/lib/github-api';
import { Database } from '@/lib/database';
import { GitHubAuth } from '@/lib/github-auth';
import { Logger } from '@/lib/logger';
import { initConfig } from '@/lib/config';
import { TYPES } from '@/lib/types';

const container = new Container();

container.bind<IConfig>(TYPES.Config).toConstantValue(initConfig(process.env));
container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
container.bind<IGitHubAuth>(TYPES.GitHubAuth).to(GitHubAuth);
container.bind<IDatabaseService>(TYPES.DatabaseService).to(Database);
container.bind<IGitHubAPI>(TYPES.GitHubAPI).to(GitHubAPI);

export { container };
