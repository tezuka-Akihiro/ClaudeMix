// RefreshButton.test.tsx - UI層: ユニットテスト
// リフレッシュボタンのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RefreshButton from './RefreshButton';

describe('RefreshButton', () => {
  const mockOnRefresh = vi.fn();

  describe('レンダリング', () => {
    it('button要素が正しく表示される', () => {
      render(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      const button = screen.getByTestId('refresh-button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('type="button"属性が設定されている', () => {
      render(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      const button = screen.getByTestId('refresh-button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('正しいCSSクラスが適用されている', () => {
      render(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      const button = screen.getByTestId('refresh-button');
      expect(button).toHaveClass('button-primary');
    });
  });

  describe('通常状態 (isLoading=false)', () => {
    it('"Refresh" というテキストが表示される', () => {
      render(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      const button = screen.getByTestId('refresh-button');
      expect(button).toHaveTextContent('Refresh');
    });

    it('ボタンが有効化されている', () => {
      render(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      const button = screen.getByTestId('refresh-button');
      expect(button).not.toBeDisabled();
    });

    it('クリック時にonRefreshが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleRefresh = vi.fn();

      render(<RefreshButton isLoading={false} onRefresh={handleRefresh} />);

      const button = screen.getByTestId('refresh-button');
      await user.click(button);

      expect(handleRefresh).toHaveBeenCalledTimes(1);
    });

    it('複数回クリックで複数回onRefreshが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleRefresh = vi.fn();

      render(<RefreshButton isLoading={false} onRefresh={handleRefresh} />);

      const button = screen.getByTestId('refresh-button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleRefresh).toHaveBeenCalledTimes(3);
    });
  });

  describe('ローディング状態 (isLoading=true)', () => {
    it('"Loading..." というテキストが表示される', () => {
      render(<RefreshButton isLoading={true} onRefresh={mockOnRefresh} />);

      const button = screen.getByTestId('refresh-button');
      expect(button).toHaveTextContent('Loading...');
    });

    it('ボタンが無効化されている', () => {
      render(<RefreshButton isLoading={true} onRefresh={mockOnRefresh} />);

      const button = screen.getByTestId('refresh-button');
      expect(button).toBeDisabled();
    });

    it('無効化状態ではonRefreshが呼ばれない', async () => {
      const user = userEvent.setup();
      const handleRefresh = vi.fn();

      render(<RefreshButton isLoading={true} onRefresh={handleRefresh} />);

      const button = screen.getByTestId('refresh-button');

      // disabledボタンをクリックしようとしても効果がない
      try {
        await user.click(button);
      } catch (e) {
        // エラーが発生する可能性があるが、onRefreshは呼ばれないことを確認
      }

      expect(handleRefresh).not.toHaveBeenCalled();
    });
  });

  describe('状態切り替え', () => {
    it('isLoadingの変更でテキストが切り替わる', () => {
      const { rerender } = render(
        <RefreshButton isLoading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByTestId('refresh-button')).toHaveTextContent('Refresh');

      rerender(<RefreshButton isLoading={true} onRefresh={mockOnRefresh} />);

      expect(screen.getByTestId('refresh-button')).toHaveTextContent('Loading...');
    });

    it('isLoadingの変更でdisabled状態が切り替わる', () => {
      const { rerender } = render(
        <RefreshButton isLoading={false} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByTestId('refresh-button')).not.toBeDisabled();

      rerender(<RefreshButton isLoading={true} onRefresh={mockOnRefresh} />);

      expect(screen.getByTestId('refresh-button')).toBeDisabled();

      rerender(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      expect(screen.getByTestId('refresh-button')).not.toBeDisabled();
    });
  });

  describe('アクセシビリティ', () => {
    it('getByRole("button")で取得できる', () => {
      render(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('ボタンのテキストでgetByTextで取得できる', () => {
      render(<RefreshButton isLoading={false} onRefresh={mockOnRefresh} />);

      const button = screen.getByText('Refresh');
      expect(button).toBeInTheDocument();
    });

    it('ローディング時のテキストでgetByTextで取得できる', () => {
      render(<RefreshButton isLoading={true} onRefresh={mockOnRefresh} />);

      const button = screen.getByText('Loading...');
      expect(button).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('onRefreshがundefinedでもエラーが発生しない', () => {
      expect(() => {
        render(<RefreshButton isLoading={false} onRefresh={undefined as any} />);
      }).not.toThrow();
    });

    it('onRefreshが複数回変更されても問題なく動作する', async () => {
      const user = userEvent.setup();
      const handleRefresh1 = vi.fn();
      const handleRefresh2 = vi.fn();

      const { rerender } = render(
        <RefreshButton isLoading={false} onRefresh={handleRefresh1} />
      );

      const button = screen.getByTestId('refresh-button');
      await user.click(button);

      expect(handleRefresh1).toHaveBeenCalledTimes(1);
      expect(handleRefresh2).not.toHaveBeenCalled();

      rerender(<RefreshButton isLoading={false} onRefresh={handleRefresh2} />);

      await user.click(button);

      expect(handleRefresh1).toHaveBeenCalledTimes(1); // 変わらず
      expect(handleRefresh2).toHaveBeenCalledTimes(1);
    });
  });
});
