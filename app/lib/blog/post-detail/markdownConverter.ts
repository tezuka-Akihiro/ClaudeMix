// markdownConverter - 🧠 純粋ロジック層
// マークダウン形式の文字列をHTML形式に変換する純粋関数
// 副作用なし、テスタブルなビジネスロジック

import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { slugify } from './slugify';

/**
 * マークダウンをHTMLに変換する
 *
 * @param markdown - マークダウン形式の文字列
 * @returns HTML形式の文字列（サニタイズ済み）
 */
export function convertMarkdownToHtml(markdown: string): string {
  // marked の設定
  marked.setOptions({
    gfm: true, // GFM (GH-Flavored Markdown)
    breaks: true, // 改行を<br>に変換
  });

  // カスタムレンダラーの設定
  const renderer = new marked.Renderer();

  // 画像レンダラーのカスタマイズ（遅延読み込み + レスポンシブ対応）
  renderer.image = function(token: any): string {
    const src = token.href;
    const alt = token.text || '';
    const title = token.title || '';

    return `<img
      src="${src}"
      alt="${alt}"
      ${title ? `title="${title}"` : ''}
      loading="lazy"
      style="max-width: 100%; height: auto;"
    />`;
  };

  // 見出しレンダラーのカスタマイズ（ID属性を付与）
  renderer.heading = function(token: any): string {
    const text = token.text;
    const depth = token.depth;
    const id = slugify(text);
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  // カスタムレンダラーでコードブロックを処理
  renderer.code = function(token: any): string {
    const code = token.text;
    const lang = token.lang || 'text';

    // Mermaidコードブロックは特別扱い
    if (lang === 'mermaid') {
      return `<pre class="mermaid">${code}</pre>`;
    }

    // 基本的なHTMLエスケープ処理
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
  };

  // marked.use()でレンダラーを設定
  marked.use({ renderer });

  // マークダウンをHTMLに変換
  const rawHtml = marked.parse(markdown) as string;

  // XSS対策のためHTMLをサニタイズ
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br',
      'ul', 'ol', 'li',
      'pre', 'code',
      'blockquote',
      'a',
      'img',
      'div', 'span',
      'strong', 'em', 'b', 'i',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'loading', 'style'],
      'code': ['class', 'style'],
      'pre': ['class', 'style'],
      'div': ['class', 'style'],
      'span': ['class', 'style'],
      'h1': ['id'],
      'h2': ['id'],
      'h3': ['id'],
      'h4': ['id'],
      'h5': ['id'],
      'h6': ['id'],
    },
    allowedClasses: {
      'pre': ['mermaid', 'language-*', 'shiki', '*'],
      'code': ['language-*', '*'],
      'span': ['*'],
      'div': ['*'],
    },
    allowedStyles: {
      '*': {
        // Shikiが生成するインラインスタイルを許可
        'color': [/^#[0-9a-fA-F]{3,6}$/],
        'background-color': [/^#[0-9a-fA-F]{3,6}$/],
        'background': [/^#[0-9a-fA-F]{3,6}$/],
        'font-style': [/^(italic|normal)$/],
        'font-weight': [/^(bold|normal|\d+)$/],
        'text-decoration': [/.*/],
        // 画像のレスポンシブ対応用スタイルを許可
        'max-width': [/^\d+%?$/],
        'height': [/^auto$/],
      },
    },
    // リンクのプロトコル制限
    allowedSchemes: ['http', 'https', 'mailto'],
    // 外部リンクの安全性設定
    transformTags: {
      'a': (tagName, attribs) => {
        const href = attribs.href || '';
        // 外部リンクの場合は rel="noopener noreferrer" を追加
        if (href.startsWith('http://') || href.startsWith('https://')) {
          return {
            tagName,
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          };
        }
        return { tagName, attribs };
      },
    },
  });

  return cleanHtml;
}
