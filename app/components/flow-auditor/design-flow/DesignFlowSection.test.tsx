// DesignFlowSection.test.tsx - DesignFlowSectionコンポーネントのテスト

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import DesignFlowSection from './DesignFlowSection';
import type { FlowGroup, Checkpoint } from '~/lib/flow-auditor/design-flow/flowGroupBuilder';

// Remix hooksのモック
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('@remix-run/react', () => ({
  useSearchParams: () => [mockSearchParams],
  useNavigate: () => mockNavigate,
}));

describe('DesignFlowSection', () => {
  const createCheckpoint = (id: string, name: string, flowType: 'common' | 'branched', section?: string): Checkpoint => ({
    id,
    name,
    path: section ? `develop/flow-auditor/${section}/${name}` : `develop/flow-auditor/${name}`,
    exists: true,
    status: 'completed',
    flowType,
    section,
  });

  const mockCheckpoints: FlowGroup = {
    common: [
      createCheckpoint('common-requirements', 'REQUIREMENTS_ANALYSIS_PIPE.md', 'common'),
      createCheckpoint('common-principles', 'GUIDING_PRINCIPLES.md', 'common'),
    ],
    commonSection: [
      createCheckpoint('common-func-spec', 'func-spec.md', 'branched', 'common'),
      createCheckpoint('common-uiux-spec', 'uiux-spec.md', 'branched', 'common'),
    ],
    branched: [
      {
        sectionName: 'design-flow',
        checkpoints: [
          createCheckpoint('design-flow-func-spec', 'func-spec.md', 'branched', 'design-flow'),
          createCheckpoint('design-flow-uiux-spec', 'uiux-spec.md', 'branched', 'design-flow'),
        ],
      },
    ],
  };

  const mockSections = [
    { name: 'design-flow' },
    { name: 'implementation-flow' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('selectedCheckpoint');
  });

  it('renders design flow section container', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    expect(screen.getByTestId('design-flow-section')).toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    expect(screen.getByTestId('design-flow-section')).toHaveClass('design-flow-section');
  });

  it('renders CommonFlowContainer', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    expect(screen.getByTestId('common-flow-container')).toBeInTheDocument();
  });

  it('renders CommonSectionContainer', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    expect(screen.getByTestId('common-section-container')).toBeInTheDocument();
  });

  it('renders BranchedFlowContainer', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    expect(screen.getByTestId('branched-flow-container')).toBeInTheDocument();
  });

  it('renders common flow wrapper with correct class', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    const section = screen.getByTestId('design-flow-section');
    const wrapper = section.querySelector('.common-flow-wrapper');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders common section wrapper with correct class', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    const section = screen.getByTestId('design-flow-section');
    const wrapper = section.querySelector('.common-section-wrapper');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders branched flow wrapper with correct class', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    const section = screen.getByTestId('design-flow-section');
    const wrapper = section.querySelector('.branched-flow-wrapper');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders all common checkpoints', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    expect(screen.getByText('REQUIREMENTS_ANA...')).toBeInTheDocument();
    expect(screen.getByText('GUIDING_PRINCIPLES')).toBeInTheDocument();
  });

  it('renders branched checkpoints', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    const branchedContainer = screen.getByTestId('branched-flow-container');
    expect(within(branchedContainer).getByText('design-flow')).toBeInTheDocument();
    expect(within(branchedContainer).getByText('func-spec.md')).toBeInTheDocument();
    expect(within(branchedContainer).getByText('uiux-spec.md')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'テストエラーが発生しました';

    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
        error={errorMessage}
      />
    );

    expect(screen.getByText('エラーが発生しました:')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders error box with correct class when error occurs', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
        error="エラー"
      />
    );

    const errorBox = screen.getByText('エラーが発生しました:').parentElement;
    expect(errorBox).toHaveClass('error-box');
  });

  it('does not render containers when error is present', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
        error="エラー"
      />
    );

    expect(screen.queryByTestId('common-flow-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('branched-flow-container')).not.toBeInTheDocument();
  });

  it('reads selectedCheckpoint from URL params', () => {
    mockSearchParams.set('selectedCheckpoint', 'common-requirements');

    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={mockSections}
      />
    );

    // コンポーネントがレンダリングされることを確認
    expect(screen.getByTestId('design-flow-section')).toBeInTheDocument();
  });

  it('handles empty checkpoints gracefully', () => {
    const emptyCheckpoints: FlowGroup = {
      common: [],
      commonSection: [],
      branched: [],
    };

    render(
      <DesignFlowSection
        checkpoints={emptyCheckpoints}
        sections={mockSections}
      />
    );

    expect(screen.getByTestId('design-flow-section')).toBeInTheDocument();
    expect(screen.getByTestId('common-flow-container')).toBeInTheDocument();
    expect(screen.getByTestId('branched-flow-container')).toBeInTheDocument();
  });

  it('handles empty sections array', () => {
    render(
      <DesignFlowSection
        checkpoints={mockCheckpoints}
        sections={[]}
      />
    );

    expect(screen.getByTestId('design-flow-section')).toBeInTheDocument();
  });
});
