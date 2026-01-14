#!/usr/bin/env node

/**
 * プリビルドスクリプト: ブログ記事のバンドル生成
 *
 * このスクリプトは、ビルド時に実行され、Markdownファイルから
 * TypeScriptモジュールを生成します。Cloudflare Workersでは
 * ファイルシステムアクセスができないため、ビルド時にコンテンツを
 * バンドルする必要があります。
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter } from 'shiki/bundle/full';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

// Shikiハイライター（グローバルシングルトン）
let highlighter = null;
const theme = 'github-dark';

/**
 * slugify - 見出しテキストをURLセーフなIDに変換
 */
function slugify(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * extractHeadings - マークダウンから見出しを抽出
 */
function extractHeadings(markdown) {
  const headings = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;
  const codeBlockDelimiter = /^```/;
  const headingRegex = /^(#{2})\s+(.+)$/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (codeBlockDelimiter.test(trimmedLine)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = headingRegex.exec(trimmedLine);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);
      headings.push({ level, text, id });
    }
  }
  return headings;
}

/**
 * splitContentByHeading - 見出しベースでHTMLコンテンツを分割
 * @param {string} htmlContent - 分割するHTMLコンテンツ
 * @param {string|null} cutoffHeadingId - 分割位置となる見出しのID
 * @returns {{visibleContent: string, hiddenContent: string}} 分割されたコンテンツ
 */
function splitContentByHeading(htmlContent, cutoffHeadingId) {
  if (cutoffHeadingId === null) {
    return {
      visibleContent: htmlContent,
      hiddenContent: '',
    };
  }

  if (!htmlContent.trim()) {
    return {
      visibleContent: '',
      hiddenContent: '',
    };
  }

  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const body = document.body;

    const targetHeading = document.getElementById(cutoffHeadingId);

    if (!targetHeading) {
      return {
        visibleContent: htmlContent,
        hiddenContent: '',
      };
    }

    const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    let nextHeading = null;
    let currentElement = targetHeading.nextElementSibling;

    while (currentElement) {
      if (headingTags.includes(currentElement.tagName)) {
        nextHeading = currentElement;
        break;
      }
      currentElement = currentElement.nextElementSibling;
    }

    if (!nextHeading) {
      return {
        visibleContent: htmlContent,
        hiddenContent: '',
      };
    }

    const visibleElements = [];
    const hiddenElements = [];
    let isVisible = true;

    Array.from(body.children).forEach((element) => {
      if (element === nextHeading) {
        isVisible = false;
      }

      if (isVisible) {
        visibleElements.push(element);
      } else {
        hiddenElements.push(element);
      }
    });

    const visibleContent = visibleElements
      .map((el) => el.outerHTML)
      .join('');
    const hiddenContent = hiddenElements
      .map((el) => el.outerHTML)
      .join('');

    return {
      visibleContent,
      hiddenContent,
    };
  } catch (error) {
    console.error('HTML parsing error in splitContentByHeading:', error);
    return {
      visibleContent: htmlContent,
      hiddenContent: '',
    };
  }
}

/**
 * getHighlighter - Shikiハイライターを初期化（シングルトン）
 */
async function getHighlighter() {
  if (!highlighter) {
    console.log('⚡ Initializing Shiki highlighter...');
    highlighter = await createHighlighter({
      themes: [theme],
      langs: ['javascript', 'typescript', 'html', 'css', 'markdown', 'bash', 'json', 'tsx', 'diff', 'yaml', 'xml'],
    });
    console.log('✅ Shiki highlighter ready');
  }
  return highlighter;
}

/**
 * convertMarkdownToHtml - マークダウンをHTMLに変換
 * @returns {Promise<{html: string, hasMermaid: boolean}>}
 */
async function convertMarkdownToHtml(markdown) {
  const marked = new Marked(); // 変換ごとに新しいインスタンスを生成
  const hl = await getHighlighter();
  let hasMermaid = false; // Mermaidダイアグラムの有無を追跡

  const renderer = {
    image({ href, title, text }) {
      const src = href ?? '';
      const alt = text || '';
      const titleAttr = title ? `title="${title}"` : '';
      return `<img src="${src}" alt="${alt}" ${titleAttr} loading="lazy" style="max-width: 100%; height: auto;" />`;
    },
    heading({ text, depth: level }) {
      const id = slugify(text);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    },
    code({ text }) {
      return text;
    },
  };

  const walkTokens = (token) => {
    if (token.type === 'code') {
      const lang = token.lang || 'text';
      if (lang === 'mermaid') {
        hasMermaid = true; // Mermaidダイアグラムを検出
        const unescapedCode = token.text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        token.text = `<pre class="mermaid">${unescapedCode}</pre>`;
        token.escaped = true;
      } else {
        try {
          token.text = hl.codeToHtml(token.text, { lang, theme });
          token.escaped = true;
        } catch (error) {
          // サポートされていない言語はtextにフォールバック
          console.warn(`   ⚠️  Language "${lang}" not supported, using plain text`);
          token.text = hl.codeToHtml(token.text, { lang: 'text', theme });
          token.escaped = true;
        }
      }
    }
  };

  marked.use({ gfm: true, breaks: true, renderer, walkTokens, async: true });
  const rawHtml = await marked.parse(markdown);

  const html = sanitizeHtml(rawHtml, {
    allowedTags: ['h1','h2','h3','h4','h5','h6','p','br','ul','ol','li','pre','code','blockquote','a','img','div','span','strong','em','b','i','table','thead','tbody','tr','th','td'],
    allowedAttributes: {
      'a': ['href','target','rel'],
      'img': ['src','alt','title','loading','style'],
      'code': ['class','style'],
      'pre': ['class','style'],
      'div': ['class','style'],
      'span': ['class','style'],
      'h1': ['id'], 'h2': ['id'], 'h3': ['id'], 'h4': ['id'], 'h5': ['id'], 'h6': ['id'],
    },
    allowedClasses: {
      'pre': ['mermaid', 'shiki', theme],
      'code': ['language-*', 'has-line-numbers'],
      'span': ['line'],
      'div': ['class'],
    },
    allowedStyles: {
      '*': {
        'color': [/^#[0-9a-fA-F]{3,6}$/],
        'background-color': [/^#[0-9a-fA-F]{3,6}$/],
        'background': [/^#[0-9a-fA-F]{3,6}$/],
        'font-style': [/^(italic|normal)$/],
        'font-weight': [/^(bold|normal|\d+)$/],
        'text-decoration': [/.*/],
        'max-width': [/^\d+%?$/],
        'height': [/^auto$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => {
        const href = attribs.href || '';
        if (href.startsWith('http://') || href.startsWith('https://')) {
          return {
            tagName,
            attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
          };
        }
        return { tagName, attribs };
      },
    },
  });

  return { html, hasMermaid };
}

/**
 * ブログ記事を生成する（順次処理版）
 */
async function generateBlogPosts() {
  try {
    console.log('🚀 Starting blog posts generation...');

    // 並列処理の前にハイライターを一度だけ初期化する
    await getHighlighter();

    // 1. Markdownファイルを読み込む
    const postsDir = path.join(rootDir, 'content/blog/posts');
    const files = await fs.readdir(postsDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    console.log(`📝 Found ${markdownFiles.length} markdown files`);

    // 2. 各ファイルを解析
    const posts = await Promise.all(
      markdownFiles.map(async (file) => {
        const slug = file.replace(/\.md$/, '');
        const filePath = path.join(postsDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');

        // gray-matterでフロントマターを解析
        const { data, content } = matter(fileContent);

        // publishedAtを正規化
        const publishedAt = data.publishedAt instanceof Date
          ? data.publishedAt.toISOString().split('T')[0]
          : typeof data.publishedAt === 'string'
          ? data.publishedAt
          : String(data.publishedAt);

        // 必須フィールドの検証
        if (!data.title || typeof data.title !== 'string') {
          throw new Error(`Invalid frontmatter in ${file}: missing or invalid 'title'`);
        }

        if (!publishedAt) {
          throw new Error(`Invalid frontmatter in ${file}: missing 'publishedAt'`);
        }

        // 外部ファイル参照機能: sourceフィールドがある場合、外部ファイルを読み込む
        // エラー時はビルドを失敗させる（ビルド時品質保証）
        let finalContent = content;
        if (data.source && typeof data.source === 'string') {
          const externalFilePath = path.join(rootDir, data.source);
          try {
            const externalContent = await fs.readFile(externalFilePath, 'utf-8');
            finalContent = externalContent;
            console.log(`   ✅ Loaded external file: ${data.source}`);
          } catch (error) {
            throw new Error(`Failed to load external file "${data.source}" for post "${slug}": ${error.message}`);
          }
        }

        // ビルド時にHTML変換と見出し抽出（並列処理）
        const startTime = Date.now();
        console.log(`   🔄 Converting: ${slug}`);

        const headings = extractHeadings(finalContent);
        const { html: htmlContent, hasMermaid } = await convertMarkdownToHtml(finalContent);

        // 見出しベースでコンテンツを分割（ビルド時処理）
        const freeContentHeading = data.freeContentHeading || null;
        let visibleContent = htmlContent;
        let hiddenContent = '';

        if (freeContentHeading) {
          // freeContentHeadingに一致する見出しを検索
          const matchedHeading = headings.find(h => h.text === freeContentHeading);
          if (matchedHeading) {
            // 見出しIDで分割
            const splitResult = splitContentByHeading(htmlContent, matchedHeading.id);
            visibleContent = splitResult.visibleContent;
            hiddenContent = splitResult.hiddenContent;
          }
        }

        const duration = Date.now() - startTime;
        console.log(`   ✅ Completed: ${slug} (${duration}ms)${hasMermaid ? ' [Mermaid]' : ''}${freeContentHeading ? ' [Paywall]' : ''}`);

        return {
          slug,
          frontmatter: {
            title: data.title,
            publishedAt,
            summary: data.summary || '',
            author: data.author || 'Unknown',
            tags: Array.isArray(data.tags) ? data.tags : [],
            category: data.category || '',
            source: data.source || null,
            description: data.description || undefined,
            testOnly: data.testOnly === true,
            hasMermaid, // Mermaid検出フラグを追加
            freeContentHeading: data.freeContentHeading || null,
          },
          content: htmlContent,
          visibleContent,
          hiddenContent,
          headings,
        };
      })
    );

    console.log(`✅ Parsed ${posts.length} posts`);

    // 本番環境ではテスト専用記事を除外（E2Eテスト時は除外しない）
    const isProduction = process.env.NODE_ENV === 'production';
    const isE2ETest = process.env.E2E_TEST === 'true';
    const filteredPosts = (isProduction && !isE2ETest)
      ? posts.filter(post => !post.frontmatter.testOnly)
      : posts;

    if (isProduction && filteredPosts.length < posts.length) {
      console.log(`🔒 Excluded ${posts.length - filteredPosts.length} test-only posts in production`);
    }

    console.log(`✅ Final post count: ${filteredPosts.length}`);

    // 3. カテゴリ定義を読み込む
    const specPath = path.join(rootDir, 'app/specs/blog/posts-spec.yaml');
    const specContent = await fs.readFile(specPath, 'utf-8');
    const spec = yaml.load(specContent);

    if (!spec.categories || !Array.isArray(spec.categories)) {
      throw new Error('Invalid spec.yaml: missing or invalid categories');
    }

    const categories = spec.categories.map((cat, index) => {
      if (typeof cat.id !== 'number' || typeof cat.name !== 'string' || typeof cat.emoji !== 'string') {
        throw new Error(`Invalid category at index ${index}: must have id (number), name (string), and emoji (string)`);
      }
      return {
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji,
      };
    });

    console.log(`✅ Loaded ${categories.length} categories`);

    // 4. TypeScriptモジュールを生成
    const output = `// Auto-generated by scripts/prebuild/generate-blog-posts.js
// Do not edit manually - this file is regenerated on every build

/**
 * ブログ記事データ（ビルド時生成）
 *
 * このファイルは、ビルド時にMarkdownファイルから自動生成されます。
 * Cloudflare Workersではファイルシステムアクセスができないため、
 * ビルド時にすべてのコンテンツをバンドルしています。
 */

export interface BlogPostFrontmatter {
  title: string;
  publishedAt: string; // ISO format "YYYY-MM-DD"
  summary: string;
  author: string;
  tags: string[];
  category: string;
  source: string | null; // 外部マークダウンファイルへの参照
  description?: string; // オプション: 記事の説明
  testOnly: boolean; // テスト専用記事フラグ（本番環境では除外）
  hasMermaid: boolean; // Mermaidダイアグラムの有無（条件付き読み込み用）
  freeContentHeading: string | null; // 見出しベースペイウォールの区切り見出し
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string; // HTML形式（ビルド時にマークダウンから変換済み）全文
  visibleContent: string; // 見出しベース分割後の可視コンテンツ（ビルド時生成）
  hiddenContent: string; // 見出しベース分割後の非表示コンテンツ（ビルド時生成）
  headings: Heading[]; // 目次用見出し（ビルド時に抽出済み）
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
}

// ==========================================
// カテゴリデータ
// ==========================================

export const categories: Category[] = ${JSON.stringify(categories, null, 2)};

// ==========================================
// ブログ記事データ
// ==========================================

export const posts: BlogPost[] = ${JSON.stringify(filteredPosts, null, 2)};

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * slugから記事を取得する
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find(post => post.slug === slug);
}

/**
 * すべての記事を取得する（投稿日降順）
 */
export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) =>
    new Date(b.frontmatter.publishedAt).getTime() -
    new Date(a.frontmatter.publishedAt).getTime()
  );
}

