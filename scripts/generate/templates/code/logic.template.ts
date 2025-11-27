// {{name}} - 🧠 純粋ロジック層
// {{FUNCTION_DESCRIPTION}}
// 副作用なし、テスタブルなビジネスロジック

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface {{name}}Input {
  // TODO: 入力データの型定義を追加
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface {{name}}Output {
  // TODO: 出力データの型定義を追加
}

/**
 * {{FUNCTION_DESCRIPTION}}
 *
 * @param input - 処理対象のデータ
 * @returns 処理結果
 */
export function {{name}}(input: {{name}}Input): {{name}}Output {
  // TODO: 純粋関数としてビジネスロジックを実装
  // - 外部依存なし
  // - 副作用なし
  // - 同じ入力に対して常に同じ出力

  return {
    // TODO: 処理結果を返す
  };
}

/**
 * {{name}}の補助関数
 */
export function validate{{name}}Input(input: unknown): input is {{name}}Input {
  // TODO: 入力値の検証ロジックを実装
  return true;
}