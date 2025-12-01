// CommonSectionContainer.test.tsx - CommonSectionContainerコンポーネントのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommonSectionContainer from './CommonSectionContainer';
import type { Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

describe('CommonSectionContainer', () => {
  const createCheckpoint = (id: string, name: string): Checkpoint => ({
    id,
    name,
    path: `develop/flow-auditor/common/${name}`,
    exists: true,
    status: 'completed',
    flowType: 'branched',
    section: 'common',
  });

  const mockCheckpoints: Checkpoint[] = [
    createCheckpoint('func-spec', 'func-spec.md'),
    createCheckpoint('uiux-spec', 'uiux-spec.md'),
    createCheckpoint('spec-yaml', 'spec.yaml'),
    createCheckpoint('file-list', 'file-list.md'),
    createCheckpoint('tdd-workflow', 'TDD_WORK_FLOW.md'),
  ];

  it('renders container with correct test id', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('common-section-container')).toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('common-section-container')).toHaveClass('common-section-container');
  });

  it('sets correct aria attributes on container', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const container = screen.getByTestId('common-section-container');
    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-labelledby', 'common-section-header');
  });

  it('renders section header with correct text', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const header = screen.getByRole('heading', { level: 4 });
    expect(header).toHaveTextContent('common');
    expect(header).toHaveAttribute('id', 'common-section-header');
    expect(header).toHaveClass('branch-header');
  });

  it('renders checkpoint list with correct role', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
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
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('func-spec.md')).toBeInTheDocument();
    expect(screen.getByText('uiux-spec.md')).toBeInTheDocument();
    expect(screen.getByText('spec.yaml')).toBeInTheDocument();
    expect(screen.getByText('file-list.md')).toBeInTheDocument();
    expect(screen.getByText('TDD_WORK_FLOW.md')).toBeInTheDocument();
  });

  it('renders correct number of checkpoints', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const checkpointItems = screen.getAllByTestId('checkpoint-item');
    expect(checkpointItems).toHaveLength(5);
  });

  it('renders nothing when checkpoints array is empty', () => {
    const onSelect = vi.fn();

    const { container } = render(
      <CommonSectionContainer
        checkpoints={[]}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    // nullを返すので何もレンダリングされない
    expect(container.firstChild).toBeNull();
  });

  it('passes selectedCheckpointId correctly', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId="func-spec"
        onSelect={onSelect}
      />
    );

    // CheckpointItemが正しくレンダリングされることを確認
    expect(screen.getByText('func-spec.md')).toBeInTheDocument();
  });

  it('passes onSelect handler to CheckpointItem components', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    // CheckpointItemsがクリック可能であることを確認
    const checkpoints = screen.getAllByTestId('checkpoint-item');
    expect(checkpoints.length).toBe(5);
  });

  it('renders checkpoints in wrappers', () => {
    const onSelect = vi.fn();

    render(
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const container = screen.getByTestId('common-section-container');
    const wrappers = container.querySelectorAll('.card-item-wrapper');
    expect(wrappers).toHaveLength(5);
  });

  it('renders single checkpoint correctly', () => {
    const onSelect = vi.fn();
    const singleCheckpoint = [createCheckpoint('test-id', 'test.md')];

    render(
      <CommonSectionContainer
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
      <CommonSectionContainer
        checkpoints={mockCheckpoints}
        selectedCheckpointId="file-list"
        onSelect={onSelect}
      />
    );

    // 選択されたチェックポイントが存在することを確認
    const checkpoints = screen.getAllByTestId('checkpoint-item');
    expect(checkpoints).toHaveLength(5);
  });

  it('handles pending status checkpoints', () => {
    const onSelect = vi.fn();
    const checkpointsWithPending: Checkpoint[] = [
      createCheckpoint('func-spec', 'func-spec.md'),
      { ...createCheckpoint('file-list', 'file-list.md'), status: 'pending', exists: false },
    ];

    render(
      <CommonSectionContainer
        checkpoints={checkpointsWithPending}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('func-spec.md')).toBeInTheDocument();
    expect(screen.getByText('file-list.md')).toBeInTheDocument();
  });
});
