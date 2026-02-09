/**
 * CSSセレクタ形式の文字列から data-testid の値のみを抽出する
 *
 * @example
 * extractTestId("[data-testid='blog-header']") // => "blog-header"
 * extractTestId("blog-header") // => "blog-header"
 *
 * @param selector - CSSセレクタ形式の文字列
 * @returns data-testid の値
 */
export function extractTestId(selector: string): string {
  // [data-testid='...'] または [data-testid="..."] の形式を想定
  const match = selector.match(/data-testid=['"]([^'"]+)['"]/);
  return match ? match[1] : selector;
}
