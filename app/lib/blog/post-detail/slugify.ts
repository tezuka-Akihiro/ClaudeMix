// slugify.ts - 見出しテキストをURLセーフなスラグに変換
// Pure Logic層 - 副作用なし

/**
 * 見出しテキストをURLセーフなスラグに変換する
 * 日本語テキストはそのまま保持し、英語はlowercaseに変換
 *
 * @param text - 変換対象の見出しテキスト
 * @returns URLセーフなスラグ文字列
 */
export function slugify(text: string): string {
  if (!text) return "";

  return (
    text
      // 小文字に変換（英語のみ影響）
      .toLowerCase()
      // 特殊文字を除去（日本語・英数字・スペース・ハイフン以外）
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      // 連続する空白をハイフンに変換
      .replace(/\s+/g, "-")
      // 連続するハイフンを単一に
      .replace(/-+/g, "-")
      // 先頭・末尾のハイフンを除去
      .replace(/^-|-$/g, "")
  );
}
