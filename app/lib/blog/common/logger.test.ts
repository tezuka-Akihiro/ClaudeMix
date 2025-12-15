import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEBUG_MODE, debugLog, errorLog } from '~/lib/blog/common/logger';

describe('logger - Environment-aware logging utility', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('DEBUG_MODE constant', () => {
    it('should be boolean', () => {
      expect(typeof DEBUG_MODE).toBe('boolean');
    });
  });

  describe('debugLog function', () => {
    it('should call console.log when DEBUG_MODE is true', () => {
      // Note: DEBUG_MODEは環境変数で決まるため、実際の値をテスト
      debugLog('Test message', 'arg1', 'arg2');

      if (DEBUG_MODE) {
        expect(consoleLogSpy).toHaveBeenCalledWith('Test message', 'arg1', 'arg2');
      } else {
        expect(consoleLogSpy).not.toHaveBeenCalled();
      }
    });

    it('should handle message without arguments', () => {
      debugLog('Simple message');

      if (DEBUG_MODE) {
        expect(consoleLogSpy).toHaveBeenCalledWith('Simple message');
      } else {
        expect(consoleLogSpy).not.toHaveBeenCalled();
      }
    });

    it('should handle multiple arguments of different types', () => {
      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      debugLog('Complex message', obj, arr, 123, true);

      if (DEBUG_MODE) {
        expect(consoleLogSpy).toHaveBeenCalledWith('Complex message', obj, arr, 123, true);
      } else {
        expect(consoleLogSpy).not.toHaveBeenCalled();
      }
    });
  });

  describe('errorLog function', () => {
    it('should always call console.error regardless of DEBUG_MODE', () => {
      const error = new Error('Test error');
      errorLog('Error message', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error message', error);
    });

    it('should log stack trace when DEBUG_MODE is true and error is Error instance', () => {
      const error = new Error('Test error with stack');
      errorLog('Stack trace test', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace test', error);
      if (DEBUG_MODE) {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Stack:', error.stack);
      }
    });

    it('should log cause when DEBUG_MODE is true and error has cause', () => {
      const cause = new Error('Root cause');
      const error = new Error('Error with cause', { cause });
      errorLog('Cause test', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Cause test', error);
      if (DEBUG_MODE) {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Cause:', cause);
      }
    });

    it('should handle non-Error objects', () => {
      const errorObj = { message: 'Not an Error instance' };
      errorLog('Non-error object', errorObj);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Non-error object', errorObj);
      // non-Errorの場合、stackやcauseのログは出ない
    });

    it('should handle string errors', () => {
      errorLog('String error test', 'Simple string error');

      expect(consoleErrorSpy).toHaveBeenCalledWith('String error test', 'Simple string error');
    });

    it('should handle null or undefined errors', () => {
      errorLog('Null error', null);
      errorLog('Undefined error', undefined);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Null error', null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Undefined error', undefined);
    });
  });
});
