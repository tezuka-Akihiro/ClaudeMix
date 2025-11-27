// Footer.test.tsx - UI層: ユニットテスト
// フッターコンテナのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from './Footer';

describe('Footer', () => {
  const mockOnRefresh = vi.fn();
  const mockOnRetry = vi.fn();

  describe('レンダリング', () => {
    it('footer要素が正しく表示される', () => {
      render(
        <Footer
          selectedCheckpointId={null}
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const footer = screen.getByTestId('footer-container');
      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe('FOOTER');
    });

    it('正しいCSSクラスが適用されている', () => {
      render(
        <Footer
          selectedCheckpointId={null}
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const footer = screen.getByTestId('footer-container');
      expect(footer).toHaveClass('page-footer');
    });

    it('RefreshButtonが表示される', () => {
      render(
        <Footer
          selectedCheckpointId={null}
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeInTheDocument();
    });

    it('RetryButtonが表示される', () => {
      render(
        <Footer
          selectedCheckpointId={null}
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('RefreshButtonの状態管理', () => {
    it('isRefreshing=falseの場合、RefreshButtonが有効化されている', () => {
      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).not.toBeDisabled();
      expect(refreshButton).toHaveTextContent('Refresh');
    });

    it('isRefreshing=trueの場合、RefreshButtonが無効化されている', () => {
      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={true}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
      expect(refreshButton).toHaveTextContent('Loading...');
    });

    it('RefreshButtonクリック時にonRefreshが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleRefresh = vi.fn();

      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={false}
          onRefresh={handleRefresh}
          onRetry={mockOnRetry}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);

      expect(handleRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('RetryButtonの状態管理', () => {
    it('selectedCheckpointId=nullの場合、RetryButtonが無効化されている', () => {
      render(
        <Footer
          selectedCheckpointId={null}
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeDisabled();
    });

    it('selectedCheckpointIdが設定されている場合、RetryButtonが有効化されている', () => {
      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).not.toBeDisabled();
    });

    it('RetryButtonクリック時にonRetryが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('インタラクション', () => {
    it('RefreshとRetryを両方クリックしてもそれぞれのハンドラが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleRefresh = vi.fn();
      const handleRetry = vi.fn();

      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={false}
          onRefresh={handleRefresh}
          onRetry={handleRetry}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      const retryButton = screen.getByTestId('retry-button');

      await user.click(refreshButton);
      await user.click(retryButton);

      expect(handleRefresh).toHaveBeenCalledTimes(1);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('リフレッシュ中でもRetryButtonは操作可能', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={true}
          onRefresh={mockOnRefresh}
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).not.toBeDisabled();

      await user.click(retryButton);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('レイアウト', () => {
    it('RefreshButtonとRetryButtonがFooter内に配置されている', () => {
      render(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const footer = screen.getByTestId('footer-container');
      const refreshButton = screen.getByTestId('refresh-button');
      const retryButton = screen.getByTestId('retry-button');

      expect(footer).toContainElement(refreshButton);
      expect(footer).toContainElement(retryButton);
    });
  });

  describe('エッジケース', () => {
    it('selectedCheckpointIdが空文字列の場合もRetryButtonが有効化される', () => {
      render(
        <Footer
          selectedCheckpointId=""
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByTestId('retry-button');
      // 空文字列はnullではないため、有効化される
      expect(retryButton).not.toBeDisabled();
    });

    it('複数のpropsが同時に変更されても問題なく動作する', () => {
      const { rerender } = render(
        <Footer
          selectedCheckpointId={null}
          isRefreshing={false}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      const refreshButton = screen.getByTestId('refresh-button');
      const retryButton = screen.getByTestId('retry-button');

      expect(refreshButton).not.toBeDisabled();
      expect(retryButton).toBeDisabled();

      rerender(
        <Footer
          selectedCheckpointId="checkpoint-1"
          isRefreshing={true}
          onRefresh={mockOnRefresh}
          onRetry={mockOnRetry}
        />
      );

      expect(refreshButton).toBeDisabled();
      expect(retryButton).not.toBeDisabled();
    });
  });
});
