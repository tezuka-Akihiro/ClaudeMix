// CardItem.test.tsx - CardItemコンポーネントのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardItem from './CardItem';

describe('CardItem', () => {
  it('renders with text and path', () => {
    render(
      <CardItem
        text="func-spec.md"
        path="develop/flow-auditor/design-flow/func-spec.md"
        status="completed"
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('func-spec.md');
    expect(card).toHaveAttribute('title', 'develop/flow-auditor/design-flow/func-spec.md');
  });

  it('applies completed status class', () => {
    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="completed"
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toHaveClass('completed');
  });

  it('applies pending status class', () => {
    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="pending"
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toHaveClass('pending');
  });

  it('applies error status class', () => {
    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="error"
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toHaveClass('error');
  });

  it('calls onClick when clickable and clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="completed"
        clickable={true}
        onClick={handleClick}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when not clickable', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="pending"
        clickable={false}
        onClick={handleClick}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    await user.click(card);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles Enter key press when clickable', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="completed"
        clickable={true}
        onClick={handleClick}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('sets role and tabIndex when clickable', () => {
    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="completed"
        clickable={true}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('does not set role and tabIndex when not clickable', () => {
    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="pending"
        clickable={false}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabIndex');
  });

  it('includes checkpoint-id when provided', () => {
    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="completed"
        testId="card-item"
        checkpointId="design-flow-func-spec"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toHaveAttribute('data-checkpoint-id', 'design-flow-func-spec');
  });

  it('applies custom className', () => {
    render(
      <CardItem
        text="test.md"
        path="/test.md"
        status="completed"
        testId="card-item"
        className="custom-card-class"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toHaveClass('custom-card-class');
  });

  it('sets aria-label with text and status', () => {
    render(
      <CardItem
        text="func-spec.md"
        path="/path/to/func-spec.md"
        status="completed"
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    expect(card).toHaveAttribute('aria-label', 'func-spec.md - completed');
  });

  it('calls onContextMenu when right-clicked', async () => {
    const user = userEvent.setup();
    const handleContextMenu = vi.fn();

    render(
      <CardItem
        text="test.md"
        path="develop/flow-auditor/common/test.md"
        status="completed"
        onContextMenu={handleContextMenu}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    await user.pointer({ keys: '[MouseRight]', target: card });

    expect(handleContextMenu).toHaveBeenCalledTimes(1);
  });

  it('prevents default context menu when right-clicked', async () => {
    const handleContextMenu = vi.fn();

    render(
      <CardItem
        text="test.md"
        path="develop/flow-auditor/common/test.md"
        status="completed"
        onContextMenu={handleContextMenu}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');

    // contextmenuイベントを直接発火してpreventDefault()の呼び出しを確認
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    card.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(handleContextMenu).toHaveBeenCalled();
  });

  it('does not call onClick when right-clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const handleContextMenu = vi.fn();

    render(
      <CardItem
        text="test.md"
        path="develop/flow-auditor/common/test.md"
        status="completed"
        clickable={true}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');
    await user.pointer({ keys: '[MouseRight]', target: card });

    expect(handleContextMenu).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles right-click even when onContextMenu is not provided', async () => {
    const user = userEvent.setup();

    render(
      <CardItem
        text="test.md"
        path="develop/flow-auditor/common/test.md"
        status="completed"
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');

    // エラーが発生しないことを確認
    await expect(
      user.pointer({ keys: '[MouseRight]', target: card })
    ).resolves.not.toThrow();
  });

  it('prevents default browser menu even when onContextMenu is not provided', async () => {
    render(
      <CardItem
        text="test.md"
        path="develop/flow-auditor/common/test.md"
        status="completed"
        testId="card-item"
      />
    );

    const card = screen.getByTestId('card-item');

    // contextmenuイベントを直接発火してpreventDefault()の呼び出しを確認
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    card.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
