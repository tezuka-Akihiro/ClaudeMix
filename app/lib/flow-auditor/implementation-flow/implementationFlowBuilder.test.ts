import { describe, it, expect } from 'vitest';
import { buildImplementationFlow, type BuildImplementationFlowInput } from '~/lib/flow-auditor/implementation-flow/implementationFlowBuilder';
import type { FileDefinition, LayerGroup } from '~/lib/flow-auditor/implementation-flow/implementationFlowTypes';
import type { FileExistsResult } from '~/data-io/flow-auditor/implementation-flow/checkImplementationFiles.server';

describe('implementationFlowBuilder - Pure Logic Layer', () => {
  describe('buildImplementationFlow function', () => {
    it('should build LayerGroup arrays from file definitions and existence results', () => {
      // Arrange
      const fileDefinitions: FileDefinition[] = [
        {
          id: 'lib-test-1',
          name: 'testLib.ts',
          path: 'app/lib/flow-auditor/implementation-flow/testLib.ts',
          description: 'Test lib file',
          layer: 'lib',
        },
        {
          id: 'lib-test-1-test',
          name: 'testLib.test.ts',
          path: 'app/lib/flow-auditor/implementation-flow/testLib.test.ts',
          description: 'Test file',
          layer: 'lib',
        },
        {
          id: 'data-io-test-1',
          name: 'testDataIO.server.ts',
          path: 'app/data-io/flow-auditor/implementation-flow/testDataIO.server.ts',
          description: 'Test data-io file',
          layer: 'data-io',
        },
        {
          id: 'ui-test-1',
          name: 'TestComponent.tsx',
          path: 'app/components/flow-auditor/implementation-flow/TestComponent.tsx',
          description: 'Test UI component',
          layer: 'ui',
        },
      ];

      const existsResults: FileExistsResult[] = [
        { path: 'app/lib/flow-auditor/implementation-flow/testLib.ts', exists: true },
        { path: 'app/lib/flow-auditor/implementation-flow/testLib.test.ts', exists: false },
        { path: 'app/data-io/flow-auditor/implementation-flow/testDataIO.server.ts', exists: true },
        { path: 'app/components/flow-auditor/implementation-flow/TestComponent.tsx', exists: false },
      ];

      const input: BuildImplementationFlowInput = {
        fileDefinitions,
        existsResults,
      };

      // Act
      const result = buildImplementationFlow(input);

      // Assert
      expect(result.layerGroups).toHaveLength(3); // lib, data-io, ui (E2E is excluded)

      const libGroup = result.layerGroups.find(g => g.layer === 'lib');
      expect(libGroup).toBeDefined();
      expect(libGroup?.displayName).toBe('app/lib');
      // libグループには1ペア（testLib.test.ts ↔ testLib.ts）がある
      expect(libGroup?.pairs).toHaveLength(1);
      expect(libGroup?.unpairedFiles).toHaveLength(0);

      const dataIOGroup = result.layerGroups.find(g => g.layer === 'data-io');
      expect(dataIOGroup).toBeDefined();
      expect(dataIOGroup?.displayName).toBe('app/data-io');
      // data-ioグループにはペアがなく、1つの非ペアファイルがある
      expect(dataIOGroup?.pairs).toHaveLength(0);
      expect(dataIOGroup?.unpairedFiles).toHaveLength(1);

      const uiGroup = result.layerGroups.find(g => g.layer === 'ui');
      expect(uiGroup).toBeDefined();
      expect(uiGroup?.displayName).toBe('app/components');
      // UIグループにはペアがなく、1つの非ペアファイルがある
      expect(uiGroup?.pairs).toHaveLength(0);
      expect(uiGroup?.unpairedFiles).toHaveLength(1);
    });

    it('should integrate file existence states correctly', () => {
      // Arrange
      const fileDefinitions: FileDefinition[] = [
        {
          id: 'lib-1',
          name: 'existing.ts',
          path: 'app/lib/test/existing.ts',
          description: 'Existing file',
          layer: 'lib',
        },
        {
          id: 'lib-2',
          name: 'missing.ts',
          path: 'app/lib/test/missing.ts',
          description: 'Missing file',
          layer: 'lib',
        },
      ];

      const existsResults: FileExistsResult[] = [
        { path: 'app/lib/test/existing.ts', exists: true },
        { path: 'app/lib/test/missing.ts', exists: false },
      ];

      const input: BuildImplementationFlowInput = {
        fileDefinitions,
        existsResults,
      };

      // Act
      const result = buildImplementationFlow(input);

      // Assert
      const libGroup = result.layerGroups.find(g => g.layer === 'lib');
      // 非ペアファイルの存在状態を確認
      const existingFile = libGroup?.unpairedFiles.find(f => f.name === 'existing.ts');
      const missingFile = libGroup?.unpairedFiles.find(f => f.name === 'missing.ts');
      expect(existingFile).toHaveProperty('exists', true);
      expect(missingFile).toHaveProperty('exists', false);
    });

    it('should correctly match test-script pairs', () => {
      // Arrange
      const fileDefinitions: FileDefinition[] = [
        {
          id: 'lib-impl',
          name: 'calculator.ts',
          path: 'app/lib/test/calculator.ts',
          description: 'Implementation',
          layer: 'lib',
        },
        {
          id: 'lib-test',
          name: 'calculator.test.ts',
          path: 'app/lib/test/calculator.test.ts',
          description: 'Test',
          layer: 'lib',
        },
      ];

      const existsResults: FileExistsResult[] = [
        { path: 'app/lib/test/calculator.ts', exists: true },
        { path: 'app/lib/test/calculator.test.ts', exists: true },
      ];

      const input: BuildImplementationFlowInput = {
        fileDefinitions,
        existsResults,
      };

      // Act
      const result = buildImplementationFlow(input);

      // Assert
      const libGroup = result.layerGroups.find(g => g.layer === 'lib');
      // ペアが正しく作成されたことを確認
      expect(libGroup?.pairs).toHaveLength(1);
      const pair = libGroup?.pairs[0];
      expect(pair?.testFile.name).toBe('calculator.test.ts');
      expect(pair?.scriptFile.name).toBe('calculator.ts');
      // pairIdも正しく設定されていることを確認
      expect(pair?.testFile.pairId).toBe('lib-impl');
      expect(pair?.scriptFile.pairId).toBe('lib-test');
    });

    it('should attach layer emoji icons correctly', () => {
      // Arrange
      const fileDefinitions: FileDefinition[] = [
        {
          id: 'lib-1',
          name: 'lib.ts',
          path: 'app/lib/test/lib.ts',
          description: 'Lib',
          layer: 'lib',
        },
        {
          id: 'data-io-1',
          name: 'dataio.ts',
          path: 'app/data-io/test/dataio.ts',
          description: 'DataIO',
          layer: 'data-io',
        },
        {
          id: 'ui-1',
          name: 'ui.tsx',
          path: 'app/components/test/ui.tsx',
          description: 'UI',
          layer: 'ui',
        },
      ];

      const existsResults: FileExistsResult[] = [];

      const input: BuildImplementationFlowInput = {
        fileDefinitions,
        existsResults,
      };

      // Act
      const result = buildImplementationFlow(input);

      // Assert
      const libGroup = result.layerGroups.find(g => g.layer === 'lib');
      expect(libGroup?.displayName).toBe('app/lib');

      const dataIOGroup = result.layerGroups.find(g => g.layer === 'data-io');
      expect(dataIOGroup?.displayName).toBe('app/data-io');

      const uiGroup = result.layerGroups.find(g => g.layer === 'ui');
      expect(uiGroup?.displayName).toBe('app/components');
    });

    it('should return empty array when file definitions are empty', () => {
      // Arrange
      const input: BuildImplementationFlowInput = {
        fileDefinitions: [],
        existsResults: [],
      };

      // Act
      const result = buildImplementationFlow(input);

      // Assert
      expect(result.layerGroups).toEqual([]);
    });

    it('should exclude E2E layer from LayerGroup output', () => {
      // Arrange
      const fileDefinitions: FileDefinition[] = [
        {
          id: 'e2e-1',
          name: 'test.spec.ts',
          path: 'tests/e2e/section/test.spec.ts',
          description: 'E2E test',
          layer: 'e2e',
        },
        {
          id: 'lib-1',
          name: 'lib.ts',
          path: 'app/lib/test/lib.ts',
          description: 'Lib',
          layer: 'lib',
        },
      ];

      const existsResults: FileExistsResult[] = [];

      const input: BuildImplementationFlowInput = {
        fileDefinitions,
        existsResults,
      };

      // Act
      const result = buildImplementationFlow(input);

      // Assert
      expect(result.layerGroups).toHaveLength(1);
      expect(result.layerGroups[0].layer).toBe('lib');
    });

    it('should be deterministic (same input, same output)', () => {
      // Arrange
      const fileDefinitions: FileDefinition[] = [
        {
          id: 'lib-1',
          name: 'test.ts',
          path: 'app/lib/test/test.ts',
          description: 'Test',
          layer: 'lib',
        },
      ];

      const existsResults: FileExistsResult[] = [
        { path: 'app/lib/test/test.ts', exists: true },
      ];

      const input: BuildImplementationFlowInput = {
        fileDefinitions,
        existsResults,
      };

      // Act
      const result1 = buildImplementationFlow(input);
      const result2 = buildImplementationFlow(input);

      // Assert
      expect(result1).toEqual(result2);
    });

    it('should maintain data immutability', () => {
      // Arrange
      const fileDefinitions: FileDefinition[] = [
        {
          id: 'lib-1',
          name: 'test.ts',
          path: 'app/lib/test/test.ts',
          description: 'Test',
          layer: 'lib',
        },
      ];

      const existsResults: FileExistsResult[] = [
        { path: 'app/lib/test/test.ts', exists: true },
      ];

      const input: BuildImplementationFlowInput = {
        fileDefinitions,
        existsResults,
      };
      const originalInput = JSON.parse(JSON.stringify(input));

      // Act
      buildImplementationFlow(input);

      // Assert: Input data should not be mutated
      expect(input).toEqual(originalInput);
    });
  });
});
