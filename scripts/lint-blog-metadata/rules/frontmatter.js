import matter from 'gray-matter';

/**
 * Frontmatter ルール
 */
export function getFrontmatterRules() {
  return {
    'required-fields': {
      name: 'required-fields',
      description: '必須フィールドの存在チェック',
      severity: 'error',

      check: function(content, filePath, config) {
        const results = [];
        const { data } = matter(content);

        const requiredFields = config.fields || [];

        for (const field of requiredFields) {
          if (data[field] === undefined || data[field] === null || data[field] === '') {
            results.push({
              message: `必須フィールド「${field}」が見つかりません`,
              line: 1,
              severity: config.severity || this.severity,
              file: filePath,
              rule: this.name,
              suggestion: `frontmatterに ${field} フィールドを追加してください`
            });
          }
        }

        return results;
      }
    },

    'date-validation': {
      name: 'date-validation',
      description: 'publishedAt の日付検証（2025-11-01以降）',
      severity: 'error',

      check: function(content, filePath, config) {
        const results = [];
        const { data } = matter(content);

        if (!data.publishedAt) {
          return results; // required-fieldsで検出されるのでスキップ
        }

        // YYYY-MM-DD フォーマット検証
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.publishedAt)) {
          results.push({
            message: `publishedAt は YYYY-MM-DD 形式である必要があります: ${data.publishedAt}`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `例: 2025-12-09`
          });
          return results;
        }

        // 日付の範囲検証（2025-11-01以降）
        const publishedDate = new Date(data.publishedAt);
        const minDate = new Date('2025-11-01');
        const now = new Date();
        const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()); // 1年後まで

        if (publishedDate < minDate) {
          results.push({
            message: `publishedAt は 2025-11-01 以降である必要があります: ${data.publishedAt}`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `許可範囲: 2025-11-01 以降`
          });
        }

        if (publishedDate > maxDate) {
          results.push({
            message: `publishedAt が未来すぎます（現在から1年以内）: ${data.publishedAt}`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `許可範囲: 2025-11-01 〜 ${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`
          });
        }

        return results;
      }
    }
  };
}
