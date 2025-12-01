import { describe, it, expect } from 'vitest';
import {
  validateFileDefinitions,
  groupFileDefinitionsByLayer,
  resolvePlaceholders,
  parseFileListMarkdown,
  type FileDefinition,
} from '~/lib/flow-auditor/implementation-flow/implementationFlowDefinition';

describe('implementationFlowDefinition - Pure Logic Layer', () => {
  describe('validateFileDefinitions function', () => {
    it('should return true for valid file definitions', () => {
      // Arrange
      const validDefinitions: FileDefinition[] = [
        {
          id: 'test1',
          name: 'test1.ts',
          path: 'app/lib/test1.ts',
          description: 'Test file 1',
          layer: 'lib',
        },
        {
          id: 'test2',
          name: 'test2.ts',
          path: 'app/lib/test2.ts',
          description: 'Test file 2',
          layer: 'lib',
        },
      ];

      // Act
      const isValid = validateFileDefinitions(validDefinitions);

      // Assert
      expect(isValid).toBe(true);
    });

    it.each([
      {
        case: 'duplicate IDs',
        definitions: [
          { id: 'dup', name: 'test1.ts', path: 'app/lib/test1.ts', description: 'd', layer: 'lib' },
          { id: 'dup', name: 'test2.ts', path: 'app/lib/test2.ts', description: 'd', layer: 'lib' },
        ],
      },
      {
        case: 'duplicate paths',
        definitions: [
          { id: 'test1', name: 'test.ts', path: 'app/lib/test.ts', description: 'd', layer: 'lib' },
          { id: 'test2', name: 'test.ts', path: 'app/lib/test.ts', description: 'd', layer: 'lib' },
        ],
      },
      {
        case: 'missing id',
        definitions: [{ id: '', name: 'test.ts', path: 'p', description: 'd', layer: 'lib' }],
      },
      {
        case: 'missing name',
        definitions: [{ id: 'id1', name: '', path: 'p', description: 'd', layer: 'lib' }],
      },
      {
        case: 'missing path',
        definitions: [{ id: 'id1', name: 'n', path: '', description: 'd', layer: 'lib' }],
      },
      {
        case: 'missing description',
        definitions: [{ id: 'id1', name: 'n', path: 'p', description: '', layer: 'lib' }],
      },
      {
        case: 'missing layer',
        definitions: [{ id: 'id1', name: 'n', path: 'p', description: 'd', layer: undefined }],
      },
    ])('should return false for definitions with $case', ({ definitions }) => {
      // Arrange
      const invalidDefinitions = definitions as FileDefinition[];

      // Act
      const isValid = validateFileDefinitions(invalidDefinitions);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('groupFileDefinitionsByLayer function', () => {
    it('should group file definitions by layer', () => {
      // Arrange
      const definitions: FileDefinition[] = [
        {
          id: 'e2e1',
          name: 'test.spec.ts',
          path: 'tests/e2e/test.spec.ts',
          description: 'E2E test',
          layer: 'e2e',
        },
        {
          id: 'lib1',
          name: 'lib.ts',
          path: 'app/lib/lib.ts',
          description: 'Lib file',
          layer: 'lib',
        },
        {
          id: 'data-io1',
          name: 'data.server.ts',
          path: 'app/data-io/data.server.ts',
          description: 'Data-IO file',
          layer: 'data-io',
        },
        {
          id: 'ui1',
          name: 'Component.tsx',
          path: 'app/components/Component.tsx',
          description: 'UI component',
          layer: 'ui',
        },
      ];

      // Act
      const grouped = groupFileDefinitionsByLayer(definitions);

      // Assert
      expect(grouped.e2e).toHaveLength(1);
      expect(grouped.lib).toHaveLength(1);
      expect(grouped['data-io']).toHaveLength(1);
      expect(grouped.ui).toHaveLength(1);
      expect(grouped.e2e[0].id).toBe('e2e1');
      expect(grouped.lib[0].id).toBe('lib1');
      expect(grouped['data-io'][0].id).toBe('data-io1');
      expect(grouped.ui[0].id).toBe('ui1');
    });

    it('should return empty arrays for layers with no files', () => {
      // Arrange
      const definitions: FileDefinition[] = [
        {
          id: 'lib1',
          name: 'lib.ts',
          path: 'app/lib/lib.ts',
          description: 'Lib file',
          layer: 'lib',
        },
      ];

      // Act
      const grouped = groupFileDefinitionsByLayer(definitions);

      // Assert
      expect(grouped.e2e).toHaveLength(0);
      expect(grouped.lib).toHaveLength(1);
      expect(grouped['data-io']).toHaveLength(0);
      expect(grouped.ui).toHaveLength(0);
    });
  });

  describe('resolvePlaceholders function', () => {
    it.each([
      {
        case: 'only {service}',
        path: 'develop/{service}/test.md',
        expected: 'develop/flow-auditor/test.md',
      },
      {
        case: 'only {section}',
        path: 'develop/service/{section}/test.md',
        expected: 'develop/service/implementation-flow/test.md',
      },
      {
        case: 'both {service} and {section}',
        path: 'develop/{service}/{section}/test.md',
        expected: 'develop/flow-auditor/implementation-flow/test.md',
      },
      {
        case: 'multiple occurrences',
        path: '{service}/{service}/{section}/{section}',
        expected: 'flow-auditor/flow-auditor/implementation-flow/implementation-flow',
      },
      {
        case: 'no placeholders',
        path: 'develop/flow-auditor/implementation-flow/test.md',
        expected: 'develop/flow-auditor/implementation-flow/test.md',
      },
    ])('should replace placeholders correctly for case: $case', ({ path, expected }) => {
      const service = 'flow-auditor';
      const section = 'implementation-flow';
      expect(resolvePlaceholders(path, service, section)).toBe(expected);
    });
  });

  describe('parseFileListMarkdown function', () => {
    const fullMarkdown = `
# file-list.md - test Section

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| test.spec.ts | tests/e2e/section/service/test.spec.ts | テストファイル |

---

## 2. UI層（Phase 2.3）

### 2.1 Components (test固有)
| ファイル名 | パス | 説明 |
|:---|:---|:---|
| TestComponent.tsx | app/components/service/test/TestComponent.tsx | テストコンポーネント |
| TestComponent.test.tsx | app/components/service/test/TestComponent.test.tsx | ユニットテスト |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| testLogic.ts | app/lib/service/test/testLogic.ts | ロジック実装 |
| logic.test.ts | app/lib/service/test/logic.test.ts | ロジックテスト |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| getData.server.ts | app/data-io/service/test/getData.server.ts | データ取得 |
`;

    it('should parse all sections and create correct file definitions', () => {
      const result = parseFileListMarkdown(fullMarkdown);
      expect(result).toHaveLength(6);

      // E2E
      const e2eFile = result.find(f => f.layer === 'e2e');
      expect(e2eFile).toBeDefined();
      expect(e2eFile?.name).toBe('test.spec.ts');

      // UI
      const uiFiles = result.filter(f => f.layer === 'ui');
      expect(uiFiles).toHaveLength(2);
      expect(uiFiles.some(f => f.name === 'TestComponent.tsx')).toBe(true);

      // Lib
      const libFiles = result.filter(f => f.layer === 'lib');
      expect(libFiles).toHaveLength(2);
      expect(libFiles.some(f => f.name === 'testLogic.ts')).toBe(true);

      // Data-IO
      const dataIoFile = result.find(f => f.layer === 'data-io');
      expect(dataIoFile).toBeDefined();
      expect(dataIoFile?.name).toBe('getData.server.ts');
    });

    it('should generate unique IDs and set pairIds correctly', () => {
      const result = parseFileListMarkdown(fullMarkdown);

      // Unique IDs
      const ids = result.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
      expect(ids.every(id => id)).toBe(true); // Check for empty strings

      // Pair ID for UI layer (TestComponent.tsx and TestComponent.test.tsx are a pair)
      const implFile = result.find(f => f.name === 'TestComponent.tsx');
      const testFile = result.find(f => f.name === 'TestComponent.test.tsx');
      expect(implFile?.pairId).toBe(testFile?.id);
      expect(testFile?.pairId).toBe(implFile?.id);
    });

    it('should skip header and separator rows', () => {
      const markdown = `
## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| logic.ts | app/lib/service/section/logic.ts | ロジック |
`;

      const result = parseFileListMarkdown(markdown);
      expect(result).toHaveLength(1); // ヘッダーとセパレータは除外される
    });

    it('should handle empty markdown', () => {
      const result = parseFileListMarkdown('');
      expect(result).toHaveLength(0);
    });
  });
});
