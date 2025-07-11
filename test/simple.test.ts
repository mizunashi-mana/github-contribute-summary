import { validateGitHubUsername, validateRepositoryName, sanitizeInput } from '@/lib/security';

describe('API正常動作検証テスト', () => {
  describe('GitHubユーザー名検証', () => {
    test('有効なユーザー名を受け入れる', () => {
      expect(validateGitHubUsername('octocat')).toBe(true);
      expect(validateGitHubUsername('test-user')).toBe(true);
      expect(validateGitHubUsername('user123')).toBe(true);
    });

    test('無効なユーザー名を拒否する', () => {
      expect(validateGitHubUsername('')).toBe(false);
      expect(validateGitHubUsername('-user')).toBe(false);
      expect(validateGitHubUsername('user-')).toBe(false);
      expect(validateGitHubUsername('user--name')).toBe(false);
    });
  });

  describe('リポジトリ名検証', () => {
    test('有効なリポジトリ名を受け入れる', () => {
      expect(validateRepositoryName('octocat/Hello-World')).toBe(true);
      expect(validateRepositoryName('user/repo.name')).toBe(true);
      expect(validateRepositoryName('org/my_project')).toBe(true);
    });

    test('無効なリポジトリ名を拒否する', () => {
      expect(validateRepositoryName('')).toBe(false);
      expect(validateRepositoryName('no-slash')).toBe(false);
      expect(validateRepositoryName('too/many/slashes')).toBe(false);
    });
  });

  describe('入力サニタイズ', () => {
    test('危険な文字を削除し、スラッシュを保持する', () => {
      expect(sanitizeInput('owner/repository')).toBe('owner/repository');
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeInput('user"name')).toBe('username');
      expect(sanitizeInput('user&name')).toBe('username');
    });

    test('前後の空白を削除する', () => {
      expect(sanitizeInput('  owner/repo  ')).toBe('owner/repo');
    });
  });

  describe('APIエンドポイント要件検証', () => {
    test('実際のGitHubリポジトリ形式を検証', () => {
      const testCases = [
        'facebook/react',
        'microsoft/TypeScript',
        'vercel/next.js',
        'octocat/Hello-World',
      ];

      testCases.forEach((repo) => {
        expect(validateRepositoryName(repo)).toBe(true);
      });
    });

    test('実際のGitHubユーザー名を検証', () => {
      const testCases = [
        'octocat',
        'torvalds',
        'gaearon',
        'tj',
      ];

      testCases.forEach((user) => {
        expect(validateGitHubUsername(user)).toBe(true);
      });
    });

    test('不正なAPI入力を拒否', () => {
      const maliciousInputs = [
        '<script>',
        'user"name',
        'path\\to\\file',
        'user&param=value',
      ];

      maliciousInputs.forEach((input) => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('"');
        expect(sanitized).not.toContain('\\');
        expect(sanitized).not.toContain('&');
      });
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量の入力を効率的に処理', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        validateGitHubUsername('testuser' + i);
        validateRepositoryName('owner/repo' + i);
        sanitizeInput('test input ' + i);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 100ms以内で完了
    });
  });
});
