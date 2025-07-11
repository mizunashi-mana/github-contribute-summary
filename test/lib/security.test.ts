import {
  validateGitHubUsername,
  validateRepositoryName,
  sanitizeInput,
  RateLimiter,
} from '@/lib/security';

describe('Security utilities', () => {
  describe('validateGitHubUsername', () => {
    test('有効なユーザー名を受け入れる', () => {
      expect(validateGitHubUsername('octocat')).toBe(true);
      expect(validateGitHubUsername('test-user')).toBe(true);
      expect(validateGitHubUsername('user123')).toBe(true);
      expect(validateGitHubUsername('a')).toBe(true);
    });

    test('無効なユーザー名を拒否する', () => {
      expect(validateGitHubUsername('')).toBe(false);
      expect(validateGitHubUsername('-user')).toBe(false);
      expect(validateGitHubUsername('user-')).toBe(false);
      expect(validateGitHubUsername('user--name')).toBe(false);
      expect(validateGitHubUsername('user@name')).toBe(false);
      expect(validateGitHubUsername('a'.repeat(40))).toBe(false); // 40文字は無効
    });
  });

  describe('validateRepositoryName', () => {
    test('有効なリポジトリ名を受け入れる', () => {
      expect(validateRepositoryName('octocat/Hello-World')).toBe(true);
      expect(validateRepositoryName('user/repo.name')).toBe(true);
      expect(validateRepositoryName('org/my_project')).toBe(true);
      expect(validateRepositoryName('test/repo-123')).toBe(true);
    });

    test('無効なリポジトリ名を拒否する', () => {
      expect(validateRepositoryName('')).toBe(false);
      expect(validateRepositoryName('no-slash')).toBe(false);
      expect(validateRepositoryName('too/many/slashes')).toBe(false);
      expect(validateRepositoryName('/empty-owner')).toBe(false);
      expect(validateRepositoryName('owner/')).toBe(false);
      expect(validateRepositoryName('invalid-user@/repo')).toBe(false);
    });

    test('長すぎるリポジトリ名を拒否する', () => {
      const longName = 'a'.repeat(101);
      expect(validateRepositoryName(`octocat/${longName}`)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('危険な文字を削除する', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeInput('user"name')).toBe('username');
      expect(sanitizeInput('path\\to\\file')).toBe('pathtofile');
      expect(sanitizeInput('user&name')).toBe('username');
    });

    test('スラッシュを保持する', () => {
      expect(sanitizeInput('owner/repository')).toBe('owner/repository');
      expect(sanitizeInput(' owner/repository ')).toBe('owner/repository');
    });

    test('空白をトリムする', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
      expect(sanitizeInput('\t\ntest\r\n')).toBe('test');
    });
  });

  describe('RateLimiter', () => {
    test('制限内のリクエストを許可する', () => {
      const limiter = new RateLimiter(5, 60000);

      expect(limiter.canMakeRequest('client1')).toBe(true);
      expect(limiter.canMakeRequest('client1')).toBe(true);
      expect(limiter.canMakeRequest('client1')).toBe(true);
    });

    test('制限を超えるリクエストを拒否する', () => {
      const limiter = new RateLimiter(2, 60000);

      expect(limiter.canMakeRequest('client1')).toBe(true);
      expect(limiter.canMakeRequest('client1')).toBe(true);
      expect(limiter.canMakeRequest('client1')).toBe(false);
    });

    test('時間経過後にリセットされる', () => {
      jest.useFakeTimers();
      const limiter = new RateLimiter(1, 100); // 100ms window

      expect(limiter.canMakeRequest('client1')).toBe(true);
      expect(limiter.canMakeRequest('client1')).toBe(false);

      // 150ms進める
      jest.advanceTimersByTime(150);

      expect(limiter.canMakeRequest('client1')).toBe(true);

      jest.useRealTimers();
    });
  });
});
