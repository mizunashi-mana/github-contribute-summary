import 'reflect-metadata';
import { Container } from 'inversify';
import type { IGitHubAPI, IDatabaseService, IGitHubAuth, IConfig } from '@/lib/interfaces';
import { GitHubAPI } from '@/lib/github-api';
import { Database } from '@/lib/database';
import { GitHubAuth } from '@/lib/github-auth';
import { Config } from '@/lib/config';
import { TYPES } from '@/lib/types';

// Production container
const container = new Container();

container.bind<IConfig>(TYPES.Config).to(Config);
container.bind<IGitHubAuth>(TYPES.GitHubAuth).to(GitHubAuth);
container.bind<IDatabaseService>(TYPES.DatabaseService).to(Database);
container.bind<IGitHubAPI>(TYPES.GitHubAPI).to(GitHubAPI);

export { container };
