// markdownConverter - 🧠 純粋ロジック層
// マークダウン形式の文字列をHTML形式に変換する純粋関数
// 副作用なし、テスタブルなビジネスロジック

import { marked, type Tokens, type RendererObject } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter, type Highlighter } from 'shiki/bundle/full';
import { slugify } from './slugify';

let highlighter: Highlighter | undefined;
const theme = 'github-dark-high-contrast';
/**
 * Shikiハイライターを初期化する（シングルトン）
 */
async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [theme],
      langs: ['javascript', 'typescript', 'html', 'css', 'markdown', 'bash', 'json', 'tsx', 'diff', 'yaml', 'xml'],
    });
  }
  return highlighter;
}

/**
 * マークダウンをHTMLに変換する
 *
 * @param markdown - マークダウン形式の文字列
 * @returns Promise<string> - HTML形式の文字列（サニタイズ済み）
 */
export async function convertMarkdownToHtml(markdown: string): Promise<string> {
  const highlighter = await getHighlighter();

  marked.setOptions({
    gfm: true, // GFM (GH-Flavored Markdown)
    breaks: true, // 改行を<br>に変換
  });

  // カスタムレンダラーの設定
  const renderer: RendererObject = {

    image({ href, title, text }) {
      const src = href ?? '';
      const alt = text || '';
      const titleAttr = title ? `title="${title}"` : '';
      return `<img
      src="${src}"
      alt="${alt}"
      ${titleAttr}
      loading="lazy"
      style="max-width: 100%; height: auto;"
    />`;
    },

    heading({ text, depth: level }) {
      const id = slugify(text);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    },

    code({ text }) {
      // walkTokensでshikiによって変換されたHTMLがtextに入ってくるので、そのまま返す
      return text;
    },

    listitem(this: unknown, token: Tokens.ListItem) {
      const text = token.text;
      const isChecked = token.checked;

      // チェックボックスアイテムの場合
      if (typeof isChecked === 'boolean') {
        const checkbox = `<input type="checkbox" ${isChecked ? 'checked' : ''} disabled class="task-list-item-checkbox">`;
        return `<li class="task-list-item">${checkbox} ${text}</li>\n`;
      }

      // 通常のリストアイテム
      return `<li>${text}</li>\n`;
    },
  };

  // markedの非同期プラグインとしてshikiを統合
  const walkTokens = (token: Tokens.Generic) => {
    if (token.type === 'code') {
      const lang = token.lang || 'text';
      // Mermaidコードブロックは特別扱い
      if (lang === 'mermaid') {
        // markedはデフォルトでエスケープするので、ここではエスケープされたコードを戻す
        const unescapedCode = token.text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        token.text = `<pre class="mermaid">${unescapedCode}</pre>`;
        token.escaped = true; // markedに再エスケープさせない
      } else {
        token.text = highlighter.codeToHtml(token.text, { lang, theme });
        token.escaped = true; // shikiがHTMLを生成したので、markedに再エスケープさせない
      }
    }
  };
  marked.use({ renderer, walkTokens, async: true });

  // マークダウンをHTMLに変換
  const rawHtml = await marked.parse(markdown) as string;

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
      'input',
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
      'input': ['type', 'checked', 'disabled', 'class'],
      'li': ['class'],
    },
    allowedClasses: {
      'pre': ['mermaid', 'shiki', theme], // shikiが生成するクラスを許可
      'code': ['language-*', 'has-line-numbers'],
      'span': ['line'],
      'div': ['class'],
      'input': ['task-list-item-checkbox'],
      'li': ['task-list-item'],
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
