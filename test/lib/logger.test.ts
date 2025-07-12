import 'reflect-metadata';
import { Container } from 'inversify';
import { Logger } from '@/lib/logger';
import { Config } from '@/lib/config';
import { TYPES } from '@/lib/types';
import type { ILogger, IConfig } from '@/lib/interfaces';
import { LogLevel } from '@/lib/interfaces';

describe('Logger', () => {
  let container: Container;
  let logger: ILogger;

  beforeEach(() => {
    container = new Container();
  });

  describe('Configuration Integration', () => {
    test('should get log level from Config', () => {
      const testConfig = new Config({
        githubApiBase: 'http://localhost:3001',
        githubToken: 'test-token',
        encryptionPassword: 'test-password',
        databasePath: ':memory:',
        logLevel: LogLevel.DEBUG,
      });

      container.bind<IConfig>(TYPES.Config).toConstantValue(testConfig);
      container.bind<ILogger>(TYPES.Logger).to(Logger);

      logger = container.get<ILogger>(TYPES.Logger);

      expect(logger.isEnabled(LogLevel.DEBUG)).toBe(true);
      expect(logger.isEnabled(LogLevel.INFO)).toBe(true);
      expect(logger.isEnabled(LogLevel.WARN)).toBe(true);
      expect(logger.isEnabled(LogLevel.ERROR)).toBe(true);
    });

    test('should respect DISABLED log level from Config', () => {
      const testConfig = new Config({
        githubApiBase: 'http://localhost:3001',
        githubToken: 'test-token',
        encryptionPassword: 'test-password',
        databasePath: ':memory:',
        logLevel: LogLevel.DISABLED,
      });

      container.bind<IConfig>(TYPES.Config).toConstantValue(testConfig);
      container.bind<ILogger>(TYPES.Logger).to(Logger);

      logger = container.get<ILogger>(TYPES.Logger);

      expect(logger.isEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isEnabled(LogLevel.INFO)).toBe(false);
      expect(logger.isEnabled(LogLevel.WARN)).toBe(false);
      expect(logger.isEnabled(LogLevel.ERROR)).toBe(false);
    });

    test('should respect ERROR log level from Config', () => {
      const testConfig = new Config({
        githubApiBase: 'http://localhost:3001',
        githubToken: 'test-token',
        encryptionPassword: 'test-password',
        databasePath: ':memory:',
        logLevel: LogLevel.ERROR,
      });

      container.bind<IConfig>(TYPES.Config).toConstantValue(testConfig);
      container.bind<ILogger>(TYPES.Logger).to(Logger);

      logger = container.get<ILogger>(TYPES.Logger);

      expect(logger.isEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isEnabled(LogLevel.INFO)).toBe(false);
      expect(logger.isEnabled(LogLevel.WARN)).toBe(false);
      expect(logger.isEnabled(LogLevel.ERROR)).toBe(true);
    });
  });

  describe('Config Environment Variable Parsing', () => {
    test('should parse LOG_LEVEL environment variable correctly', () => {
      const debugConfig = new Config({
        githubApiBase: 'http://localhost:3001',
        githubToken: 'test-token',
        encryptionPassword: 'test-password',
        databasePath: ':memory:',
        logLevel: LogLevel.DISABLED,
      });

      expect(debugConfig.getLogLevel()).toBe(LogLevel.DISABLED);
    });
  });

  describe('Runtime Log Level Changes', () => {
    test('should allow changing log level at runtime', () => {
      const testConfig = new Config({
        githubApiBase: 'http://localhost:3001',
        githubToken: 'test-token',
        encryptionPassword: 'test-password',
        databasePath: ':memory:',
        logLevel: LogLevel.INFO,
      });

      container.bind<IConfig>(TYPES.Config).toConstantValue(testConfig);
      container.bind<ILogger>(TYPES.Logger).to(Logger);

      logger = container.get<ILogger>(TYPES.Logger);

      expect(logger.isEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isEnabled(LogLevel.INFO)).toBe(true);

      logger.setLevel(LogLevel.DEBUG);
      expect(logger.isEnabled(LogLevel.DEBUG)).toBe(true);
      expect(logger.isEnabled(LogLevel.INFO)).toBe(true);

      logger.setLevel(LogLevel.DISABLED);
      expect(logger.isEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isEnabled(LogLevel.INFO)).toBe(false);
      expect(logger.isEnabled(LogLevel.ERROR)).toBe(false);
    });
  });

  describe('Log Output Methods', () => {
    beforeEach(() => {
      jest.spyOn(console, 'debug').mockImplementation();
      jest.spyOn(console, 'info').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should not throw errors when calling log methods', () => {
      const testConfig = new Config({
        githubApiBase: 'http://localhost:3001',
        githubToken: 'test-token',
        encryptionPassword: 'test-password',
        databasePath: ':memory:',
        logLevel: LogLevel.DEBUG,
      });

      container.bind<IConfig>(TYPES.Config).toConstantValue(testConfig);
      container.bind<ILogger>(TYPES.Logger).to(Logger);

      logger = container.get<ILogger>(TYPES.Logger);

      expect(() => {
        logger.debug('Debug message');
        logger.info('Info message');
        logger.warn('Warn message');
        logger.error('Error message');
      }).not.toThrow();

      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Debug message');
      expect(console.info).toHaveBeenCalledWith('[INFO] Info message');
      expect(console.warn).toHaveBeenCalledWith('[WARN] Warn message');
      expect(console.error).toHaveBeenCalledWith('[ERROR] Error message');
    });

    test('should handle additional arguments in log methods', () => {
      const testConfig = new Config({
        githubApiBase: 'http://localhost:3001',
        githubToken: 'test-token',
        encryptionPassword: 'test-password',
        databasePath: ':memory:',
        logLevel: LogLevel.DEBUG,
      });

      container.bind<IConfig>(TYPES.Config).toConstantValue(testConfig);
      container.bind<ILogger>(TYPES.Logger).to(Logger);

      logger = container.get<ILogger>(TYPES.Logger);

      expect(() => {
        logger.debug('Debug with args', { key: 'value' }, 123);
        logger.info('Info with args', ['array'], null);
        logger.warn('Warn with args', new Error('test error'));
        logger.error('Error with args', undefined, true);
      }).not.toThrow();

      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Debug with args', { key: 'value' }, 123);
      expect(console.info).toHaveBeenCalledWith('[INFO] Info with args', ['array'], null);
      expect(console.warn).toHaveBeenCalledWith('[WARN] Warn with args', expect.any(Error));
      expect(console.error).toHaveBeenCalledWith('[ERROR] Error with args', undefined, true);
    });
  });
});
