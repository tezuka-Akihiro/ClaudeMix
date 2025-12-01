// timestampFormatter.test.ts - 純粋ロジック層: ユニットテスト
// タイムスタンプフォーマット処理のテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimestamp } from './timestampFormatter';

describe('formatTimestamp', () => {
  beforeEach(() => {
    // 現在時刻を固定: 2025-11-10 15:30:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-10T15:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('正常系: "たった今" 表示', () => {
    it('1分未満 (30秒前) の場合、"たった今" を返す', () => {
      const timestamp = new Date('2025-11-10T15:29:30'); // 30秒前
      expect(formatTimestamp(timestamp)).toBe('たった今');
    });

    it('境界値: 59秒前の場合、"たった今" を返す', () => {
      const timestamp = new Date(Date.now() - 59000); // 59秒前
      expect(formatTimestamp(timestamp)).toBe('たった今');
    });

    it('境界値: 0秒前 (現在時刻と同じ) の場合、"たった今" を返す', () => {
      const timestamp = new Date(); // 現在時刻
      expect(formatTimestamp(timestamp)).toBe('たった今');
    });
  });

  describe('正常系: "HH:MM" 表示', () => {
    it('1分以上前の場合、"HH:MM" 形式を返す', () => {
      const timestamp = new Date('2025-11-10T15:20:00'); // 10分前
      expect(formatTimestamp(timestamp)).toBe('15:20');
    });

    it('境界値: ちょうど1分前 (60秒前) の場合、"HH:MM" 形式を返す', () => {
      const timestamp = new Date(Date.now() - 60000); // 60秒前
      expect(formatTimestamp(timestamp)).toBe('15:29');
    });

    it('境界値: 61秒前の場合、"HH:MM" 形式を返す', () => {
      const timestamp = new Date(Date.now() - 61000); // 61秒前
      expect(formatTimestamp(timestamp)).toBe('15:28');
    });

    it('1桁の時・分が0埋めされる (例: 09:05)', () => {
      const timestamp = new Date('2025-11-10T09:05:00');
      expect(formatTimestamp(timestamp)).toBe('09:05');
    });

    it('2桁の時・分が正しくフォーマットされる (例: 14:25)', () => {
      const timestamp = new Date('2025-11-10T14:25:00'); // 現在時刻15:30より過去
      expect(formatTimestamp(timestamp)).toBe('14:25');
    });

    it('0時台が正しくフォーマットされる (例: 00:00)', () => {
      const timestamp = new Date('2025-11-09T00:00:00'); // 前日の0時
      expect(formatTimestamp(timestamp)).toBe('00:00');
    });
  });

  describe('異常系: 無効な入力', () => {
    it('null を渡した場合、"--:--" を返す', () => {
      expect(formatTimestamp(null as any)).toBe('--:--');
    });

    it('undefined を渡した場合、"--:--" を返す', () => {
      expect(formatTimestamp(undefined as any)).toBe('--:--');
    });

    it('無効なDateオブジェクトを渡した場合、"--:--" を返す', () => {
      const invalidDate = new Date('invalid-date-string');
      expect(formatTimestamp(invalidDate)).toBe('--:--');
    });

    it('Date型ではないオブジェクトを渡した場合、"--:--" を返す', () => {
      expect(formatTimestamp({} as any)).toBe('--:--');
    });

    it('文字列を渡した場合、"--:--" を返す', () => {
      expect(formatTimestamp('2025-11-10' as any)).toBe('--:--');
    });

    it('数値を渡した場合、"--:--" を返す', () => {
      expect(formatTimestamp(1234567890 as any)).toBe('--:--');
    });
  });

  describe('純粋性の保証', () => {
    it('同じ入力に対して常に同じ出力を返す (決定論的)', () => {
      const timestamp = new Date('2025-11-10T15:20:00');
      const result1 = formatTimestamp(timestamp);
      const result2 = formatTimestamp(timestamp);
      const result3 = formatTimestamp(timestamp);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('入力されたDateオブジェクトを変更しない (イミュータブル)', () => {
      const timestamp = new Date('2025-11-10T15:20:00');
      const originalTime = timestamp.getTime();

      formatTimestamp(timestamp);

      expect(timestamp.getTime()).toBe(originalTime);
    });
  });
});
