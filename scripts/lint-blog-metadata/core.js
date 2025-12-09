import fs from 'fs';
import path from 'path';

/**
 * ルールエンジン - Blog Metadata Lint システムの核
 */
class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.config = null;
    this.results = [];
  }

  /**
   * 設定ファイルを読み込む
   */
  loadConfig(configPath) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configContent);
      return this.config;
    } catch (error) {
      throw new Error(`設定ファイルの読み込みに失敗しました: ${configPath} - ${error.message}`);
    }
  }

  /**
   * ルールを登録する
   */
  registerRule(rule) {
    if (!rule.name || typeof rule.check !== 'function') {
      throw new Error('ルールには name と check メソッドが必要です');
    }

    this.rules.set(rule.name, {
      ...rule,
      enabled: true,
      severity: rule.severity || 'error'
    });
  }

  /**
   * 単一ファイルをチェック
   */
  async checkFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const fileResults = [];

    // 全ルールを適用
    for (const [ruleName, rule] of this.rules.entries()) {
      const ruleConfig = this.config?.rules?.[ruleName];

      // ルールが無効化されている場合はスキップ
      if (ruleConfig && ruleConfig.enabled === false) {
        continue;
      }

      try {
        const ruleResults = await rule.check(content, filePath, ruleConfig || {});

        if (Array.isArray(ruleResults)) {
          fileResults.push(...ruleResults);
        }
      } catch (error) {
        console.error(`❌ ルール「${rule.name}」の実行に失敗: ${filePath} - ${error.message}`);
        fileResults.push({
          rule: rule.name,
          severity: 'error',
          message: `ルール実行エラー: ${error.message}`,
          file: filePath,
          line: 0,
          column: 0
        });
      }
    }

    return fileResults;
  }

  /**
   * 複数ファイルを並列でチェック
   */
  async checkFiles(files) {
    const promises = files.map(async (filePath) => {
      return await this.checkFile(filePath);
    });

    const allResults = await Promise.all(promises);
    this.results = allResults.flat();
    return this.results;
  }

  /**
   * 結果の集計
   */
  getSummary() {
    const summary = {
      total: this.results.length,
      errors: 0,
      warnings: 0,
      info: 0,
      files: new Set(),
      rules: new Set()
    };

    this.results.forEach(result => {
      if (result.severity === 'error') summary.errors++;
      if (result.severity === 'warning') summary.warnings++;
      if (result.severity === 'info') summary.info++;
      summary.files.add(result.file);
      summary.rules.add(result.rule);
    });

    return {
      ...summary,
      files: summary.files.size,
      rules: summary.rules.size
    };
  }

  /**
   * 終了コードを決定
   */
  getExitCode() {
    const hasErrors = this.results.some(result => result.severity === 'error');
    return hasErrors ? 1 : 0;
  }
}

export default RuleEngine;
