// copyToClipboard.test.ts - copyToClipboardユーティリティのテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './copyToClipboard';

describe('copyToClipboard', () => {
  beforeEach(() => {
    // DOM環境をクリーンアップ
    document.body.innerHTML = '';

    // execCommandをモック（JSDOMには存在しないため）
    if (!document.execCommand) {
      document.execCommand = vi.fn().mockReturnValue(true) as any;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const result = await copyToClipboard('test-path.md');

    expect(writeTextMock).toHaveBeenCalledWith('test-path.md');
    expect(result).toBe(true);
  });

  it('returns true when clipboard API succeeds', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const result = await copyToClipboard('develop/flow-auditor/common/func-spec.md');

    expect(result).toBe(true);
  });

  it('falls back to execCommand when clipboard API fails', async () => {
    // Clipboard APIを失敗させる
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    // execCommandをモック
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const result = await copyToClipboard('test-path.md');

    expect(writeTextMock).toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
  });

  it('falls back to execCommand when clipboard API is not available', async () => {
    // Clipboard APIを削除
    Object.assign(navigator, {
      clipboard: undefined,
    });

    // execCommandをモック
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const result = await copyToClipboard('test-path.md');

    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
  });

  it('returns false when both methods fail', async () => {
    // Clipboard APIを失敗させる
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    // execCommandも失敗させる
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(false);

    const result = await copyToClipboard('test-path.md');

    expect(result).toBe(false);
  });

  it('creates and removes textarea element when using execCommand fallback', async () => {
    // Clipboard APIを削除
    Object.assign(navigator, {
      clipboard: undefined,
    });

    // execCommandをモック
    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    // textareaの追加/削除をスパイ
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    await copyToClipboard('test-path.md');

    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);

    // textareaが削除されていることを確認
    const textareas = document.querySelectorAll('textarea');
    expect(textareas.length).toBe(0);
  });

  it('sets correct value to textarea when using execCommand fallback', async () => {
    // Clipboard APIを削除
    Object.assign(navigator, {
      clipboard: undefined,
    });

    // execCommandをモック
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => {
      // execCommand実行時にtextareaの値を確認
      const textarea = document.querySelector('textarea');
      expect(textarea?.value).toBe('develop/flow-auditor/common/func-spec.md');
      return true;
    });

    await copyToClipboard('develop/flow-auditor/common/func-spec.md');

    expect(execCommandSpy).toHaveBeenCalled();
  });

  it('handles execCommand exception gracefully', async () => {
    // Clipboard APIを削除
    Object.assign(navigator, {
      clipboard: undefined,
    });

    // execCommandで例外をスロー
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('execCommand not supported');
    });

    const result = await copyToClipboard('test-path.md');

    expect(result).toBe(false);
  });
});
