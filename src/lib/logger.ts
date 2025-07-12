import { injectable, inject } from 'inversify';
import type { ILogger, IConfig } from '@/lib/interfaces';
import { LogLevel } from '@/lib/interfaces';
import { TYPES } from '@/lib/types';

@injectable()
export class Logger implements ILogger {
  private currentLevel: LogLevel;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.currentLevel = this.config.getLogLevel();
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  isEnabled(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isEnabled(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.isEnabled(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.isEnabled(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.isEnabled(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}
