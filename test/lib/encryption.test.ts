import { TokenEncryption, getDecryptedToken } from '@/lib/encryption';

describe('TokenEncryption', () => {
  let encryption: TokenEncryption;

  beforeEach(() => {
    encryption = new TokenEncryption();
  });

  describe('encrypt/decrypt', () => {
    test('トークンを正常に暗号化・復号化できる', () => {
      const token = 'ghp_test_token_1234567890abcdef';
      const password = 'test_password_123';

      const encrypted = encryption.encrypt(token, password);
      const decrypted = encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(token);
    });

    test('異なるパスワードでは復号化できない', () => {
      const token = 'ghp_test_token_1234567890abcdef';
      const password = 'correct_password';
      const wrongPassword = 'wrong_password';

      const encrypted = encryption.encrypt(token, password);

      expect(() => {
        encryption.decrypt(encrypted, wrongPassword);
      }).toThrow();
    });

    test('暗号化結果は毎回異なる', () => {
      const token = 'ghp_test_token_1234567890abcdef';
      const password = 'test_password';

      const encrypted1 = encryption.encrypt(token, password);
      const encrypted2 = encryption.encrypt(token, password);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encryption.decrypt(encrypted1, password)).toBe(token);
      expect(encryption.decrypt(encrypted2, password)).toBe(token);
    });

    test('デフォルトパスワードを使用する', () => {
      const originalEnv = process.env.ENCRYPTION_PASSWORD;
      process.env.ENCRYPTION_PASSWORD = 'env_password';

      const token = 'ghp_test_token';
      const encrypted = encryption.encrypt(token);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(token);

      process.env.ENCRYPTION_PASSWORD = originalEnv;
    });
  });

  describe('isEncrypted', () => {
    test('暗号化された文字列を正しく識別する', () => {
      const token = 'ghp_test_token';
      const encrypted = encryption.encrypt(token, 'password');

      expect(encryption.isEncrypted(encrypted)).toBe(true);
    });

    test('平文を正しく識別する', () => {
      expect(encryption.isEncrypted('ghp_plain_token')).toBe(false);
      expect(encryption.isEncrypted('not:encrypted:format')).toBe(false);
      expect(encryption.isEncrypted('invalid:format')).toBe(false);
      expect(encryption.isEncrypted('')).toBe(false);
    });

    test('無効な暗号化形式を拒否する', () => {
      expect(encryption.isEncrypted('invalid:hex:gg')).toBe(false);
      expect(encryption.isEncrypted('too:many:parts:here')).toBe(false);
    });
  });

  describe('getDecryptedToken', () => {
    test('暗号化されたトークンを復号化する', () => {
      const originalEnv = process.env.ENCRYPTION_PASSWORD;
      process.env.ENCRYPTION_PASSWORD = 'test_password';

      const token = 'ghp_test_token';
      const encrypted = encryption.encrypt(token, 'test_password');
      const result = getDecryptedToken(encrypted);

      expect(result).toBe(token);

      process.env.ENCRYPTION_PASSWORD = originalEnv;
    });

    test('平文トークンをそのまま返す', () => {
      const token = 'ghp_plain_token';
      const result = getDecryptedToken(token);

      expect(result).toBe(token);
    });

    test('undefined/null を処理する', () => {
      expect(getDecryptedToken(undefined)).toBeUndefined();
      expect(getDecryptedToken('')).toBeUndefined();
    });

    test('復号化エラーでundefinedを返す', () => {
      const originalError = console.error;
      console.error = jest.fn();

      // 無効な形式の暗号化データ（3つの部分だが無効な内容）
      const result = getDecryptedToken('aaa:bbb:ccc');

      expect(result).toBeUndefined();
      expect(console.error).toHaveBeenCalled();

      console.error = originalError;
    });
  });
});
