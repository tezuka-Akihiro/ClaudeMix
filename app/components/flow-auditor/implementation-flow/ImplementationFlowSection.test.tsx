// ImplementationFlowSection.test.tsx - ImplementationFlowSectionコンポーネントのテスト

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImplementationFlowSection from './ImplementationFlowSection';
import type { ImplementationFlowOutput } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';

// Remix hooksのモック
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('@remix-run/react', () => ({
  useSearchParams: () => [mockSearchParams],
  useNavigate: () => mockNavigate,
}));

describe('ImplementationFlowSection', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSearchParams.delete('selectedCheckpoint');
  });

  const createMockData = (): ImplementationFlowOutput => ({
    layerGroups: [
      {
        layer: 'lib',
        displayName: 'app/lib',
        pairs: [],
        unpairedFiles: [
          {
            id: 'lib-implementation-flow-definition',
            name: 'implementationFlowDefinition.ts',
            path: 'app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts',
            description: 'file-list.mdを解析し、実装すべきファイル定義を取得する純粋関数',
            layer: 'lib',
            exists: true,
          },
        ],
      },
      {
        layer: 'data-io',
        displayName: 'app/data-io',
        pairs: [],
        unpairedFiles: [
          {
            id: 'data-io-check-implementation-files',
            name: 'checkImplementationFiles.server.ts',
            path: 'app/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server.ts',
            description: 'ファイル存在確認',
            layer: 'data-io',
            exists: false,
          },
        ],
      },
      {
        layer: 'ui',
        displayName: 'app/components',
        pairs: [],
        unpairedFiles: [
          {
            id: 'ui-file-card',
            name: 'FileCard.tsx',
            path: 'app/components/flow-auditor/implementation-flow/FileCard.tsx',
            description: '個別ファイル表示カード',
            layer: 'ui',
            exists: true,
          },
        ],
      },
    ],
  });

  it('renders implementation-flow-section', () => {
    const data = createMockData();

    render(<ImplementationFlowSection data={data} />);

    expect(screen.getByTestId('implementation-flow-section')).toBeInTheDocument();
  });

  it('renders 3 LayerGroups', () => {
    const data = createMockData();

    render(<ImplementationFlowSection data={data} />);

    const layerGroups = screen.getAllByTestId('layer-group');
    expect(layerGroups).toHaveLength(3);
  });

  it('renders error message when data is undefined', () => {
    render(<ImplementationFlowSection data={undefined as any} />);

    expect(screen.getByTestId('implementation-flow-error')).toHaveTextContent(
      'Failed to load implementation flow data.'
    );
  });

  it('renders error message when layerGroups is empty', () => {
    const emptyData: ImplementationFlowOutput = {
      layerGroups: [],
    };

    render(<ImplementationFlowSection data={emptyData} />);

    expect(screen.getByTestId('implementation-flow-error')).toHaveTextContent(
      'No layer groups found.'
    );
  });

  it('renders error message when layerGroups is undefined', () => {
    const invalidData = {} as ImplementationFlowOutput;

    render(<ImplementationFlowSection data={invalidData} />);

    expect(screen.getByTestId('implementation-flow-error')).toHaveTextContent(
      'No layer groups found.'
    );
  });

  it('applies correct CSS classes', () => {
    const data = createMockData();

    render(<ImplementationFlowSection data={data} />);

    const section = screen.getByTestId('implementation-flow-section');
    expect(section).toHaveClass('implementation-flow-section');
  });

  describe('handleFileClick interaction', () => {
    it('navigates with selectedCheckpoint parameter when a file is clicked', async () => {
      const user = userEvent.setup();
      const data = createMockData();

      render(<ImplementationFlowSection data={data} />);

      const fileCard = screen.getByTestId('file-card-lib-implementation-flow-definition');
      await user.click(fileCard);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('selectedCheckpoint=')
      );
    });

    it('selects a file when clicked', async () => {
      const user = userEvent.setup();
      const data = createMockData();

      render(<ImplementationFlowSection data={data} />);

      const fileCard = screen.getByTestId('file-card-lib-implementation-flow-definition');
      await user.click(fileCard);

      const navigateCall = mockNavigate.mock.calls[0][0];
      const decodedUrl = decodeURIComponent(navigateCall);
      expect(decodedUrl).toContain('app/lib/flow-auditor/implementation-flow/implementationFlowDefinition.ts');
    });

    it('selects both test and script files when paired file is clicked', async () => {
      const user = userEvent.setup();
      const dataWithPairs: ImplementationFlowOutput = {
        layerGroups: [
          {
            layer: 'lib',
            displayName: 'app/lib',
            pairs: [
              {
                testFile: {
                  id: 'lib-test',
                  name: 'test.test.ts',
                  path: 'app/lib/flow-auditor/test.test.ts',
                  description: 'Test file',
                  layer: 'lib',
                  exists: true,
                  pairId: 'lib-script',
                },
                scriptFile: {
                  id: 'lib-script',
                  name: 'script.ts',
                  path: 'app/lib/flow-auditor/script.ts',
                  description: 'Script file',
                  layer: 'lib',
                  exists: true,
                  pairId: 'lib-test',
                },
              },
            ],
            unpairedFiles: [],
          },
        ],
      };

      render(<ImplementationFlowSection data={dataWithPairs} />);

      const testFileCard = screen.getByTestId('file-card-lib-test');
      await user.click(testFileCard);

      // Both test and script files should be in the selectedCheckpoint parameter
      const navigateCall = mockNavigate.mock.calls[0][0];
      const decodedUrl = decodeURIComponent(navigateCall);
      expect(decodedUrl).toContain('app/lib/flow-auditor/test.test.ts');
      expect(decodedUrl).toContain('app/lib/flow-auditor/script.ts');
    });

    it('deselects files when clicking a selected file', async () => {
      const user = userEvent.setup();
      const data = createMockData();

      render(<ImplementationFlowSection data={data} />);

      const fileCard = screen.getByTestId('file-card-lib-implementation-flow-definition');

      // First click: select
      await user.click(fileCard);
      expect(mockNavigate).toHaveBeenCalledTimes(1);

      // Second click: deselect
      await user.click(fileCard);
      expect(mockNavigate).toHaveBeenCalledTimes(2);

      // Check that selectedCheckpoint is removed when no files are selected
      const secondCall = mockNavigate.mock.calls[1][0];
      expect(secondCall).not.toContain('selectedCheckpoint=');
    });

    it('handles multiple file selections', async () => {
      const user = userEvent.setup();
      const dataWithMultipleFiles: ImplementationFlowOutput = {
        layerGroups: [
          {
            layer: 'lib',
            displayName: 'app/lib',
            pairs: [],
            unpairedFiles: [
              {
                id: 'file1',
                name: 'file1.ts',
                path: 'app/lib/flow-auditor/file1.ts',
                description: 'File 1',
                layer: 'lib',
                exists: true,
              },
              {
                id: 'file2',
                name: 'file2.ts',
                path: 'app/lib/flow-auditor/file2.ts',
                description: 'File 2',
                layer: 'lib',
                exists: true,
              },
            ],
          },
        ],
      };

      render(<ImplementationFlowSection data={dataWithMultipleFiles} />);

      const file1Card = screen.getByTestId('file-card-file1');
      const file2Card = screen.getByTestId('file-card-file2');

      // Select first file
      await user.click(file1Card);
      expect(mockNavigate).toHaveBeenCalledTimes(1);

      // Select second file
      await user.click(file2Card);
      expect(mockNavigate).toHaveBeenCalledTimes(2);

      // Both files should be in the selectedCheckpoint parameter
      const secondCall = mockNavigate.mock.calls[1][0];
      expect(secondCall).toContain('file1.ts');
      expect(secondCall).toContain('file2.ts');
    });

    it('preserves other search parameters when updating selectedCheckpoint', async () => {
      const user = userEvent.setup();
      mockSearchParams.set('section', 'implementation-flow');
      mockSearchParams.set('service', 'flow-auditor');

      const data = createMockData();
      render(<ImplementationFlowSection data={data} />);

      const fileCard = screen.getByTestId('file-card-lib-implementation-flow-definition');
      await user.click(fileCard);

      const navigateCall = mockNavigate.mock.calls[0][0];
      expect(navigateCall).toContain('section=implementation-flow');
      expect(navigateCall).toContain('service=flow-auditor');
      expect(navigateCall).toContain('selectedCheckpoint=');
    });

    it('encodes file paths correctly in URL parameter', async () => {
      const user = userEvent.setup();
      const data = createMockData();

      render(<ImplementationFlowSection data={data} />);

      const fileCard = screen.getByTestId('file-card-lib-implementation-flow-definition');
      await user.click(fileCard);

      const navigateCall = mockNavigate.mock.calls[0][0];
      // Check that the path is properly encoded in the URL
      expect(navigateCall).toMatch(/selectedCheckpoint=[^&]+/);
    });
  });
});
