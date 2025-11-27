// TDDテストファイル: 対話型ジェネレーター
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

describe('設定読み込み機能', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadProjectConfig', () => {
    it('存在しない設定ファイルを読み込もうとした場合、適切なエラーを投げる', async () => {
      // ナレッジベース 'Vitest fs モック問題.md' に従い、fsモックを廃止
      // 代わりに、存在しないファイルを指すように関数を一時的に書き換える
      const { loadProjectConfig, __setProjectConfigPath } = await import('./scaffold-and-lint.js');
      const originalPath = __setProjectConfigPath('non-existent-project.toml');

      // 元のパスに戻す後処理を登録
      afterEach(() => __setProjectConfigPath(originalPath));

      // テスト対象の関数を呼び出す

      expect(() => {
        loadProjectConfig();
      }).toThrow('プロジェクト設定ファイル (scripts/project.toml) が見つかりません');
    });
  });

  describe('loadTemplateConfig', () => {
    it('存在しない設定ファイルを読み込もうとした場合、適切なエラーを投げる', async () => {
      // ナレッジベース 'Vitest fs モック問題.md' に従い、fsモックを廃止
      // 代わりに、存在しないファイルを指すように関数を一時的に書き換える
      const { loadTemplateConfig, __setTemplateConfigPath } = await import('./scaffold-and-lint.js');
      const originalPath = __setTemplateConfigPath('non-existent-config.json');

      // 元のパスに戻す後処理を登録
      afterEach(() => __setTemplateConfigPath(originalPath));

      // テスト対象の関数を呼び出す

      expect(() => {
        loadTemplateConfig();
      }).toThrow('テンプレート設定ファイル (scripts/generate/config.json) が見つかりません');
    });
  });
});

describe('ファイルパス生成機能', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildFilePaths', () => {
    it('lib層: ユーザー回答とテンプレート設定に基づいて正しいファイルパスを構築する', async () => {
      const { buildFilePaths } = await import('./scaffold-and-lint.js');

      const mockAnswers = {
        category: 'lib',
        service: 'sales',
        section: 'summary',
        name: 'ProfitCalculator'
      };

      const mockTemplateConfig = {
        layers: {
          lib: {
            description: '🧠 純粋ロジック層 (app/lib)',
            pathPattern: 'app/lib/{{service}}/{{section}}/{{name}}.ts',
            templateFile: 'code/logic.template.ts',
            test: {
              pathPattern: 'app/lib/{{service}}/{{section}}/{{name}}.test.ts',
              templateFile: 'test/logic-test.template.ts'
            }
          }
        }
      };

      const result = buildFilePaths(mockAnswers, mockTemplateConfig);

      expect(result).toEqual([
        {
          outputPath: 'app/lib/sales/summary/ProfitCalculator.ts',
          templateFile: 'code/logic.template.ts'
        },
        {
          outputPath: 'app/lib/sales/summary/ProfitCalculator.test.ts',
          templateFile: 'test/logic-test.template.ts'
        }
      ]);
    });

    it('UI層(component): ユーザー回答とテンプレート設定に基づいて正しいファイルパスを構築する', async () => {
      const { buildFilePaths } = await import('./scaffold-and-lint.js');

      const mockAnswers = {
        category: 'ui',
        uiType: 'component',
        service: 'sales',
        section: 'summary',
        name: 'SalesChart'
      };

      const mockTemplateConfig = {
        layers: {
          component: {
            description: 'app/components: コンポーネント (app/components)',
            pathPattern: 'app/components/{{service}}/{{section}}/{{name}}.tsx',
            templateFile: 'code/component.template.tsx',
            test: {
              pathPattern: 'app/components/{{service}}/{{section}}/{{name}}.test.tsx',
              templateFile: 'test/component-test.template.tsx'
            }
          }
        }
      };

      const result = buildFilePaths(mockAnswers, mockTemplateConfig);

      expect(result).toEqual([
        {
          outputPath: 'app/components/sales/summary/SalesChart.tsx',
          templateFile: 'code/component.template.tsx'
        },
        {
          outputPath: 'app/components/sales/summary/SalesChart.test.tsx',
          templateFile: 'test/component-test.template.tsx'
        }
      ]);
    });

    it('UI層(route): ルートファイルのパスを正しく構築する（テストファイルなし）', async () => {
      const { buildFilePaths } = await import('./scaffold-and-lint.js');

      const mockAnswers = {
        category: 'ui',
        uiType: 'route',
        service: 'sales',
        section: 'summary',
        name: 'index'
      };

      const mockTemplateConfig = {
        layers: {
          route: {
            description: 'app/components: ルート (app/routes)',
            pathPattern: 'app/routes/{{service}}/{{section}}/{{name}}.tsx',
            templateFile: 'code/route.template.tsx'
            // テストファイルなし（E2Eテストでカバー）
          }
        }
      };

      const result = buildFilePaths(mockAnswers, mockTemplateConfig);

      expect(result).toEqual([
        {
          outputPath: 'app/routes/sales/summary/index.tsx',
          templateFile: 'code/route.template.tsx'
        }
        // テストファイルは生成されない
      ]);
    });

    it('data-io層: ファイルパスを正しく構築する', async () => {
      const { buildFilePaths } = await import('./scaffold-and-lint.js');

      const mockAnswers = {
        category: 'data-io',
        service: 'sales',
        section: 'summary',
        name: 'fetchSalesData'
      };

      const mockTemplateConfig = {
        layers: {
          'data-io': {
            description: '🔌 副作用層 (app/data-io)',
            pathPattern: 'app/data-io/{{service}}/{{section}}/{{name}}.ts',
            templateFile: 'code/data-io.template.ts',
            test: {
              pathPattern: 'app/data-io/{{service}}/{{section}}/{{name}}.test.ts',
              templateFile: 'test/data-io-test.template.ts'
            }
          }
        }
      };

      const result = buildFilePaths(mockAnswers, mockTemplateConfig);

      expect(result).toEqual([
        {
          outputPath: 'app/data-io/sales/summary/fetchSalesData.ts',
          templateFile: 'code/data-io.template.ts'
        },
        {
          outputPath: 'app/data-io/sales/summary/fetchSalesData.test.ts',
          templateFile: 'test/data-io-test.template.ts'
        }
      ]);
    });

    it('documents層: ドキュメントファイルのパスを正しく構築する', async () => {
      const { buildFilePaths } = await import('./scaffold-and-lint.js');

      const mockAnswers = {
        category: 'documents',
        documentType: 'func-spec',
        service: 'sales',
        section: 'summary'
      };

      const mockTemplateConfig = {
        documents: {
          'func-spec': {
            description: '機能設計書',
            pathPattern: 'develop/{{service}}/{{section}}/func-spec.md',
            templateFile: 'docs/requirements.template.md'
          }
        }
      };

      const result = buildFilePaths(mockAnswers, mockTemplateConfig);

      expect(result).toEqual([
        {
          outputPath: 'develop/sales/summary/func-spec.md',
          templateFile: 'docs/requirements.template.md'
        }
      ]);
    });
  });
});

