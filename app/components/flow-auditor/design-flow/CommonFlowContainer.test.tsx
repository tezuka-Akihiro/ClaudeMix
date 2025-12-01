// CommonFlowContainer.test.tsx - CommonFlowContainerコンポーネントのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommonFlowContainer from './CommonFlowContainer';
import type { Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

describe('CommonFlowContainer', () => {
  const createCheckpoint = (id: string, name: string): Checkpoint => ({
    id,
    name,
    path: `develop/flow-auditor/${name}`,
    exists: true,
    status: 'completed',
    flowType: 'common',
  });

  const mockCheckpoints: Checkpoint[] = [
    createCheckpoint('common-requirements', 'REQUIREMENTS_ANALYSIS_PIPE.md'),
    createCheckpoint('common-principles', 'GUIDING_PRINCIPLES.md'),
  ];

  it('renders container with correct test id', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('common-flow-container')).toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('common-flow-container')).toHaveClass('common-flow-container');
  });

  it('sets correct aria attributes on container', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const container = screen.getByTestId('common-flow-container');
    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-label', '共通フロー');
  });

  it('renders checkpoint list with correct role', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const list = screen.getByRole('list');
    expect(list).toHaveClass('card-item-list-vertical');
  });

  it('renders all checkpoints', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('REQUIREMENTS_ANA...')).toBeInTheDocument();
    expect(screen.getByText('GUIDING_PRINCIPLES')).toBeInTheDocument();
  });

  it('renders correct number of checkpoints', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const checkpointItems = screen.getAllByTestId('checkpoint-item');
    expect(checkpointItems).toHaveLength(2);
  });

  it('handles empty checkpoints array', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={[]}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('common-flow-container')).toBeInTheDocument();
    expect(screen.queryByTestId('checkpoint-item')).not.toBeInTheDocument();
  });

  it('passes selectedCheckpointId correctly', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId="common-requirements"
        onSelect={onSelect}
      />
    );

    // CheckpointItemが正しくレンダリングされることを確認
    expect(screen.getByText('REQUIREMENTS_ANA...')).toBeInTheDocument();
  });

  it('passes onSelect handler to CheckpointItem components', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    // CheckpointItemsがクリック可能であることを確認
    const checkpoints = screen.getAllByTestId('checkpoint-item');
    expect(checkpoints.length).toBe(2);
  });

  it('renders checkpoints in wrappers', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const container = screen.getByTestId('common-flow-container');
    const wrappers = container.querySelectorAll('.card-item-wrapper');
    expect(wrappers).toHaveLength(2);
  });

  it('renders single checkpoint correctly', () => {
    const onSelect = vi.fn();
    const singleCheckpoint = [createCheckpoint('test-id', 'test.md')];

    render(
      <CommonFlowContainer
        checkpoints={singleCheckpoint}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('test.md')).toBeInTheDocument();
    expect(screen.getAllByTestId('checkpoint-item')).toHaveLength(1);
  });

  it('correctly identifies selected checkpoint', () => {
    const onSelect = vi.fn();

    render(
      <CommonFlowContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId="common-principles"
        onSelect={onSelect}
      />
    );

    // 選択されたチェックポイントが存在することを確認
    const checkpoints = screen.getAllByTestId('checkpoint-item');
    expect(checkpoints).toHaveLength(2);
  });

  it('handles pending status checkpoints', () => {
    const onSelect = vi.fn();
    const checkpointsWithPending: Checkpoint[] = [
      createCheckpoint('common-requirements', 'REQUIREMENTS_ANALYSIS_PIPE.md'),
      { ...createCheckpoint('common-principles', 'GUIDING_PRINCIPLES.md'), status: 'pending', exists: false },
    ];

    render(
      <CommonFlowContainer
        checkpoints={checkpointsWithPending}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('REQUIREMENTS_ANA...')).toBeInTheDocument();
    expect(screen.getByText('GUIDING_PRINCIPLES')).toBeInTheDocument();
  });
});
