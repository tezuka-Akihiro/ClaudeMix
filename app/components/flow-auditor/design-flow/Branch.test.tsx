// Branch.test.tsx - Branchコンポーネントのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Branch from './Branch';
import type { Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

describe('Branch', () => {
  const createCheckpoint = (id: string, name: string): Checkpoint => ({
    id,
    name,
    path: `develop/flow-auditor/design-flow/${name}`,
    exists: true,
    status: 'completed',
    flowType: 'branched',
    section: 'design-flow',
  });

  const mockCheckpoints: Checkpoint[] = [
    createCheckpoint('design-flow-func-spec', 'func-spec.md'),
    createCheckpoint('design-flow-uiux-spec', 'uiux-spec.md'),
    createCheckpoint('design-flow-spec-yaml', 'spec.yaml'),
  ];

  it('renders section name as header', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('design-flow')).toBeInTheDocument();
  });

  it('renders all checkpoints', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('func-spec.md')).toBeInTheDocument();
    expect(screen.getByText('uiux-spec.md')).toBeInTheDocument();
    expect(screen.getByText('spec.yaml')).toBeInTheDocument();
  });

  it('applies correct test id', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('branch')).toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('branch')).toHaveClass('flow-branch');
  });

  it('sets correct aria attributes', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const branch = screen.getByTestId('branch');
    expect(branch).toHaveAttribute('role', 'region');
    expect(branch).toHaveAttribute('aria-labelledby', 'branch-header-design-flow');
  });

  it('sets correct header id', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const header = screen.getByText('design-flow');
    expect(header.tagName).toBe('H4');
    expect(header).toHaveAttribute('id', 'branch-header-design-flow');
  });

  it('renders checkpoint list with correct role', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const list = screen.getByRole('list');
    expect(list).toHaveClass('card-item-list-vertical');
  });

  it('renders correct number of checkpoints', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const checkpointWrappers = screen.getAllByTestId('checkpoint-item');
    expect(checkpointWrappers).toHaveLength(3);
  });

  it('handles empty checkpoints array', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={[]}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('design-flow')).toBeInTheDocument();
    expect(screen.queryByTestId('checkpoint-item')).not.toBeInTheDocument();
  });

  it('passes selected checkpoint id correctly', () => {
    const onSelect = vi.fn();

    render(
      <Branch
        sectionName="design-flow"
        checkpoints={mockCheckpoints}
        selectedCheckpointId="design-flow-func-spec"
        onSelect={onSelect}
      />
    );

    // CheckpointItemが正しくレンダリングされることを確認
    expect(screen.getByText('func-spec.md')).toBeInTheDocument();
  });
});
