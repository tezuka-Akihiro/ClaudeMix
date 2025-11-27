// LastUpdatedLabel.test.tsx - UI層: ユニットテスト
// 最終更新時刻ラベルのテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LastUpdatedLabel from './LastUpdatedLabel';

describe('LastUpdatedLabel', () => {
  beforeEach(() => {
    // 現在時刻を固定: 2025-11-10 15:30:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-10T15:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('レンダリング', () => {
    it('span要素が正しく表示される', () => {
      const lastUpdated = new Date('2025-11-10T15:20:00');

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('SPAN');
    });

    it('正しいCSSクラスが適用されている', () => {
      const lastUpdated = new Date('2025-11-10T15:20:00');

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveClass('last-updated-label');
    });

    it('"last update:" というプレフィックスが表示される', () => {
      const lastUpdated = new Date('2025-11-10T15:20:00');

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent(/^last update:/);
    });
  });

  describe('タイムスタンプフォーマット: "たった今"', () => {
    it('1分未満の場合、"たった今" と表示される', () => {
      const lastUpdated = new Date('2025-11-10T15:29:30'); // 30秒前

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent('last update: たった今');
    });

    it('境界値: 59秒前の場合、"たった今" と表示される', () => {
      const lastUpdated = new Date(Date.now() - 59000); // 59秒前

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent('last update: たった今');
    });

    it('境界値: 0秒前 (現在時刻と同じ) の場合、"たった今" と表示される', () => {
      const lastUpdated = new Date(); // 現在時刻

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent('last update: たった今');
    });
  });

  describe('タイムスタンプフォーマット: "HH:MM"', () => {
    it('1分以上前の場合、"HH:MM" 形式で表示される', () => {
      const lastUpdated = new Date('2025-11-10T15:20:00'); // 10分前

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent('last update: 15:20');
    });

    it('境界値: ちょうど1分前の場合、"HH:MM" 形式で表示される', () => {
      const lastUpdated = new Date(Date.now() - 60000); // 60秒前

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent('last update: 15:29');
    });

    it('1桁の時・分が0埋めされる (例: 09:05)', () => {
      // 現在時刻を09:06に設定
      vi.setSystemTime(new Date('2025-11-10T09:06:00'));
      const lastUpdated = new Date('2025-11-10T09:05:00'); // 1分前

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent('last update: 09:05');
    });

    it('0時台が正しくフォーマットされる (例: 00:00)', () => {
      // 現在時刻を00:01に設定
      vi.setSystemTime(new Date('2025-11-10T00:01:00'));
      const lastUpdated = new Date('2025-11-09T00:00:00'); // 前日の0時

      render(<LastUpdatedLabel lastUpdated={lastUpdated} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toHaveTextContent('last update: 00:00');
    });
  });

  describe('異常系', () => {
    it('無効なDateオブジェクトの場合でもエラーが発生せず表示される', () => {
      const invalidDate = new Date('invalid-date-string');

      render(<LastUpdatedLabel lastUpdated={invalidDate} />);

      const label = screen.getByTestId('last-updated-label');
      expect(label).toBeInTheDocument();
      // 実装の振る舞いに依存するため、表示内容は検証しない
    });
  });

  describe('表示の一貫性', () => {
    it('同じlastUpdatedで複数回レンダリングしても同じ表示になる', () => {
      const lastUpdated = new Date('2025-11-10T15:20:00');

      const { rerender } = render(<LastUpdatedLabel lastUpdated={lastUpdated} />);
      const label1Text = screen.getByTestId('last-updated-label').textContent;

      rerender(<LastUpdatedLabel lastUpdated={lastUpdated} />);
      const label2Text = screen.getByTestId('last-updated-label').textContent;

      expect(label1Text).toBe(label2Text);
    });

    it('異なるlastUpdatedで異なる表示になる', () => {
      const lastUpdated1 = new Date('2025-11-10T15:20:00');
      const lastUpdated2 = new Date('2025-11-10T14:30:00');

      const { rerender } = render(<LastUpdatedLabel lastUpdated={lastUpdated1} />);
      const label1Text = screen.getByTestId('last-updated-label').textContent;

      rerender(<LastUpdatedLabel lastUpdated={lastUpdated2} />);
      const label2Text = screen.getByTestId('last-updated-label').textContent;

      expect(label1Text).not.toBe(label2Text);
    });
  });

  describe('プロパティの変更', () => {
    it('lastUpdatedが更新されると表示も更新される', () => {
      const initialDate = new Date('2025-11-10T15:20:00');
      const updatedDate = new Date('2025-11-10T14:30:00');

      const { rerender } = render(<LastUpdatedLabel lastUpdated={initialDate} />);

      expect(screen.getByTestId('last-updated-label')).toHaveTextContent('last update: 15:20');

      rerender(<LastUpdatedLabel lastUpdated={updatedDate} />);

      expect(screen.getByTestId('last-updated-label')).toHaveTextContent('last update: 14:30');
    });

    it('"たった今" から "HH:MM" への変更が正しく表示される', () => {
      const justNow = new Date('2025-11-10T15:29:30'); // 30秒前
      const tenMinutesAgo = new Date('2025-11-10T15:20:00'); // 10分前

      const { rerender } = render(<LastUpdatedLabel lastUpdated={justNow} />);

      expect(screen.getByTestId('last-updated-label')).toHaveTextContent('last update: たった今');

      rerender(<LastUpdatedLabel lastUpdated={tenMinutesAgo} />);

      expect(screen.getByTestId('last-updated-label')).toHaveTextContent('last update: 15:20');
    });
  });
});
