// implementationFlowDefinition - 純粋ロジック層
// file-list.mdを解析し、実装すべきファイル定義を取得する純粋関数
// 副作用なし、テスタブルなビジネスロジック
//
// アーキテクチャ方針:
// - ファイル読み込み（副作用）は data-io層の readFileListMd.server.ts が担当
// - この層はパース処理のみを行う（純粋関数の原則を守る）

/**
 * ファイル定義
 */
export interface FileDefinition {
  id: string;
  name: string;
  path: string;
  description: string;
  layer: 'e2e' | 'lib' | 'data-io' | 'ui';
  pairId?: string; // テスト⇔実装ファイルのペアID
}

/**
 * ファイル定義の検証
 * - IDの重複チェック
 * - pathの重複チェック
 * - 必須フィールドの存在チェック
 */
export function validateFileDefinitions(definitions: FileDefinition[]): boolean {
  // IDの重複チェック
  const ids = definitions.map(d => d.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    return false;
  }

  // pathの重複チェック
  const paths = definitions.map(d => d.path);
  const uniquePaths = new Set(paths);
  if (paths.length !== uniquePaths.size) {
    return false;
  }

  // 必須フィールドの存在チェック
  for (const def of definitions) {
    if (!def.id || !def.name || !def.path || !def.description || !def.layer) {
      return false;
    }
  }

  return true;
}

/**
 * 層別にファイル定義をグループ化
 */
export function groupFileDefinitionsByLayer(definitions: FileDefinition[]): Record<string, FileDefinition[]> {
  const grouped: Record<string, FileDefinition[]> = {
    e2e: [],
    lib: [],
    'data-io': [],
    ui: [],
  };

  for (const def of definitions) {
    grouped[def.layer].push(def);
  }

  return grouped;
}

/**
 * パステンプレートのプレースホルダーを置換
 * @param path パステンプレート
 * @param service サービス名
 * @param section セクション名
 */
export function resolvePlaceholders(path: string, service: string, section: string): string {
  return path
    .replace(/{service}/g, service)
    .replace(/{section}/g, section);
}

/**
 * file-list.mdのマークダウンテキストをパースしてFileDefinition配列を生成
 * @param markdown file-list.mdの内容
 * @returns FileDefinition配列
 */
export function parseFileListMarkdown(markdown: string): FileDefinition[] {
  const fileDefinitions: FileDefinition[] = [];
  let currentLayer: 'e2e' | 'lib' | 'data-io' | 'ui' | null = null;

  // 改行コードを正規化（\r\nを\nに統一）
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedMarkdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // セクションヘッダーの検出
    const headerMatch = line.match(/^##\s+(\d+)\.\s+(.+)$/);
    if (headerMatch) {
      const sectionName = headerMatch[2];

      // 層の判定（ドキュメントセクションは無視）
      if (sectionName.includes('E2E')) {
        currentLayer = 'e2e';
      } else if (sectionName.includes('UI層')) {
        currentLayer = 'ui';
      } else if (sectionName.includes('純粋ロジック層') || sectionName.includes('lib層')) {
        currentLayer = 'lib';
      } else if (sectionName.includes('副作用層') || sectionName.includes('data-io層')) {
        currentLayer = 'data-io';
      } else if (sectionName.includes('ドキュメント')) {
        // ドキュメントセクションに入ったら層をnullにしてスキップ
        currentLayer = null;
      }
      continue;
    }

    // マークダウンテーブルの行を検出
    const tableRowMatch = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (tableRowMatch && currentLayer) {
      const [, name, path, description] = tableRowMatch;

      // ヘッダー行とセパレータ行をスキップ
      if (name.includes('ファイル名') || name.includes('---') || name.includes(':---')) {
        continue;
      }

      // プレースホルダーや空行をスキップ
      if (name.includes('{') || name.trim() === '' || path.trim() === '') {
        continue;
      }

      // app/routes配下のファイルは除外（ルートファイルはE2Eテストでカバーされ、実装フローの対象外）
      if (path.trim().startsWith('app/routes/')) {
        continue;
      }

      // IDを生成（パスから生成）
      const id = generateFileId(path.trim());

      fileDefinitions.push({
        id,
        name: name.trim(),
        path: path.trim(),
        description: description.trim(),
        layer: currentLayer,
      });
    }
  }

  // ファイルペアの関連付け（pairIdの設定）
  setPairIds(fileDefinitions);

  return fileDefinitions;
}

/**
 * ファイルパスからIDを生成
 * @param path ファイルパス
 * @returns ファイルID
 */
function generateFileId(path: string): string {
  // パスから拡張子とディレクトリを除去してIDを生成
  // 例: "app/lib/flow-auditor/implementation-flow/foo.ts" → "lib-foo"
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];

  // 層を判定
  let layerPrefix = '';
  if (path.startsWith('tests/e2e')) {
    layerPrefix = 'e2e';
  } else if (path.includes('/lib/')) {
    layerPrefix = 'lib';
  } else if (path.includes('/data-io/')) {
    layerPrefix = 'data-io';
  } else if (path.includes('/components/')) {
    layerPrefix = 'ui';
  } else if (path.startsWith('app/routes/')) {
    // ルートファイルは実装フローの対象外だが、念のため'route'プレフィックスを設定
    layerPrefix = 'route';
  }

  // 長い拡張子から先にマッチさせる（.test.tsx, .test.ts, .spec.ts, .server.tsなどを優先）
  const baseName = fileName.replace(/\.(test\.tsx|test\.ts|spec\.ts|server\.ts|tsx|ts|jsx|js)$/, '');

  // テストファイルの場合は接尾辞を追加して一意にする
  const isTestFile = fileName.includes('.test.') || fileName.includes('.spec.');
  const suffix = isTestFile ? '-test' : '';

  return `${layerPrefix}-${baseName.replace(/\./g, '-')}${suffix}`;
}

/**
 * テストファイルと実装ファイルのペアIDを設定
 * @param files FileDefinition配列
 */
function setPairIds(files: FileDefinition[]): void {
  for (const file of files) {
    // テストファイルかどうかを判定
    const isTestFile = file.name.endsWith('.test.ts') ||
                       file.name.endsWith('.test.tsx') ||
                       file.name.endsWith('.spec.ts');

    if (isTestFile) {
      // テストファイルの場合、対応する実装ファイルを検索
      const implFileName = file.name
        .replace('.test.ts', '.ts')
        .replace('.test.tsx', '.tsx')
        .replace('.spec.ts', '.ts');

      const implFile = files.find(f => f.name === implFileName && f.layer === file.layer);
      if (implFile) {
        file.pairId = implFile.id;
        implFile.pairId = file.id;
      }
    }
  }
}
