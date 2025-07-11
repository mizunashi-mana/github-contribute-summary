import { injectable, inject } from 'inversify';
import { NextRequest } from 'next/server';
import { getDecryptedToken } from '@/lib/encryption';
import type { IGitHubAuth, IConfig } from '@/lib/interfaces';
import { TYPES } from '@/lib/types';

export interface GitHubAuthConfig {
  token?: string;
  useClientToken?: boolean;
}

@injectable()
export class GitHubAuth implements IGitHubAuth {
  private serverToken?: string;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.serverToken = getDecryptedToken(this.config.getGitHubToken());
  }

  private validateToken(token: string): boolean {
    // Basic GitHub token format validation
    if (!token) return false;

    // GitHub tokens should start with specific prefixes
    const validPrefixes = [
      'ghp_', // Classic Personal Access Token
      'gho_', // OAuth token
      'ghu_', // User token
      'ghs_', // Server token
      'ghr_', // Refresh token
      'github_pat_', // Fine-grained Personal Access Token
    ];
    const hasValidPrefix = validPrefixes.some(prefix => token.startsWith(prefix));

    if (!hasValidPrefix) return false;

    // Fine-grained tokens are longer (93 characters), classic tokens are ~40 characters
    if (token.startsWith('github_pat_')) {
      // Fine-grained tokens should be around 93 characters
      return token.length >= 80 && token.length <= 100;
    }
    else {
      // Classic tokens should be around 40 characters
      return token.length >= 35 && token.length <= 50;
    }
  }

  getToken(request?: NextRequest, clientToken?: string): string | undefined {
    // 1. クライアントから提供されたトークンを優先（検証済み）
    if (clientToken && this.validateToken(clientToken)) {
      return clientToken;
    }

    // 2. リクエストヘッダーからトークンを取得（検証済み）
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (this.validateToken(token)) {
          return token;
        }
      }
    }

    // 3. サーバー環境変数のトークンを使用（検証済み）
    if (this.serverToken && this.validateToken(this.serverToken)) {
      return this.serverToken;
    }

    return undefined;
  }

  isTokenAvailable(request?: NextRequest, clientToken?: string): boolean {
    return !!this.getToken(request, clientToken);
  }

  getAuthHeaders(request?: NextRequest, clientToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Contribute-Dashboard',
    };

    const token = this.getToken(request, clientToken);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
}
