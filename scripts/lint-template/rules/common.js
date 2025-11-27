/**
 * 共通ルール統合ファイル
 */

import fs from 'fs';
import path from 'path';

/**
 * 禁止ワードチェックルール
 */
const bannedWordsRule = {
  name: 'banned-words',
  description: '禁止ワードをチェックし、品質の低いコードを検出',
  severity: 'error',

  /**
   * 禁止ワードをチェック
   */
  check: function(content, filePath, config) {
    const results = [];
    const lines = content.split('\n');

    // 全ての禁止ワードを統合（基本+外部サービス名+プロジェクト固有名）
    const allBannedWords = [
      ...(config.words || []),
      ...(config.externalServiceNames || []),
      ...(config.projectSpecificNames || [])
    ].filter(word => word && !word.startsWith('TBD:')); // TBD項目は除外

    if (allBannedWords.length === 0) {
      return results;
    }

    // パフォーマンス向上のため、すべての禁止ワードを1つの正規表現にまとめる
    const combinedRegex = new RegExp(`\\b(${allBannedWords.map(this.escapeRegExp).join('|')})\\b`, 'gi');

    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = combinedRegex.exec(line)) !== null) {
        const word = match[1]; // マッチした単語を取得

        // 除外条件をチェック
        if (this.shouldIgnore(line, match, word, config.exceptions)) {
          continue;
        }

        results.push({
          message: `禁止ワード「${word}」が使用されています`,
          line: lineIndex + 1,
          column: match.index + 1,
          severity: config.severity || this.severity,
          context: line.trim(),
          suggestion: this.getSuggestion(word),
          category: this.getWordCategory(word, config)
        });
      }
    });

    return results;
  },

  /**
   * 禁止ワードのカテゴリを判定
   */
  getWordCategory: function(word, config) {
    if ((config.words || []).includes(word)) return 'プロジェクト範囲外';
    if ((config.externalServiceNames || []).includes(word)) return '外部サービス名';
    if ((config.projectSpecificNames || []).includes(word)) return 'プロジェクト固有名';
    return '禁止ワード';
  },

  /**
   * 正規表現用にエスケープ
   */
  escapeRegExp: function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * 除外条件をチェック
   */
  shouldIgnore: function(line, match, word, exceptions = {}) {
    const contexts = exceptions.contexts || [];

    // コメント内の除外
    if (contexts.includes('comments')) {
      if (line.trim().startsWith('//') ||
          line.trim().startsWith('/*') ||
          line.trim().startsWith('*') ||
          line.trim().startsWith('#')) {
        return true;
      }
    }

    // import文の除外
    if (contexts.includes('imports')) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('import ') ||
          trimmedLine.startsWith('from ') ||
          (trimmedLine.includes('import ') && trimmedLine.includes('from '))) {
        return true;
      }
      // vi.mock, jest.mock などのモック関数の第一引数内を除外
      if (/(?:vi|jest|require)\.mock\s*\(/.test(line)) {
        return true;
      }
      // React型定義（React.FC, React.ReactNode等）も除外
      if (/:\s*React\./i.test(line) || /React\.[A-Z]/i.test(line)) {
        return true;
      }
    }

    // 文字列内の除外
    if (contexts.includes('strings')) {
      const beforeChar = match.index > 0 ? line[match.index - 1] : '';
      const afterChar = match.index + word.length < line.length ? line[match.index + word.length] : '';

      if ((beforeChar === '"' || beforeChar === "'") &&
          (afterChar === '"' || afterChar === "'")) {
        return true;
      }
    }

    // URL内の除外
    if (line.includes('http') || line.includes('www.')) {
      return true;
    }

    return false;
  },

  /**
   * 修正案を提供
   */
  getSuggestion: function(word) {
    const suggestions = {
      'TODO': 'GitHubのIssueまたはプロジェクト管理ツールを使用してください',
      'FIXME': 'GitHubのIssueとして登録し、適切な修正を行ってください',
      'HACK': 'よりクリーンな実装方法を検討してください',
      'XXX': '適切なコメントまたは文書に置き換えてください',
      'console.log': 'console.logを削除するか、proper loggingライブラリを使用してください',
      'debugger': 'debugger文を削除してください',
      'alert(': 'alertの代わりにtoas通知やモーダルを使用してください',
      'var ': 'varの代わりにconst または let を使用してください',
      '== ': '厳密等価演算子 === を使用してください',
      '!= ': '厳密不等価演算子 !== を使用してください'
    };

    return suggestions[word] || `「${word}」の使用を避けてください`;
  }
};

/**
 * デザイントークン使用チェックルール
 */
