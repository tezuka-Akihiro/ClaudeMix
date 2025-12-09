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
      description: 'publishedAt の日付検証（年月が前後1ヶ月以内）',
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

        // 年月の範囲検証（日は無視）
        const publishedDate = new Date(data.publishedAt);
        const now = new Date();

        // 現在の年月
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11

        // publishedAtの年月
        const publishedYear = publishedDate.getFullYear();
        const publishedMonth = publishedDate.getMonth(); // 0-11

        // 前後1ヶ月の範囲を計算
        const minDate = new Date(currentYear, currentMonth - 1, 1); // 1ヶ月前の1日
        const maxDate = new Date(currentYear, currentMonth + 2, 0); // 1ヶ月後の末日

        const publishedYearMonth = new Date(publishedYear, publishedMonth, 1);

        if (publishedYearMonth < new Date(minDate.getFullYear(), minDate.getMonth(), 1) ||
            publishedYearMonth > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
          const minYearMonth = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}`;
          const maxYearMonth = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`;

          results.push({
            message: `publishedAt の年月は現在から前後1ヶ月以内である必要があります: ${data.publishedAt}`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `許可範囲: ${minYearMonth}-XX 〜 ${maxYearMonth}-XX`
          });
        }

        return results;
      }
    }
  };
}
