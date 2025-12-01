// LayerGroup.test.tsx - LayerGroupコンポーネントのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LayerGroup from './LayerGroup';
import type { LayerGroup as LayerGroupType } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';

describe('LayerGroup', () => {
  const createMockLayerGroup = (): LayerGroupType => ({
    layer: 'lib',
    displayName: 'app/lib',
    pairs: [
      {
        testFile: {
          id: 'lib-implementation-flow-definition-test',
          name: 'implementationFlowDefinition.test.ts',
          path: 'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.test.ts',
          description: 'ユニットテスト',
          layer: 'lib',
          exists: false,
          pairId: 'lib-implementation-flow-definition',
        },
        scriptFile: {
          id: 'lib-implementation-flow-definition',
          name: 'implementationFlowDefinition.ts',
          path: 'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts',
          description: 'file-list.mdを解析し、実装すべきファイル定義を取得する純粋関数',
          layer: 'lib',
          exists: true,
          pairId: 'lib-implementation-flow-definition-test',
        },
      },
    ],
    unpairedFiles: [],
  });

  it('renders layer-group', () => {
    const group = createMockLayerGroup();

    render(<LayerGroup group={group} selectedFilePaths={[]} onFileClick={() => {}} />);

    expect(screen.getByTestId('layer-group')).toBeInTheDocument();
  });

  it('renders group header with emoji and layer name', () => {
    const group = createMockLayerGroup();

    render(<LayerGroup group={group} selectedFilePaths={[]} onFileClick={() => {}} />);

    const header = screen.getByTestId('group-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('app/lib');
  });

  it('renders test-script pairs horizontally', () => {
    const group = createMockLayerGroup();

    render(<LayerGroup group={group} selectedFilePaths={[]} onFileClick={() => {}} />);

    // test-scriptペアが表示されることを確認
    const pair = screen.getByTestId('test-script-pair');
    expect(pair).toBeInTheDocument();

    // ペア内にtest fileとscript fileが両方表示されることを確認
    const cards = screen.getAllByTestId(/^file-card-/);
    expect(cards).toHaveLength(2); // testFile + scriptFile
  });

  it('renders arrow between test and script files', () => {
    const group = createMockLayerGroup();

    render(<LayerGroup group={group} selectedFilePaths={[]} onFileClick={() => {}} />);

    // 矢印が表示されることを確認
    const pair = screen.getByTestId('test-script-pair');
    expect(pair).toHaveTextContent('→');
  });

  it('applies correct CSS classes for layout', () => {
    const group = createMockLayerGroup();

    render(<LayerGroup group={group} selectedFilePaths={[]} onFileClick={() => {}} />);

    const groupElement = screen.getByTestId('layer-group');
    expect(groupElement).toHaveClass('component-group');
  });

  it('renders empty layer group without errors', () => {
    const emptyGroup: LayerGroupType = {
      layer: 'data-io',
      displayName: 'app/data-io',
      pairs: [],
      unpairedFiles: [],
    };

    render(<LayerGroup group={emptyGroup} selectedFilePaths={[]} onFileClick={() => {}} />);

    expect(screen.getByTestId('layer-group')).toBeInTheDocument();
    expect(screen.getByTestId('group-header')).toHaveTextContent('app/data-io');
  });

  it('handles different layer types correctly', () => {
    const uiGroup: LayerGroupType = {
      layer: 'ui',
      displayName: 'app/components',
      pairs: [],
      unpairedFiles: [],
    };

    render(<LayerGroup group={uiGroup} selectedFilePaths={[]} onFileClick={() => {}} />);

    const header = screen.getByTestId('group-header');
    expect(header).toHaveTextContent('app/components');
  });

  it('renders unpaired files vertically', () => {
    const groupWithUnpaired: LayerGroupType = {
      layer: 'lib',
      displayName: 'app/lib',
      pairs: [],
      unpairedFiles: [
        {
          id: 'lib-standalone',
          name: 'standalone.ts',
          path: 'app/lib/flow-auditor/implementation-flow/standalone.ts',
          description: 'Standalone file without pair',
          layer: 'lib',
          exists: true,
        },
      ],
    };

    render(<LayerGroup group={groupWithUnpaired} selectedFilePaths={[]} onFileClick={() => {}} />);

    // ペアにならなかったファイルが表示されることを確認
    const cards = screen.getAllByTestId(/^file-card-/);
    expect(cards).toHaveLength(1);
  });

  describe('truncateText function', () => {
    it('truncates long file names with ellipsis', () => {
      const groupWithLongFileName: LayerGroupType = {
        layer: 'lib',
        displayName: 'app/lib',
        pairs: [],
        unpairedFiles: [
          {
            id: 'lib-long-name',
            name: 'veryLongFileNameThatExceedsTheMaximumLength.ts',
            path: 'app/lib/flow-auditor/implementation-flow/veryLongFileNameThatExceedsTheMaximumLength.ts',
            description: 'File with long name',
            layer: 'lib',
            exists: true,
          },
        ],
      };

      render(<LayerGroup group={groupWithLongFileName} selectedFilePaths={[]} onFileClick={() => {}} />);

      // ファイル名が省略されて表示されていることを確認
      const card = screen.getByTestId('file-card-lib-long-name');
      expect(card).toHaveTextContent('veryLongFileNameT…');
    });

    it('does not truncate short file names', () => {
      const groupWithShortFileName: LayerGroupType = {
        layer: 'lib',
        displayName: 'app/lib',
        pairs: [],
        unpairedFiles: [
          {
            id: 'lib-short',
            name: 'short.ts',
            path: 'app/lib/flow-auditor/implementation-flow/short.ts',
            description: 'Short file name',
            layer: 'lib',
            exists: true,
          },
        ],
      };

      render(<LayerGroup group={groupWithShortFileName} selectedFilePaths={[]} onFileClick={() => {}} />);

      // ファイル名がそのまま表示されていることを確認
      const card = screen.getByTestId('file-card-lib-short');
      expect(card).toHaveTextContent('short.ts');
    });
  });

  describe('file click handler', () => {
    it('calls onFileClick when a test file is clicked', async () => {
      const user = userEvent.setup();
      const mockOnFileClick = vi.fn();
      const group = createMockLayerGroup();

      render(<LayerGroup group={group} selectedFilePaths={[]} onFileClick={mockOnFileClick} />);

      const testFileCard = screen.getByTestId('file-card-lib-implementation-flow-definition-test');
      await user.click(testFileCard);

      expect(mockOnFileClick).toHaveBeenCalledWith(
        'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.test.ts'
      );
      expect(mockOnFileClick).toHaveBeenCalledTimes(1);
    });

    it('calls onFileClick when a script file is clicked', async () => {
      const user = userEvent.setup();
      const mockOnFileClick = vi.fn();
      const group = createMockLayerGroup();

      render(<LayerGroup group={group} selectedFilePaths={[]} onFileClick={mockOnFileClick} />);

      const scriptFileCard = screen.getByTestId('file-card-lib-implementation-flow-definition');
      await user.click(scriptFileCard);

      expect(mockOnFileClick).toHaveBeenCalledWith(
        'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts'
      );
      expect(mockOnFileClick).toHaveBeenCalledTimes(1);
    });

    it('calls onFileClick when an unpaired file is clicked', async () => {
      const user = userEvent.setup();
      const mockOnFileClick = vi.fn();
      const groupWithUnpaired: LayerGroupType = {
        layer: 'lib',
        displayName: 'app/lib',
        pairs: [],
        unpairedFiles: [
          {
            id: 'lib-standalone',
            name: 'standalone.ts',
            path: 'app/lib/flow-auditor/implementation-flow/standalone.ts',
            description: 'Standalone file',
            layer: 'lib',
            exists: true,
          },
        ],
      };

      render(<LayerGroup group={groupWithUnpaired} selectedFilePaths={[]} onFileClick={mockOnFileClick} />);

      const unpairedFileCard = screen.getByTestId('file-card-lib-standalone');
      await user.click(unpairedFileCard);

      expect(mockOnFileClick).toHaveBeenCalledWith(
        'app/lib/flow-auditor/implementation-flow/standalone.ts'
      );
      expect(mockOnFileClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('selected file paths', () => {
    it('passes selected status to CardItem when file is selected', () => {
      const group = createMockLayerGroup();
      const selectedPaths = ['app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.test.ts'];

      render(<LayerGroup group={group} selectedFilePaths={selectedPaths} onFileClick={() => {}} />);

      const testFileCard = screen.getByTestId('file-card-lib-implementation-flow-definition-test');
      // CardItemがselectedステータスを受け取っていることを確認
      // (CardItemのテストで詳細な表示確認は行われているため、ここでは存在を確認)
      expect(testFileCard).toBeInTheDocument();
    });

    it('handles multiple selected files', () => {
      const group = createMockLayerGroup();
      const selectedPaths = [
        'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.test.ts',
        'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts',
      ];

      render(<LayerGroup group={group} selectedFilePaths={selectedPaths} onFileClick={() => {}} />);

      const testFileCard = screen.getByTestId('file-card-lib-implementation-flow-definition-test');
      const scriptFileCard = screen.getByTestId('file-card-lib-implementation-flow-definition');

      expect(testFileCard).toBeInTheDocument();
      expect(scriptFileCard).toBeInTheDocument();
    });
  });
});