const designTokensRule = {
  name: 'design-tokens',
  description: 'ハードコードされたデザイン値を検出し、デザイントークンの使用を強制',
  severity: 'error',

  /**
   * デザイントークンの使用をチェック
   */
  check: function(content, filePath, config) {
    const results = [];
    const lines = content.split('\n');
    const fileExt = path.extname(filePath);

    // ファイルタイプ制限をチェック
    if (config.fileTypes && !config.fileTypes.includes(fileExt)) {
      return results;
    }

    lines.forEach((line, lineIndex) => {
      // 禁止パターンをチェック
      const violations = this.checkProhibitedPatterns(line, config.patterns?.prohibited || []);

      violations.forEach(violation => {
        // 許可パターンかチェック
        if (this.isAllowedPattern(line, config.patterns?.allowed || [])) {
          return;
        }

        results.push({
          message: `ハードコードされたデザイン値が使用されています: ${violation.match}`,
          line: lineIndex + 1,
          column: violation.index + 1,
          severity: config.severity || this.severity,
          context: line.trim(),
          suggestion: this.getSuggestion(violation.match, violation.type, fileExt),
          rule: this.name,
          type: violation.type
        });
      });
    });

    return results;
  },

  /**
   * 禁止パターンをチェック
   */
  checkProhibitedPatterns: function(line, prohibitedPatterns) {
    const violations = [];

    prohibitedPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      let match;

      while ((match = regex.exec(line)) !== null) {
        violations.push({
          match: match[0],
          index: match.index,
          type: this.getViolationType(match[0])
        });
      }
    });

    return violations;
  },

  /**
   * 許可パターンかチェック
   */
  isAllowedPattern: function(line, allowedPatterns) {
    return allowedPatterns.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(line);
    });
  },

  /**
   * 違反タイプを取得
   */
  getViolationType: function(match) {
    if (match.startsWith('#')) return 'color';
    if (match.includes('px')) return 'spacing';
    if (match.includes('rgba') || match.includes('rgb')) return 'color';
    if (match.includes('pt')) return 'font-size';
    if (match.includes('rem') || match.includes('em')) return 'spacing';
    return 'unknown';
  },

  /**
   * 修正案を提供
   */
  getSuggestion: function(match, type, fileExt) {
    const suggestions = {
      color: {
        '.css': `CSS変数を使用: var(--color-primary), var(--color-accent-gold)`,
        '.tsx': `デザイントークンを使用: colors.text.primary, colors.accent.gold`,
        '.jsx': `デザイントークンを使用: colors.text.primary, colors.accent.gold`,
        '.ts': `デザイントークンを使用: colors.text.primary, colors.accent.gold`,
        '.js': `デザイントークンを使用: colors.text.primary, colors.accent.gold`
      },
      spacing: {
        '.css': `CSS変数を使用: var(--spacing-md), var(--spacing-lg)`,
        '.tsx': `デザイントークンを使用: spacing.md, spacing.lg`,
        '.jsx': `デザイントークンを使用: spacing.md, spacing.lg`,
        '.ts': `デザイントークンを使用: spacing.md, spacing.lg`,
        '.js': `デザイントークンを使用: spacing.md, spacing.lg`
      },
      'font-size': {
        '.css': `CSS変数を使用: var(--font-size-base), var(--font-size-lg)`,
        '.tsx': `デザイントークンを使用: typography.size.base, typography.size.lg`,
        '.jsx': `デザイントークンを使用: typography.size.base, typography.size.lg`,
        '.ts': `デザイントークンを使用: typography.size.base, typography.size.lg`,
        '.js': `デザイントークンを使用: typography.size.base, typography.size.lg`
      }
    };

    const suggestion = suggestions[type]?.[fileExt];
    if (suggestion) return suggestion;

    return `デザイントークンを使用してください (${match} → 適切なトークン値)`;
  }
};

/**
 * 行数制限チェックルール
 */
const lineLimitRule = {
  name: 'line-limit',
  description: 'ファイルの行数制限をチェック（デフォルト: 400行）',
  severity: 'warning',

  /**
   * ファイルの行数をチェック
   */
  check: function(content, filePath, config) {
    const results = [];
    const maxLines = config.maxLines || 400;
    const lines = content.split('\n');
    const actualLines = lines.length;

    // 空行のみのファイルは除外
    const nonEmptyLines = lines.filter(line => line.trim() !== '').length;
    if (nonEmptyLines === 0) {
      return results;
    }

    // 行数制限チェック
    if (actualLines > maxLines) {
      const excess = actualLines - maxLines;
      const fileSize = this.getFileSize(filePath);

      results.push({
        message: `ファイルの行数が制限を超えています（${actualLines}行 > ${maxLines}行、超過: ${excess}行）`,
        line: actualLines,
        column: 1,
        severity: config.severity || this.severity,
        context: `ファイルサイズ: ${fileSize}`,
        suggestion: this.getSuggestion(actualLines, maxLines, filePath)
      });
    }

    return results;
  },

  /**
   * ファイルサイズを取得
   */
  getFileSize: function(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const bytes = stats.size;

      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1048576) return `${Math.round(bytes / 1024)}KB`;
      return `${Math.round(bytes / 1048576 * 10) / 10}MB`;
    } catch (error) {
      return '不明';
    }
  },

  /**
   * 修正案を提供
   */
  getSuggestion: function(actualLines, maxLines, filePath) {
    const fileExt = path.extname(filePath);
    const excess = actualLines - maxLines;

    const suggestions = [
      `ファイルを${Math.ceil(actualLines / maxLines)}つの小さなファイルに分割`,
    ];

    // ファイルタイプ別の提案
    switch (fileExt) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
        suggestions.push(
          '大きな関数を小さな関数に分解',
          '関連する機能を別のモジュールに移動',
          'utility関数を別ファイルに抽出'
        );
        break;

      case '.css':
        suggestions.push(
          '機能別にCSSファイルを分割',
          'CSS Modulesまたは styled-components を検討'
        );
        break;

      case '.md':
        suggestions.push(
          'セクションごとに別のMarkdownファイルに分割',
          '目次と参照リンクを使用して複数ファイルに分散'
        );
        break;

      default:
        suggestions.push('論理的なセクションごとにファイルを分割');
    }

    return suggestions.join(', ');
  }
};

const commonRules = {
  'banned-words': bannedWordsRule,
  'line-limit': lineLimitRule,
  'design-tokens': designTokensRule,
};

export function getCommonRules() {
  return commonRules;
}