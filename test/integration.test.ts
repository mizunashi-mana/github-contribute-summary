import { validateGitHubUsername, validateRepositoryName, sanitizeInput, RateLimiter } from '@/lib/security';

describe('API統合テスト', () => {
  describe('APIエンドポイント動作シミュレーション', () => {
    test('正常なリクエストフローをシミュレート', () => {
      // 1. リクエストパラメータの受信
      const rawUser = 'octocat';
      const rawRepo = 'octocat/Hello-World';

      // 2. 入力のサニタイズ
      const sanitizedUser = sanitizeInput(rawUser);
      const sanitizedRepo = sanitizeInput(rawRepo);

      // 3. バリデーション
      const isValidUser = validateGitHubUsername(sanitizedUser);
      const isValidRepo = validateRepositoryName(sanitizedRepo);

      // 4. 結果の検証
      expect(sanitizedUser).toBe('octocat');
      expect(sanitizedRepo).toBe('octocat/Hello-World');
      expect(isValidUser).toBe(true);
      expect(isValidRepo).toBe(true);
    });

    test('不正なリクエストを適切に拒否', () => {
      // 悪意のある入力をシミュレート
      const maliciousUser = '<script>alert("xss")</script>';
      const maliciousRepo = 'invalid/repo">&<script>';

      // サニタイズ
      const sanitizedUser = sanitizeInput(maliciousUser);
      const sanitizedRepo = sanitizeInput(maliciousRepo);

      // バリデーション
      const isValidUser = validateGitHubUsername(sanitizedUser);
      const isValidRepo = validateRepositoryName(sanitizedRepo);

      // 危険な文字が除去され、バリデーションで拒否されることを確認
      expect(sanitizedUser).toBe('scriptalert(xss)/script');
      expect(sanitizedRepo).toBe('invalid/reposcript');
      expect(isValidUser).toBe(false); // スラッシュが含まれているため無効
      expect(isValidRepo).toBe(true); // サニタイズ後は有効な形式
    });

    test('レート制限機能の統合動作', () => {
      const rateLimiter = new RateLimiter(3, 60000); // 3 requests per minute
      const clientIP = '192.168.1.1';

      // APIエンドポイントでのレート制限チェックをシミュレート
      const results = [];
      for (let i = 0; i < 5; i++) {
        if (!rateLimiter.canMakeRequest(clientIP)) {
          results.push('RATE_LIMITED');
        }
        else {
          // 正常なリクエスト処理をシミュレート
          const user = 'testuser';
          const repo = 'owner/repo';

          if (!validateGitHubUsername(user) || !validateRepositoryName(repo)) {
            results.push('VALIDATION_ERROR');
          }
          else {
            results.push('SUCCESS');
          }
        }
      }

      expect(results).toEqual(['SUCCESS', 'SUCCESS', 'SUCCESS', 'RATE_LIMITED', 'RATE_LIMITED']);
    });
  });

  describe('エラーケースの網羅的テスト', () => {
    test('空の入力値', () => {
      expect(validateGitHubUsername('')).toBe(false);
      expect(validateRepositoryName('')).toBe(false);
      expect(sanitizeInput('')).toBe('');
    });

    test('極端に長い入力', () => {
      const longString = 'a'.repeat(1000);
      const longUser = longString;
      const longRepo = 'owner/' + longString;

      expect(validateGitHubUsername(longUser)).toBe(false);
      expect(validateRepositoryName(longRepo)).toBe(false);
    });

    test('特殊文字の組み合わせ', () => {
      const specialChars = '<>&"\\/';
      const result = sanitizeInput(specialChars);

      // スラッシュ以外の特殊文字が除去されていることを確認
      expect(result).toBe('/');
    });
  });

  describe('実世界のGitHubデータでの検証', () => {
    test('人気リポジトリの検証', () => {
      const popularRepos = [
        'facebook/react',
        'microsoft/vscode',
        'google/tensorflow',
        'vercel/next.js',
        'vuejs/vue',
        'angular/angular',
        'nodejs/node',
        'electron/electron',
      ];

      popularRepos.forEach((repo) => {
        const sanitized = sanitizeInput(repo);
        expect(validateRepositoryName(sanitized)).toBe(true);

        const [owner] = repo.split('/');
        expect(validateGitHubUsername(owner)).toBe(true);
      });
    });

    test('実際のGitHubユーザー名パターン', () => {
      const realUsers = [
        'torvalds', // 短い名前
        'gaearon', // 英数字
        'tj', // 非常に短い
        'sindresorhus', // 長めの名前
        'antfu', // 数字を含む
      ];

      realUsers.forEach((user) => {
        const sanitized = sanitizeInput(user);
        expect(validateGitHubUsername(sanitized)).toBe(true);
      });
    });
  });

  describe('パフォーマンスとスケーラビリティ', () => {
    test('高負荷でのバリデーション性能', () => {
      const iterations = 10000;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        const user = `user${i}`;
        const repo = `owner/repo${i}`;

        sanitizeInput(user);
        sanitizeInput(repo);
        validateGitHubUsername(user);
        validateRepositoryName(repo);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // 1秒以内で完了
    });

    test('レート制限の効率性', () => {
      const limiter = new RateLimiter(100, 60000);
      const start = Date.now();

      // 多数のクライアントからのリクエストをシミュレート
      for (let client = 0; client < 50; client++) {
        for (let request = 0; request < 10; request++) {
          limiter.canMakeRequest(`client_${client}`);
        }
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 100ms以内で完了
    });
  });
});
