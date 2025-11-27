// {{name}} - 🔌 副作用層
// {{FUNCTION_DESCRIPTION}}
// データベース、API、ファイルシステムなどの外部リソースとの相互作用

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface {{name}}Options {
  // TODO: オプションパラメータの型定義を追加
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface {{name}}Result {
  // TODO: 処理結果の型定義を追加
}

/**
 * {{FUNCTION_DESCRIPTION}}
 *
 * @param options - 処理オプション
 * @returns 処理結果
 */
export async function {{name}}(options: {{name}}Options): Promise<{{name}}Result> {
  try {
    // TODO: 副作用を伴う処理を実装
    // - データベースアクセス
    // - API呼び出し
    // - ファイル操作
    // - 外部サービス連携

    return {
      // TODO: 処理結果を返す
    };
  } catch (error) {
    console.error(`{{name}} failed:`, error);
    throw new Error(`{{name}} operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * {{name}}の設定検証
 */
export function validate{{name}}Options(options: unknown): options is {{name}}Options {
  // TODO: オプションの検証ロジックを実装
  return true;
}