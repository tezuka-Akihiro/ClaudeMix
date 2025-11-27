// implementationFlowTypes - 純粋ロジック層
// implementation-flowで使用する型定義を一元管理

/**
 * buildImplementationFlowの戻り値型
 */
export interface ImplementationFlowOutput {
  layerGroups: LayerGroup[];
}


/**
 * ファイル定義（file-list.mdから抽出されるファイル情報）
 */
export interface FileDefinition {
  id: string; // 一意識別子
  name: string; // ファイル名
  path: string; // ファイルパス
  description: string; // 説明
  layer: 'e2e' | 'lib' | 'data-io' | 'ui'; // 層分類
  exists?: boolean; // ファイル存在状態（builder追加後）
  pairId?: string; // ペアファイルのID（builder追加後）
}

/**
 * test-scriptペア（横並び表示用）
 */
export interface TestScriptPair {
  testFile: FileDefinition;
  scriptFile: FileDefinition;
}

/**
 * 層別グループ（app/lib、app/data-io、app/components）
 */
export interface LayerGroup {
  layer: 'e2e' | 'lib' | 'data-io' | 'ui';
  displayName: string; // 表示名（絵文字付き）
  pairs: TestScriptPair[]; // test-scriptペアの配列
  unpairedFiles: FileDefinition[]; // ペアにならなかったファイル
}

/**
 * ファイルペア情報（Surgical Retry用）
 */
export interface FilePairInfo {
  file: FileDefinition; // 選択されたファイル
  pair?: FileDefinition; // ペアファイル（存在する場合）
}
