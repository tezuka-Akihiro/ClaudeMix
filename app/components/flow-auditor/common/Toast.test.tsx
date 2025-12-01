// Toast.test.tsx - Toastコンポーネントのテスト

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with message and testId', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Copied: develop/flow-auditor/common/func-spec.md"
        type="success"
        onClose={onClose}
        testId="toast-notification"
      />
    );

    const toast = screen.getByTestId('toast-notification');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('Copied: develop/flow-auditor/common/func-spec.md');
  });

  it('applies success type class', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Success message"
        type="success"
        onClose={onClose}
        testId="toast-success"
      />
    );

    const toast = screen.getByTestId('toast-success');
    expect(toast).toHaveClass('toast-success');
  });

  it('applies error type class', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Error message"
        type="error"
        onClose={onClose}
        testId="toast-error"
      />
    );

    const toast = screen.getByTestId('toast-error');
    expect(toast).toHaveClass('toast-error');
  });

  it('starts with visible class', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Test message"
        type="success"
        onClose={onClose}
        testId="toast-test"
      />
    );

    const toast = screen.getByTestId('toast-test');
    expect(toast).toHaveClass('toast-visible');
  });

  it('calls onClose after duration + animation time (default 2000ms + 300ms)', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Test message"
        type="success"
        onClose={onClose}
        testId="toast-test"
      />
    );

    expect(onClose).not.toHaveBeenCalled();

    // duration経過後（2000ms）
    vi.advanceTimersByTime(2000);
    expect(onClose).not.toHaveBeenCalled();

    // アニメーション時間経過後（+300ms）
    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose after custom duration + animation time', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Test message"
        type="error"
        duration={3000}
        onClose={onClose}
        testId="toast-test"
      />
    );

    expect(onClose).not.toHaveBeenCalled();

    // カスタムduration経過後（3000ms）
    vi.advanceTimersByTime(3000);
    expect(onClose).not.toHaveBeenCalled();

    // アニメーション時間経過後（+300ms）
    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('changes to hidden class after duration', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Test message"
        type="success"
        onClose={onClose}
        testId="toast-test"
      />
    );

    const toast = screen.getByTestId('toast-test');
    expect(toast).toHaveClass('toast-visible');

    // duration経過後（2000ms）
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(toast).toHaveClass('toast-hidden');
    expect(toast).not.toHaveClass('toast-visible');
  });

  it('has proper ARIA attributes', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Test message"
        type="success"
        onClose={onClose}
        testId="toast-test"
      />
    );

    const toast = screen.getByTestId('toast-test');
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('cleans up timers on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Toast
        message="Test message"
        type="success"
        onClose={onClose}
        testId="toast-test"
      />
    );

    unmount();

    // タイマーを進めてもonCloseが呼ばれないことを確認
    vi.advanceTimersByTime(3000);
    expect(onClose).not.toHaveBeenCalled();
  });
});
