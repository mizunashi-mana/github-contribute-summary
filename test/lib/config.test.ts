import 'reflect-metadata';
import { Config, initConfig } from '@/lib/config';
import { LogLevel } from '@/lib/interfaces';

describe('Config', () => {
  describe('Config Class', () => {
    test('should initialize with all parameters', () => {
      const config = new Config({
        githubApiBase: 'https://api.github.com',
        githubToken: 'ghp_test123',
        encryptionPassword: 'secret',
        databasePath: '/tmp/test.db',
        logLevel: LogLevel.DEBUG,
      });

      expect(config.getGitHubApiBase()).toBe('https://api.github.com');
      expect(config.getGitHubToken()).toBe('ghp_test123');
      expect(config.getEncryptionPassword()).toBe('secret');
      expect(config.getDatabasePath()).toBe('/tmp/test.db');
      expect(config.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    test('should handle undefined values', () => {
      const config = new Config({
        githubApiBase: 'https://api.github.com',
        githubToken: undefined,
        encryptionPassword: undefined,
        databasePath: ':memory:',
        logLevel: LogLevel.INFO,
      });

      expect(config.getGitHubApiBase()).toBe('https://api.github.com');
      expect(config.getGitHubToken()).toBeUndefined();
      expect(config.getEncryptionPassword()).toBeUndefined();
      expect(config.getDatabasePath()).toBe(':memory:');
      expect(config.getLogLevel()).toBe(LogLevel.INFO);
    });

    test('should handle all log levels', () => {
      const logLevels = [
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.DISABLED,
      ];

      logLevels.forEach((level) => {
        const config = new Config({
          githubApiBase: 'https://api.github.com',
          githubToken: undefined,
          encryptionPassword: undefined,
          databasePath: ':memory:',
          logLevel: level,
        });

        expect(config.getLogLevel()).toBe(level);
      });
    });
  });

  describe('initConfig function', () => {
    test('should use default values when environment variables are not set', () => {
      const config = initConfig({});

      expect(config.getGitHubApiBase()).toBe('http://localhost:3001');
      expect(config.getGitHubToken()).toBeUndefined();
      expect(config.getEncryptionPassword()).toBeUndefined();
      expect(config.getDatabasePath()).toBe('github_data.db');
      expect(config.getLogLevel()).toBe(LogLevel.INFO);
    });

    test('should use environment variables when provided', () => {
      const env = {
        GITHUB_API_BASE: 'https://api.github.com',
        GITHUB_TOKEN: 'ghp_dummy456',
        ENCRYPTION_PASSWORD: 'dummy_password',
        DATABASE_PATH: '/var/lib/app.db',
        LOG_LEVEL: 'DEBUG',
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('https://api.github.com');
      expect(config.getGitHubToken()).toBe('ghp_dummy456');
      expect(config.getEncryptionPassword()).toBe('dummy_password');
      expect(config.getDatabasePath()).toBe('/var/lib/app.db');
      expect(config.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    test('should handle partial environment variables', () => {
      const env = {
        GITHUB_TOKEN: 'ghp_dummypartial',
        LOG_LEVEL: 'WARN',
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('http://localhost:3001');
      expect(config.getGitHubToken()).toBe('ghp_dummypartial');
      expect(config.getEncryptionPassword()).toBeUndefined();
      expect(config.getDatabasePath()).toBe('github_data.db');
      expect(config.getLogLevel()).toBe(LogLevel.WARN);
    });

    test('should handle empty string environment variables', () => {
      const env = {
        GITHUB_API_BASE: '',
        GITHUB_TOKEN: '',
        ENCRYPTION_PASSWORD: '',
        DATABASE_PATH: '',
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('http://localhost:3001');
      expect(config.getGitHubToken()).toBe('');
      expect(config.getEncryptionPassword()).toBe('');
      expect(config.getDatabasePath()).toBe('github_data.db');
    });
  });

  describe('parseLogLevelFromEnv function', () => {
    test('should parse valid log levels correctly', () => {
      const testCases = [
        { input: 'DEBUG', expected: LogLevel.DEBUG },
        { input: 'debug', expected: LogLevel.DEBUG },
        { input: 'Info', expected: LogLevel.INFO },
        { input: 'WARN', expected: LogLevel.WARN },
        { input: 'ERROR', expected: LogLevel.ERROR },
        { input: 'DISABLED', expected: LogLevel.DISABLED },
        { input: 'DISABLE', expected: LogLevel.DISABLED },
        { input: 'OFF', expected: LogLevel.DISABLED },
      ];

      testCases.forEach(({ input, expected }) => {
        const config = initConfig({ LOG_LEVEL: input });
        expect(config.getLogLevel()).toBe(expected);
      });
    });

    test('should throw error for invalid log levels', () => {
      const invalidLevels = ['INVALID', 'TRACE', 'VERBOSE', '123', ''];

      invalidLevels.forEach((invalidLevel) => {
        expect(() => {
          initConfig({ LOG_LEVEL: invalidLevel });
        }).toThrow(`Invalid log level: ${invalidLevel}`);
      });
    });

    test('should handle case insensitive log levels', () => {
      const caseCombinations = [
        'debug', 'DEBUG', 'Debug', 'DeBuG',
        'info', 'INFO', 'Info', 'InFo',
        'warn', 'WARN', 'Warn', 'WaRn',
        'error', 'ERROR', 'Error', 'ErRoR',
        'disabled', 'DISABLED', 'Disabled', 'DiSaBlEd',
        'disable', 'DISABLE', 'Disable', 'DiSaBlE',
        'off', 'OFF', 'Off', 'OfF',
      ];

      caseCombinations.forEach((level) => {
        expect(() => {
          initConfig({ LOG_LEVEL: level });
        }).not.toThrow();
      });
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle undefined LOG_LEVEL correctly', () => {
      const config = initConfig({ LOG_LEVEL: undefined });
      expect(config.getLogLevel()).toBe(LogLevel.INFO);
    });

    test('should handle null values in environment', () => {
      const env: Record<string, string | undefined> = {
        GITHUB_API_BASE: undefined,
        GITHUB_TOKEN: undefined,
        ENCRYPTION_PASSWORD: undefined,
        DATABASE_PATH: undefined,
        LOG_LEVEL: undefined,
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('http://localhost:3001');
      expect(config.getGitHubToken()).toBeUndefined();
      expect(config.getEncryptionPassword()).toBeUndefined();
      expect(config.getDatabasePath()).toBe('github_data.db');
      expect(config.getLogLevel()).toBe(LogLevel.INFO);
    });

    test('should handle special characters in config values', () => {
      const env = {
        GITHUB_API_BASE: 'https://api.github.com:443/v3',
        GITHUB_TOKEN: 'ghp_1234567890adummy!@#$%^&*()',
        ENCRYPTION_PASSWORD: 'dummy_p@ssw0rd!@#$%^&*()',
        DATABASE_PATH: '/path/with spaces/and-special-chars.db',
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('https://api.github.com:443/v3');
      expect(config.getGitHubToken()).toBe('ghp_1234567890adummy!@#$%^&*()');
      expect(config.getEncryptionPassword()).toBe('dummy_p@ssw0rd!@#$%^&*()');
      expect(config.getDatabasePath()).toBe('/path/with spaces/and-special-chars.db');
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle production-like configuration', () => {
      const env = {
        GITHUB_API_BASE: 'https://api.github.com',
        GITHUB_TOKEN: 'ghp_1234567890adummy1234567890abcdef12345678',
        ENCRYPTION_PASSWORD: 'very-secure-dummy-password-123',
        DATABASE_PATH: '/var/lib/myapp/production.db',
        LOG_LEVEL: 'ERROR',
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('https://api.github.com');
      expect(config.getGitHubToken()).toBe('ghp_1234567890adummy1234567890abcdef12345678');
      expect(config.getEncryptionPassword()).toBe('very-secure-dummy-password-123');
      expect(config.getDatabasePath()).toBe('/var/lib/myapp/production.db');
      expect(config.getLogLevel()).toBe(LogLevel.ERROR);
    });

    test('should handle development configuration', () => {
      const env = {
        GITHUB_API_BASE: 'http://localhost:3001',
        GITHUB_TOKEN: 'ghp_dummy_token_12345',
        DATABASE_PATH: ':memory:',
        LOG_LEVEL: 'DEBUG',
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('http://localhost:3001');
      expect(config.getGitHubToken()).toBe('ghp_dummy_token_12345');
      expect(config.getEncryptionPassword()).toBeUndefined();
      expect(config.getDatabasePath()).toBe(':memory:');
      expect(config.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    test('should handle test configuration', () => {
      const env = {
        GITHUB_API_BASE: 'http://localhost:3001',
        GITHUB_TOKEN: 'ghp_test_token',
        ENCRYPTION_PASSWORD: 'test-password',
        DATABASE_PATH: ':memory:',
        LOG_LEVEL: 'DISABLED',
      };

      const config = initConfig(env);

      expect(config.getGitHubApiBase()).toBe('http://localhost:3001');
      expect(config.getGitHubToken()).toBe('ghp_test_token');
      expect(config.getEncryptionPassword()).toBe('test-password');
      expect(config.getDatabasePath()).toBe(':memory:');
      expect(config.getLogLevel()).toBe(LogLevel.DISABLED);
    });
  });
});