describe('実設定ファイル統合テスト', () => {
  describe('buildFilePaths with real config.json', () => {
    it('layers: 実際のconfig.jsonと互換性があることを確認', async () => {
      const realFs = await import('fs');
      const realPath = await import('path');

      const { buildFilePaths } = await import('./scaffold-and-lint.js');

      // 実際のconfig.jsonを直接読み込み
      const configPath = realPath.join(process.cwd(), 'scripts', 'generate', 'config.json');
      const configContent = realFs.readFileSync(configPath, 'utf8');
      const realTemplateConfig = JSON.parse(configContent);

      // 各層のテストケース
      const testCases = [
        {
          answers: { category: 'ui', uiType: 'component', service: 'sales', section: 'summary', name: 'TestComponent' },
          expectedPaths: ['app/components/sales/summary/TestComponent.tsx', 'app/components/sales/summary/TestComponent.test.tsx'],
          expectedTemplates: ['code/component.template.tsx', 'test/component-test.template.tsx']
        },
        {
          answers: { category: 'lib', service: 'sales', section: 'summary', name: 'TestLogic' },
          expectedPaths: ['app/lib/sales/summary/TestLogic.ts', 'app/lib/sales/summary/TestLogic.test.ts'],
          expectedTemplates: ['code/logic.template.ts', 'test/logic-test.template.ts']
        },
        {
          answers: { category: 'data-io', service: 'sales', section: 'summary', name: 'TestDataIO' },
          expectedPaths: ['app/data-io/sales/summary/TestDataIO.ts', 'app/data-io/sales/summary/TestDataIO.test.ts'],
          expectedTemplates: ['code/data-io.template.ts', 'test/data-io-test.template.ts']
        }
      ];

      // route層は実装ファイルのみ（E2Eテストでカバーするためユニットテストなし）
      const routeResult = buildFilePaths(
        { category: 'ui', uiType: 'route', service: 'sales', section: 'summary', name: 'TestRoute' },
        realTemplateConfig
      );
      expect(routeResult).toHaveLength(1); // 実装ファイルのみ
      expect(routeResult[0].outputPath).toBe('app/routes/sales._index.tsx');
      expect(routeResult[0].templateFile).toBe('code/route.template.tsx');

      // その他の層は実装ファイル + テストファイル
      for (const testCase of testCases) {
        const result = buildFilePaths(testCase.answers, realTemplateConfig);

        expect(result).toHaveLength(2); // 実装ファイル + テストファイル
        expect(result[0].outputPath).toBe(testCase.expectedPaths[0]);
        expect(result[1].outputPath).toBe(testCase.expectedPaths[1]);

        // テンプレートファイルが正しく指定されていることを確認
        expect(result[0].templateFile).toBe(testCase.expectedTemplates[0]);
        expect(result[1].templateFile).toBe(testCase.expectedTemplates[1]);
      }
    });

    it('documents: 実際のconfig.jsonと互換性があることを確認', async () => {
      const realFs = await import('fs');
      const realPath = await import('path');

      const { buildFilePaths } = await import('./scaffold-and-lint.js');

      // 実際のconfig.jsonを直接読み込み
      const configPath = realPath.join(process.cwd(), 'scripts', 'generate', 'config.json');
      const configContent = realFs.readFileSync(configPath, 'utf8');
      const realTemplateConfig = JSON.parse(configContent);

      // ドキュメントのテストケース
      const testCases = [
        {
          answers: { category: 'documents', documentType: 'func-spec', service: 'sales', section: 'summary' },
          expectedPath: 'develop/sales/summary/func-spec.md',
          expectedTemplate: 'docs/func-spec.template.md'
        },
        {
          answers: { category: 'documents', documentType: 'uiux-spec', service: 'sales', section: 'summary' },
          expectedPath: 'develop/sales/summary/uiux-spec.md',
          expectedTemplate: 'docs/uiux-spec.template.md'
        },
        {
          answers: { category: 'documents', documentType: 'tdd-workflow', service: 'sales', section: 'summary' },
          expectedPath: 'develop/sales/summary/TDD_WORK_FLOW.md',
          expectedTemplate: 'workflow/TDD_WORK_FLOW.md'
        },
        {
          answers: { category: 'documents', documentType: 'file-list', service: 'sales', section: 'summary' },
          expectedPath: 'develop/sales/summary/file-list.md',
          expectedTemplate: 'workflow/file-list.template.md'
        },
        {
          answers: { category: 'documents', documentType: 'requirements-analysis-pipe', service: 'sales' },
          expectedPath: 'develop/sales/REQUIREMENTS_ANALYSIS_PIPE.md',
          expectedTemplate: 'workflow/REQUIREMENTS_ANALYSIS_PIPE.md'
        },
        {
          answers: { category: 'documents', documentType: 'guiding-principles', service: 'sales' },
          expectedPath: 'develop/sales/GUIDING_PRINCIPLES.md',
          expectedTemplate: 'workflow/GUIDING_PRINCIPLES.md'
        }
      ];

      for (const testCase of testCases) {
        const result = buildFilePaths(testCase.answers, realTemplateConfig);

        expect(result).toHaveLength(1); // ドキュメントはテストファイルなし
        expect(result[0].outputPath).toBe(testCase.expectedPath);
        expect(result[0].templateFile).toBe(testCase.expectedTemplate);
      }
    });
  });
});

