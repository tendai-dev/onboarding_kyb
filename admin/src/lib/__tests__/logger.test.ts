import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as sentry from '../sentry';

// Mock Sentry
vi.mock('../sentry', () => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Mock logger module - need to import after env is set
describe('Logger', () => {
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('in development', () => {
    interface Logger {
      debug: (message: string, data?: Record<string, unknown>) => void;
      info: (message: string, data?: Record<string, unknown>) => void;
      warn: (message: string, data?: Record<string, unknown>) => void;
      error: (error: Error, message: string, data?: Record<string, unknown>) => void;
    }
    let logger: Logger;

    beforeEach(async () => {
      vi.stubEnv('NODE_ENV', 'development');
      // Reload logger module after env is set
      vi.resetModules();
      const loggerModule = await import('../logger');
      logger = loggerModule.logger;
    });

    it('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] Debug message', {
        key: 'value',
      });
    });

    it('should log info messages', () => {
      logger.info('Info message', { key: 'value' });
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] Info message', {
        key: 'value',
      });
    });

    it('should log warnings', () => {
      logger.warn('Warning message', { tags: { type: 'test' } });
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] Warning message');
    });

    it('should log errors', () => {
      const error = new Error('Test error');
      logger.error(error, 'Error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] Error message', error);
    });
  });

  describe('in production', () => {
    interface Logger {
      debug: (message: string, data?: Record<string, unknown>) => void;
      info: (message: string, data?: Record<string, unknown>) => void;
      warn: (message: string, data?: Record<string, unknown>) => void;
      error: (error: Error, message: string, data?: Record<string, unknown>) => void;
    }
    let logger: Logger;

    beforeEach(async () => {
      vi.stubEnv('NODE_ENV', 'production');
      // Reload logger module after env is set
      vi.resetModules();
      const loggerModule = await import('../logger');
      logger = loggerModule.logger;
    });

    it('should not log debug messages', () => {
      logger.debug('Debug message');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should add breadcrumbs for info messages', () => {
      logger.info('Info message', { key: 'value' });
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith('Info message', 'info', 'info', {
        args: [{ key: 'value' }],
      });
    });

    it('should report warnings to Sentry', () => {
      logger.warn('Warning message', { tags: { type: 'test' } });
      expect(sentry.reportWarning).toHaveBeenCalledWith('Warning message', {
        tags: { type: 'test' },
        extra: undefined,
      });
    });

    it('should report errors to Sentry', () => {
      const error = new Error('Test error');
      logger.error(error, 'Error message', { tags: { type: 'test' } });
      expect(sentry.reportError).toHaveBeenCalledWith(error, {
        tags: { type: 'test' },
        extra: undefined,
        level: 'error',
      });
    });
  });
});
