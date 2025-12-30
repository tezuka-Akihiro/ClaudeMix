import matter from 'gray-matter';

/**
 * Free Content Heading Validation ルール
 * frontmatterの`freeContentHeading`で指定された見出しが実際に記事内に存在するかを検証
 */
export function getFreeContentHeadingRules() {
  return {
    'free-content-heading-exists': {
      name: 'free-content-heading-exists',
      description: 'freeContentHeadingで指定された見出しが記事内に存在するか検証',
      severity: 'error',

      check: function(content, filePath, config) {
        const results = [];
        const { data, content: markdown } = matter(content);

        // freeContentHeadingが指定されていない場合はスキップ
        if (!data.freeContentHeading) {
          return results;
        }

        const freeContentHeading = data.freeContentHeading;

        // 記事から見出しを抽出（レベル2のみ、## で始まる行）
        const headings = this.extractHeadings(markdown);
        const headingTexts = headings.map(h => h.text);

        // 指定された見出しが存在するか確認
        if (!headingTexts.includes(freeContentHeading)) {
          results.push({
            message: `freeContentHeadingで指定された見出し「${freeContentHeading}」が記事内に見つかりません`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `以下のいずれかの見出しを指定してください: ${headingTexts.length > 0 ? headingTexts.join(', ') : '(見出しが存在しません)'}`
          });
        }

        return results;
      },

      /**
       * マークダウンから見出し（レベル2）を抽出
       * コードブロック内の見出しは除外
       */
      extractHeadings: function(markdown) {
        const headings = [];
        const lines = markdown.split('\n');
        let inCodeBlock = false;
        const codeBlockDelimiter = /^```/;
        const headingRegex = /^(#{2})\s+(.+)$/;

        for (const line of lines) {
          const trimmedLine = line.trim();

          // コードブロックの開始/終了を検出
          if (codeBlockDelimiter.test(trimmedLine)) {
            inCodeBlock = !inCodeBlock;
            continue;
          }

          // コードブロック内の行はスキップ
          if (inCodeBlock) continue;

          // 見出し（## のみ）を検出
          const match = headingRegex.exec(trimmedLine);
          if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            headings.push({ level, text });
          }
        }

        return headings;
      }
    },

    'free-content-heading-duplicate': {
      name: 'free-content-heading-duplicate',
      description: '記事内に同じテキストの見出しが重複していないか検証',
      severity: 'warning',

      check: function(content, filePath, config) {
        const results = [];
        const { data, content: markdown } = matter(content);

        // freeContentHeadingが指定されていない場合はスキップ
        if (!data.freeContentHeading) {
          return results;
        }

        const freeContentHeading = data.freeContentHeading;

        // 記事から見出しを抽出
        const headings = this.extractHeadings(markdown);

        // 指定された見出しテキストの出現回数をカウント
        const count = headings.filter(h => h.text === freeContentHeading).length;

        if (count > 1) {
          results.push({
            message: `freeContentHeadingで指定された見出し「${freeContentHeading}」が記事内に${count}回出現しています（重複）`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: '見出しテキストを一意にするか、freeContentHeadingで指定する見出しを変更してください'
          });
        }

        return results;
      },

      extractHeadings: function(markdown) {
        const headings = [];
        const lines = markdown.split('\n');
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
            headings.push({ level, text });
          }
        }

        return headings;
      }
    }
  };
}
