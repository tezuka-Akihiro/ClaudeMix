// extractHeadings.ts - マークダウンから見出しを抽出
// Pure Logic層 - 副作用なし
// 階層定義: develop/blog/post-detail/func-spec.md の「目次階層の定義」参照

import { slugify } from './slugify';
import type { Heading } from '~/specs/blog/types';

// 型を再エクスポート
export type { Heading };

/**
 * マークダウンテキストから見出しを抽出する
 * h2〜h4（##〜####）を抽出し、目次表示およびペイウォール区切り指定に使用
 *
 * コードブロック（```で囲まれた部分）内の見出しは除外する
 *
 * @param markdown - マークダウン形式のテキスト
 * @returns 見出し情報の配列
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split("\n");

  let inCodeBlock = false;
  const codeBlockDelimiter = /^```/;
  // h2〜h4（##〜####）を抽出
  const headingRegex = /^(#{2,4})\s+(.+)$/;

  for (const line of lines) {
    // Windows改行コード(\r)を除去
    const trimmedLine = line.trim();

    // コードブロックの開始/終了を検出
    if (codeBlockDelimiter.test(trimmedLine)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // コードブロック内の場合はスキップ
    if (inCodeBlock) {
      continue;
    }

    // コードブロック外の見出しを抽出（h2〜h4）
    const match = headingRegex.exec(trimmedLine);
    if (match) {
      const level = match[1].length as 2 | 3 | 4;
      const text = match[2].trim();
      const id = slugify(text);

      headings.push({ level, text, id });
    }
  }

  return headings;
}
