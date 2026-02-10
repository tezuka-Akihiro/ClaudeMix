// LoadMoreButton.test.tsx - Unit Test
// もっと見るボタンコンポーネントのユニットテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadMoreButton from './LoadMoreButton';

const mockMessages = {
  button_label: 'More',
  loading_label: 'Loading...',
  no_more_posts: 'すべての記事を読み込みました',
};
const mockAriaLabel = 'さらに記事を読み込む';

describe('LoadMoreButton', () => {
  describe('表示状態', () => {
    it('hasMore=trueの場合、ボタンが表示される', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      expect(screen.getByTestId('load-more-container')).toBeInTheDocument();
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
    });

    it('hasMore=falseの場合、ボタンが表示されない', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={false}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      expect(screen.queryByTestId('load-more-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('isLoading=falseの場合、"More"ラベルが表示される', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      expect(screen.getByText(mockMessages.button_label)).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('isLoading=trueの場合、スピナーと"Loading..."ラベルが表示される', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={true}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(mockMessages.loading_label)).toBeInTheDocument();
      expect(screen.queryByText(mockMessages.button_label)).not.toBeInTheDocument();
    });

    it('isLoading=trueの場合、ボタンが無効化される', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={true}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const button = screen.getByTestId('load-more-button');
      expect(button).toBeDisabled();
    });
  });

  describe('クリックイベント', () => {
    it('ボタンをクリックすると、onClickハンドラが呼ばれる', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();

      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const button = screen.getByTestId('load-more-button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('ローディング中はボタンをクリックしてもonClickハンドラが呼ばれない', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();

      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={true}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const button = screen.getByTestId('load-more-button');
      await user.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('ボタンに適切なaria-labelが設定されている', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const button = screen.getByTestId('load-more-button');
      expect(button).toHaveAttribute('aria-label', `${mockMessages.button_label} (${mockAriaLabel})`);
    });

    it('ローディング中、aria-busy=trueが設定される', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={true}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const button = screen.getByTestId('load-more-button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('ローディング中でない場合、aria-busy=falseが設定される', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const button = screen.getByTestId('load-more-button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('スピナーにaria-hidden=trueが設定されている', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={true}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('CSSクラス', () => {
    it('コンテナに適切なクラスが適用されている', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const container = screen.getByTestId('load-more-container');
      expect(container).toHaveClass('load-more-container');
      expect(container).toHaveClass('load-more-container-structure');
    });

    it('ボタンに適切なクラスが適用されている', () => {
      const mockOnClick = vi.fn();
      render(
        <LoadMoreButton
          onClick={mockOnClick}
          isLoading={false}
          hasMore={true}
          messages={mockMessages}
          ariaLabel={mockAriaLabel}
        />
      );

      const button = screen.getByTestId('load-more-button');
      expect(button).toHaveClass('load-more-button');
    });
  });
});
