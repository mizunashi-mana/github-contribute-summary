import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { TYPES } from '@/lib/types';
import type { IGitHubAPI, IDatabaseService, ILogger } from '@/lib/interfaces';
import { validateGitHubUsername, validateRepositoryName, sanitizeInput, RateLimiter } from '@/lib/security';

const rateLimiter = new RateLimiter(5, 60000); // 5 requests per minute

async function handleRequestWithDI(request: NextRequest, isPost = false) {
  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (!rateLimiter.canMakeRequest(clientIp)) {
    return NextResponse.json(
      { error: 'レート制限に達しました。しばらく待ってから再試行してください。' },
      { status: 429 },
    );
  }

  let rawUser: string | null;
  let rawRepo: string | null;
  let refresh: boolean;
  let clientToken: string | undefined;

  if (isPost) {
    const requestBody = await request.json();
    rawUser = requestBody.user;
    rawRepo = requestBody.repo;
    refresh = requestBody.refresh === true;
    clientToken = requestBody.token;
  }
  else {
    const url = new URL(request.url);
    rawUser = url.searchParams.get('user');
    rawRepo = url.searchParams.get('repo');
    refresh = url.searchParams.get('refresh') === 'true';
    // For GET requests, token would come from headers (not implemented in this example)
  }

  if (!rawUser || !rawRepo) {
    return NextResponse.json(
      { error: 'user と repo パラメータが必要です' },
      { status: 400 },
    );
  }

  // Input sanitization
  const user = sanitizeInput(rawUser);
  const repo = sanitizeInput(rawRepo);

  // Validation
  if (!validateGitHubUsername(user)) {
    return NextResponse.json(
      { error: '無効なGitHubユーザー名です' },
      { status: 400 },
    );
  }

  if (!validateRepositoryName(repo)) {
    return NextResponse.json(
      { error: '無効なリポジトリ名です。owner/repository の形式で指定してください' },
      { status: 400 },
    );
  }

  const gitHubAPI = container.get<IGitHubAPI>(TYPES.GitHubAPI);
  const database = container.get<IDatabaseService>(TYPES.DatabaseService);
  const logger = container.get<ILogger>(TYPES.Logger);

  try {
    if ('setRequest' in gitHubAPI) {
      (gitHubAPI as IGitHubAPI & {
        setRequest?: (request?: NextRequest, token?: string) => void;
      }).setRequest?.(request, clientToken);
    }

    const [owner, repository] = repo.split('/');

    if (!refresh && await database.hasCachedData(user, repo)) {
      const cachedData = await database.getCachedData(user, repo);
      return NextResponse.json(cachedData);
    }

    const data = await gitHubAPI.getAllData(owner, repository, user);

    for (const pr of data.created_prs) {
      await database.savePullRequest(pr, repo);
    }
    for (const pr of data.reviewed_prs) {
      await database.savePullRequest(pr, repo);
    }

    await database.close();

    return NextResponse.json(data);
  }
  catch (error) {
    logger.error('GitHub API Error:', error);

    await database.close();

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'GitHub APIのレート制限に達しました。しばらく待ってから再試行してください。' },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: 'GitHub APIからのデータ取得に失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRequestWithDI(request, false);
}

export async function POST(request: NextRequest) {
  return handleRequestWithDI(request, true);
}