describe('テンプレートファイル存在確認テスト', () => {
  describe('template files existence', () => {
    it('layers設定: すべてのテンプレートファイルが物理的に存在することを確認', async () => {
      const realFs = await import('fs');
      const realPath = await import('path');

      // 実際のconfig.jsonを直接読み込み
      const configPath = realPath.join(process.cwd(), 'scripts', 'generate', 'config.json');
      const configContent = realFs.readFileSync(configPath, 'utf8');
      const realTemplateConfig = JSON.parse(configContent);

      const templateFiles = new Set();

      // layers設定からテンプレートファイルを収集
      if (realTemplateConfig.layers) {
        for (const [layerKey, layerConfig] of Object.entries(realTemplateConfig.layers)) {
          if (layerConfig.templateFile) {
            templateFiles.add({ file: layerConfig.templateFile, source: `layers.${layerKey}` });
          }
          if (layerConfig.test && layerConfig.test.templateFile) {
            templateFiles.add({ file: layerConfig.test.templateFile, source: `layers.${layerKey}.test` });
          }
        }
      }

      // 各テンプレートファイルの存在を確認
      for (const { file, source } of templateFiles) {
        const templatePath = realPath.join(process.cwd(), 'scripts', 'generate', 'templates', file);

        try {
          const stats = realFs.statSync(templatePath);
          expect(stats.isFile()).toBe(true);
        } catch (error) {
          throw new Error(`テンプレートファイルが見つかりません: ${file} (from ${source})`);
        }
      }
    });

    it('documents設定: すべてのテンプレートファイルが物理的に存在することを確認', async () => {
      const realFs = await import('fs');
      const realPath = await import('path');

      // 実際のconfig.jsonを直接読み込み
      const configPath = realPath.join(process.cwd(), 'scripts', 'generate', 'config.json');
      const configContent = realFs.readFileSync(configPath, 'utf8');
      const realTemplateConfig = JSON.parse(configContent);

      const templateFiles = new Set();

      // documents設定からテンプレートファイルを収集
      if (realTemplateConfig.documents) {
        for (const [docKey, docConfig] of Object.entries(realTemplateConfig.documents)) {
          if (docConfig.templateFile) {
            templateFiles.add({ file: docConfig.templateFile, source: `documents.${docKey}` });
          }
        }
      }

      // 各テンプレートファイルの存在を確認
      for (const { file, source } of templateFiles) {
        const templatePath = realPath.join(process.cwd(), 'scripts', 'generate', 'templates', file);

        try {
          const stats = realFs.statSync(templatePath);
          expect(stats.isFile()).toBe(true);
        } catch (error) {
          throw new Error(`テンプレートファイルが見つかりません: ${file} (from ${source})`);
        }
      }
    });
  });
});