/**
 * カテゴリ名から絵文字を取得する
 */
export function getCategoryEmoji(categoryName: string): string {
  const category = categories.find(cat => cat.name === categoryName);
  return category?.emoji || '📄';
}

/**
 * カテゴリIDからカテゴリを取得する
 */
export function getCategoryById(id: number): Category | undefined {
  return categories.find(cat => cat.id === id);
}

/**
 * カテゴリ名からカテゴリを取得する
 */
export function getCategoryByName(name: string): Category | undefined {
  return categories.find(cat => cat.name === name);
}
`;

    // 5. 出力ディレクトリを作成
    const outputDir = path.join(rootDir, 'app/generated');
    await fs.mkdir(outputDir, { recursive: true });

    // 6. ファイルを書き込む
    const outputPath = path.join(outputDir, 'blog-posts.ts');
    await fs.writeFile(outputPath, output, 'utf-8');

    console.log(`✅ Generated ${outputPath}`);
    console.log(`📦 Bundle contains ${filteredPosts.length} posts and ${categories.length} categories`);
    console.log('✨ Blog posts generation completed successfully!');

    return { posts: filteredPosts.length, categories: categories.length };
  } catch (error) {
    console.error('❌ Error generating blog posts:', error);
    throw error;
  }
}

// スクリプトを実行
generateBlogPosts()
  .then(({ posts, categories }) => {
    console.log(`\n📊 Summary:`);
    console.log(`   - Posts: ${posts}`);
    console.log(`   - Categories: ${categories}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
