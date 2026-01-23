import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Metadata ルール
 */
export function getMetadataRules() {
  return {
    'category-validation': {
      name: 'category-validation',
      description: 'category の選択肢検証',
      severity: 'error',

      check: function(content, filePath, config) {
        const results = [];
        const { data } = matter(content);

        if (!data.category) {
          return results; // required-fieldsで検出されるのでスキップ
        }

        // spec.yaml からカテゴリ取得
        const specPath = path.join(process.cwd(), config.specPath || 'app/specs/blog/posts-spec.yaml');
        const spec = yaml.load(fs.readFileSync(specPath, 'utf8'));
        const allowedCategories = spec.categories.map(cat => cat.name);

        if (!allowedCategories.includes(data.category)) {
          results.push({
            message: `無効なカテゴリ: "${data.category}"`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `許可されたカテゴリ: ${allowedCategories.join(', ')}`
          });
        }

        return results;
      }
    },

    'tags-validation': {
      name: 'tags-validation',
      description: 'tags の選択肢検証',
      severity: 'error',

      check: function(content, filePath, config) {
        const results = [];
        const { data } = matter(content);

        if (!data.tags) {
          return results; // required-fieldsで検出されるのでスキップ
        }

        // 配列チェック
        if (!Array.isArray(data.tags)) {
          results.push({
            message: `tags は配列である必要があります: ${typeof data.tags}`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `例: tags: ["React", "TypeScript"]`
          });
          return results;
        }

        // 空配列は許可
        if (data.tags.length === 0 && config.allowEmpty) {
          return results;
        }

        // spec.yaml から許可タグ取得
        const specPath = path.join(process.cwd(), config.specPath || 'app/specs/blog/posts-spec.yaml');
        const spec = yaml.load(fs.readFileSync(specPath, 'utf8'));

        // タグ一覧を取得
        const allowedTags = (spec.tags || []).map(tag => tag.name);

        // 各タグの検証
        const invalidTags = [];
        data.tags.forEach(tag => {
          if (!allowedTags.includes(tag)) {
            invalidTags.push(tag);
          }
        });

        if (invalidTags.length > 0) {
          results.push({
            message: `無効なタグ: ${invalidTags.map(t => `"${t}"`).join(', ')}`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `許可されたタグは app/specs/blog/posts-spec.yaml の tags を参照してください`
          });
        }

        return results;
      }
    },

    'slug-validation': {
      name: 'slug-validation',
      description: 'slug の形式検証',
      severity: 'error',

      check: function(content, filePath, config) {
        const results = [];
        const { data } = matter(content);

        if (!data.slug) {
          return results; // required-fieldsで検出されるのでスキップ
        }

        const pattern = new RegExp(config.pattern || '^[a-z0-9-]+$');
        const maxLength = config.maxLength || 100;

        if (!pattern.test(data.slug)) {
          results.push({
            message: `slug は小文字英数字とハイフンのみ使用可能です: "${data.slug}"`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `例: my-blog-post`
          });
        }

        if (data.slug.length > maxLength) {
          results.push({
            message: `slug が長すぎます（最大${maxLength}文字）: 現在${data.slug.length}文字`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name
          });
        }

        return results;
      }
    },

    'description-length': {
      name: 'description-length',
      description: 'description の長さ検証',
      severity: 'warning',

      check: function(content, filePath, config) {
        const results = [];
        const { data } = matter(content);

        if (!data.description) {
          return results; // required-fieldsで検出されるのでスキップ
        }

        const minLength = config.minLength || 20;
        const maxLength = config.maxLength || 160;
        const length = data.description.length;

        if (length < minLength) {
          results.push({
            message: `description が短すぎます（最低${minLength}文字）: 現在${length}文字`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `SEO最適化のため、最低${minLength}文字以上の説明文を記述してください`
          });
        }

        if (length > maxLength) {
          results.push({
            message: `description が長すぎます（最大${maxLength}文字）: 現在${length}文字`,
            line: 1,
            severity: config.severity || this.severity,
            file: filePath,
            rule: this.name,
            suggestion: `SEO最適化のため、${maxLength}文字以内に収めてください`
          });
        }

        return results;
      }
    }
  };
}
