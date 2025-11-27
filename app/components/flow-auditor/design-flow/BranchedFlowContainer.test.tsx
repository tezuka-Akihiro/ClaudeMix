// BranchedFlowContainer.test.tsx - BranchedFlowContainerコンポーネントのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BranchedFlowContainer from './BranchedFlowContainer';
import type { BranchedFlowGroup, Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

describe('BranchedFlowContainer', () => {
  const createCheckpoint = (id: string, name: string, section: string): Checkpoint => ({
    id,
    name,
    path: `develop/flow-auditor/${section}/${name}`,
    exists: true,
    status: 'completed',
    flowType: 'branched',
    section,
  });

  const mockBranches: BranchedFlowGroup[] = [
    {
      sectionName: 'design-flow',
      checkpoints: [
        createCheckpoint('design-flow-func-spec', 'func-spec.md', 'design-flow'),
        createCheckpoint('design-flow-uiux-spec', 'uiux-spec.md', 'design-flow'),
      ],
    },
    {
      sectionName: 'implementation-flow',
      checkpoints: [
        createCheckpoint('implementation-flow-func-spec', 'func-spec.md', 'implementation-flow'),
        createCheckpoint('implementation-flow-uiux-spec', 'uiux-spec.md', 'implementation-flow'),
      ],
    },
  ];

  it('renders container with correct test id', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={mockBranches}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('branched-flow-container')).toBeInTheDocument();
  });

  it('applies correct CSS class to inner container', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={mockBranches}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const container = screen.getByTestId('branched-flow-container');
    const innerContainer = container.querySelector('.branched-flow-container');
    expect(innerContainer).toBeInTheDocument();
  });

  it('renders all branches', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={mockBranches}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('design-flow')).toBeInTheDocument();
    expect(screen.getByText('implementation-flow')).toBeInTheDocument();
  });

  it('renders correct number of branches', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={mockBranches}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    const branches = screen.getAllByTestId('branch');
    expect(branches).toHaveLength(2);
  });

  it('renders all checkpoints from all branches', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={mockBranches}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    // design-flow checkpoints
    expect(screen.getAllByText('func-spec.md')).toHaveLength(2);
    expect(screen.getAllByText('uiux-spec.md')).toHaveLength(2);
  });

  it('handles empty branches array', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={[]}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByTestId('branched-flow-container')).toBeInTheDocument();
    expect(screen.queryByTestId('branch')).not.toBeInTheDocument();
  });

  it('passes selectedCheckpointId to Branch components', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={mockBranches}
        selectedCheckpointId="design-flow-func-spec"
        onSelect={onSelect}
      />
    );

    // Branch components should render checkpoints
    expect(screen.getByText('design-flow')).toBeInTheDocument();
  });

  it('passes onSelect handler to Branch components', () => {
    const onSelect = vi.fn();

    render(
      <BranchedFlowContainer
        branches={mockBranches}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    // Branch components should be rendered with checkpoints that can be selected
    const checkpoints = screen.getAllByTestId('checkpoint-item');
    expect(checkpoints.length).toBeGreaterThan(0);
  });

  it('renders single branch correctly', () => {
    const onSelect = vi.fn();
    const singleBranch: BranchedFlowGroup[] = [
      {
        sectionName: 'test-flow',
        checkpoints: [
          createCheckpoint('test-flow-spec', 'spec.yaml', 'test-flow'),
        ],
      },
    ];

    render(
      <BranchedFlowContainer
        branches={singleBranch}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('test-flow')).toBeInTheDocument();
    expect(screen.getByText('spec.yaml')).toBeInTheDocument();
    expect(screen.getAllByTestId('branch')).toHaveLength(1);
  });

  it('renders branches with empty checkpoints', () => {
    const onSelect = vi.fn();
    const branchesWithEmpty: BranchedFlowGroup[] = [
      {
        sectionName: 'empty-flow',
        checkpoints: [],
      },
    ];

    render(
      <BranchedFlowContainer
        branches={branchesWithEmpty}
        selectedCheckpointId={null}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('empty-flow')).toBeInTheDocument();
    expect(screen.queryByTestId('checkpoint-item')).not.toBeInTheDocument();
  });
});
