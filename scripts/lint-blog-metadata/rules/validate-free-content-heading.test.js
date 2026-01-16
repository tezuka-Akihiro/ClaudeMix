import { getFreeContentHeadingRules } from './validate-free-content-heading.js';

/**
 * テストヘルパー: マークダウンコンテンツを生成
 */
function createMarkdown(frontmatter, body) {
  return `---
${frontmatter}
---

${body}`;
}

/**
 * テストヘルパー: ルールを実行
 */
async function runRule(ruleName, markdown, config = {}) {
  const rules = getFreeContentHeadingRules();
  const rule = rules[ruleName];

  if (!rule) {
    throw new Error(`Rule "${ruleName}" not found`);
  }

  return await rule.check(markdown, 'test-file.md', config);
}

// テストスイート
describe('validate-free-content-heading rules', () => {
  describe('free-content-heading-exists', () => {
    test('正常系: freeContentHeadingが記事内に存在する場合、エラーなし', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "概要"',
        '## はじめに\n\nIntro content\n\n## 概要\n\nOverview content\n\n## 本編\n\nMain content'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(0);
    });

    test('異常系: freeContentHeadingが記事内に存在しない場合、エラー', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "存在しない見出し"',
        '## はじめに\n\nIntro content\n\n## 概要\n\nOverview content'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('error');
      expect(results[0].message).toContain('存在しない見出し');
      expect(results[0].message).toContain('見つかりません');
    });

    test('正常系: freeContentHeadingが未設定の場合、スキップ', async () => {
      const markdown = createMarkdown(
        'title: Test Article',
        '## はじめに\n\nIntro content\n\n## 概要\n\nOverview content'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(0);
    });

    test('異常系: 記事に見出しが存在しない場合、エラー', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "概要"',
        '本文のみで見出しがありません'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('見つかりません');
      expect(results[0].suggestion).toContain('見出しが存在しません');
    });

    test('正常系: コードブロック内の見出しは無視される', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "概要"',
        `## 概要

Overview content

\`\`\`markdown
## これはコードブロック内の見出し
\`\`\`

## 本編

Main content`
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(0);
    });

    test('異常系: 大文字小文字が異なる場合、エラー', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "overview"',
        '## はじめに\n\n## Overview\n\n## 本編'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('overview');
    });

    test('正常系: 日本語見出しで完全一致', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "はじめに"',
        '## はじめに\n\nIntro\n\n## 概要\n\nOverview'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(0);
    });
  });

  describe('free-content-heading-duplicate', () => {
    test('正常系: 見出しが一意の場合、エラーなし', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "概要"',
        '## はじめに\n\n## 概要\n\n## 本編'
      );

      const results = await runRule('free-content-heading-duplicate', markdown);
      expect(results).toHaveLength(0);
    });

    test('異常系: 同じ見出しが複数回出現する場合、警告', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "概要"',
        '## 概要\n\nFirst overview\n\n## 本編\n\n## 概要\n\nSecond overview'
      );

      const results = await runRule('free-content-heading-duplicate', markdown);
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe('warning');
      expect(results[0].message).toContain('2回出現');
      expect(results[0].message).toContain('重複');
    });

    test('正常系: freeContentHeadingが未設定の場合、スキップ', async () => {
      const markdown = createMarkdown(
        'title: Test Article',
        '## 概要\n\n## 概要\n\n## 概要'
      );

      const results = await runRule('free-content-heading-duplicate', markdown);
      expect(results).toHaveLength(0);
    });

    test('異常系: 3回以上出現する場合、警告', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "セクション"',
        '## セクション\n\n## セクション\n\n## セクション'
      );

      const results = await runRule('free-content-heading-duplicate', markdown);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('3回出現');
    });

    test('正常系: 他の見出しが重複していても、freeContentHeadingが一意ならエラーなし', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "はじめに"',
        '## はじめに\n\n## 本編\n\n## 本編\n\n## 本編'
      );

      const results = await runRule('free-content-heading-duplicate', markdown);
      expect(results).toHaveLength(0);
    });
  });

  describe('extractHeadings helper', () => {
    test('レベル2〜4見出しを抽出', () => {
      const rules = getFreeContentHeadingRules();
      const rule = rules['free-content-heading-exists'];

      const markdown = '# レベル1\n\n## レベル2\n\n### レベル3\n\n#### レベル4\n\n##### レベル5';
      const headings = rule.extractHeadings(markdown);

      expect(headings).toHaveLength(3);
      expect(headings[0].text).toBe('レベル2');
      expect(headings[1].text).toBe('レベル3');
      expect(headings[2].text).toBe('レベル4');
    });

    test('h3見出しでfreeContentHeadingが設定可能', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "サブセクション"',
        '## はじめに\n\n### サブセクション\n\n詳細内容\n\n## まとめ'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(0);
    });

    test('h4見出しでfreeContentHeadingが設定可能', async () => {
      const markdown = createMarkdown(
        'title: Test Article\nfreeContentHeading: "詳細項目"',
        '## はじめに\n\n### サブ\n\n#### 詳細項目\n\n内容\n\n## まとめ'
      );

      const results = await runRule('free-content-heading-exists', markdown);
      expect(results).toHaveLength(0);
    });

    test('コードブロック内の見出しを除外', () => {
      const rules = getFreeContentHeadingRules();
      const rule = rules['free-content-heading-exists'];

      const markdown = `## 実際の見出し

\`\`\`markdown
## コードブロック内の見出し
\`\`\`

## 別の実際の見出し`;

      const headings = rule.extractHeadings(markdown);

      expect(headings).toHaveLength(2);
      expect(headings[0].text).toBe('実際の見出し');
      expect(headings[1].text).toBe('別の実際の見出し');
    });

    test('空行や前後の空白を処理', () => {
      const rules = getFreeContentHeadingRules();
      const rule = rules['free-content-heading-exists'];

      const markdown = '##   空白付き見出し   \n\n\n##  別の見出し  ';
      const headings = rule.extractHeadings(markdown);

      expect(headings).toHaveLength(2);
      expect(headings[0].text).toBe('空白付き見出し');
      expect(headings[1].text).toBe('別の見出し');
    });
  });
});

console.log('✅ All validate-free-content-heading tests passed!');
