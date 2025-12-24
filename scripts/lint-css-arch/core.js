import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * CSSアーキテクチャLintルールエンジン
 * lint-template/core.jsをベースにCSSアーキテクチャ用に拡張
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
      throw new Error('ルールには name と check 関数が必要です');
    }

    this.rules.set(rule.name, {
      ...rule,
      severity: 'error' // 固定
    });
  }

  /**
   * 適用可能なルールを取得する
   * @param {string} layer - 'layer1', 'layer2', etc.
   * @param {string} filePath - ファイルパス
   */
  getApplicableRules(layer, filePath) {
    const applicableRules = [];
    const fileExt = path.extname(filePath);

    // レイヤー設定を確認
    if (this.config?.[layer]) {
      const layerConfig = this.config[layer];

      // 登録されたルールから適用可能なものを探す
      for (const [ruleName, rule] of this.rules.entries()) {
        // レイヤー名で始まるルールを適用対象とする
        if (ruleName.startsWith(`${layer}-`)) {
          applicableRules.push({
            ...rule,
            config: layerConfig
          });
        }
      }
    }

    return applicableRules;
  }

  /**
   * ファイルの存在を確認する
   */
  checkFileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * ファイルを検査する
   * @param {string} filePath - ファイルパス
   * @param {string} layer - 'layer1', 'layer2', etc.
   */
  async checkFile(filePath, layer) {
    // ファイルが存在しない場合は警告を出して終了（レイヤー欠如の許容）
    if (!this.checkFileExists(filePath)) {
      console.warn(`⚠️  対象ファイルなし: ${filePath} (${layer})`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const applicableRules = this.getApplicableRules(layer, filePath);
    const fileResults = [];

    for (const rule of applicableRules) {
      try {
        const ruleResults = await rule.check(content, filePath, rule.config);

        if (Array.isArray(ruleResults)) {
          fileResults.push(...ruleResults.map(result => ({
            ...result,
            rule: rule.name,
            severity: rule.severity,
            file: filePath,
            layer
          })));
        } else if (ruleResults) {
          fileResults.push({
            ...ruleResults,
            rule: rule.name,
            severity: rule.severity,
            file: filePath,
            layer
          });
        }
      } catch (error) {
        console.error(`❌ ルール実行エラー: ${rule.name} - ${filePath} - ${error.message}`);
        fileResults.push({
          rule: rule.name,
          severity: 'error',
          message: `ルール実行中にエラーが発生しました: ${error.message}`,
          file: filePath,
          layer,
          line: 0,
          column: 0
        });
      }
    }

    return fileResults;
  }

  /**
   * 指定されたパス群を検査する
   * @param {object} paths - レイヤーごとのファイルパス
   */
  async checkPaths(paths) {
    const allResults = [];

    // Layer 1の検査 - 単一ファイル
    if (paths.layer1) {
      const results = await this.checkFile(paths.layer1, 'layer1');
      allResults.push(...results);
    }

    // Layer 2の検査 - globパターンを使用
    if (paths.layer2) {
      const layer2Files = await glob(paths.layer2, {
        nodir: true,
        ignore: this.config.ignore?.files || []
      });
      for (const file of layer2Files) {
        const results = await this.checkFile(file, 'layer2');
        allResults.push(...results);
      }
    }

    // Layer 3-4の検査 - 単一ファイル
    for (const layer of ['layer3', 'layer4']) {
      if (paths[layer]) {
        const results = await this.checkFile(paths[layer], layer);
        allResults.push(...results);
      }
    }

    // Layer 5の検査 - globパターンを使用
    if (paths.layer5) {
      const layer5Files = await glob(paths.layer5, {
        nodir: true,
        ignore: this.config.ignore?.files || []
      });
      for (const file of layer5Files) {
        const results = await this.checkFile(file, 'layer5');
        allResults.push(...results);
      }
    }

    this.results = allResults;
    return this.results;
  }

  /**
   * サマリーを取得する
   */
  getSummary() {
    const summary = {
      total: this.results.length,
      errors: 0,
      warnings: 0,
      info: 0,
      files: new Set(),
      layers: new Set(),
      rules: new Set()
    };

    this.results.forEach(result => {
      summary[result.severity + 's']++;
      summary.files.add(result.file);
      summary.layers.add(result.layer);
      summary.rules.add(result.rule);
    });

    return {
      ...summary,
      files: summary.files.size,
      layers: summary.layers.size,
      rules: summary.rules.size
    };
  }

  /**
   * 結果をレイヤーごとにグループ化する
   */
  getResultsByLayer() {
    const grouped = {
      layer1: [],
      layer2: [],
      layer3: [],
      layer4: [],
      layer5: []
    };

    this.results.forEach(result => {
      if (grouped[result.layer]) {
        grouped[result.layer].push(result);
      }
    });

    return grouped;
  }

  /**
   * コンソール出力をフォーマットする
   */
  formatConsole() {
    if (this.results.length === 0) {
      return '✅ 違反は検出されませんでした。';
    }

    const output = [];
    const groupedByFile = {};

    // ファイルごとにグループ化
    this.results.forEach(result => {
      if (!groupedByFile[result.file]) {
        groupedByFile[result.file] = [];
      }
      groupedByFile[result.file].push(result);
    });

    // ファイルごとに出力
    for (const [file, results] of Object.entries(groupedByFile)) {
      const layer = results[0]?.layer || 'unknown';
      output.push(`\n📄 ${file} (${layer})`);

      results.forEach(result => {
        const symbol = this.config?.severity?.[result.severity]?.symbol || '❗';
        const line = result.line ? `:${result.line}` : '';

        output.push(`  ${symbol} ${result.message} [${result.rule}]${line}`);
        if (result.suggestion) {
          output.push(`    💡 ${result.suggestion}`);
        }
      });
    }

    // サマリー
    const summary = this.getSummary();
    output.push('\n📊 Summary:');
    output.push(`  Layers: ${summary.layers}`);
    output.push(`  Files: ${summary.files}`);
    output.push(`  Errors: ${summary.errors}`);
    output.push(`  Warnings: ${summary.warnings}`);

    return output.join('\n');
  }

  /**
   * Layer Report (Markdown) をフォーマットする
   * @returns {string} Markdown形式のレポート
   */
  formatLayerReport() {
    const report = ['# CSS Layer Lint Report (Layers 1-4)'];
    const resultsByLayer = this.getResultsByLayer();

    for (const layer of ['layer1', 'layer2', 'layer3', 'layer4']) {
      const results = resultsByLayer[layer];
      if (results.length > 0) {
        const filePath = results[0].file;
        report.push(`\n## ${layer.charAt(0).toUpperCase() + layer.slice(1)}: \`${filePath}\``);

        results.forEach((result, index) => {
          report.push(`\n### 違反 ${index + 1}`);
          report.push(`- **行**: ${result.line}`);
          report.push(`- **ルール**: \`${result.rule}\``);
          report.push(`- **メッセージ**: ${result.message}`);
          if (result.suggestion) {
            report.push(`- **提案**: ${result.suggestion}`);
          }
        });
      }
    }

    if (report.length === 1) {
      report.push('\n✅ 違反は検出されませんでした。');
    }

    return report.join('\n');
  }

  /**
   * 単一ファイル用のレポート (Markdown) をフォーマットする
   * @param {string} filePath - レポート対象のファイルパス
   * @param {Array} results - そのファイルの違反結果
   * @returns {string} Markdown形式のレポート
   */
  formatSingleFileReport(filePath, results) {
    const report = [`# Lint Report: \`${filePath}\``];

    if (results.length > 0) {
      report.push('');
      results.forEach((result, index) => {
        report.push(`## 違反 ${index + 1}`);
        report.push(`- **行**: ${result.line}`);
        report.push(`- **メッセージ**: ${result.message}`);
        report.push('');
      });
    } else {
      report.push('');
      report.push('違反は検出されませんでした。');
    }

    report.push(
      '---'
    );

    const reviewSections = [
      {
        title: '### layer3/4',
        items: [
          'クラス名：',
          '**🤖 AI自己レビュー**',
          '- [ ] このクラスは、フロー制御（`flex`, `grid`, `gap`など）に関するスタイルのみを定義していますか？',
          '- [ ] このクラスの値は、すべて`var()`を用いて**Layer 2の**デザイントークンを参照していますか？（`--foundation-*`の直接参照は禁止です）',
        ]
      },
      {
        title: '### layer2',
        items: [
          'クラス名：',
          '**🤖 AI自己レビュー**',
          '- [ ] このクラスは、スキン（見た目）に関するスタイルのみを定義していますか？',
          '- [ ] このクラスの値は、すべて`var(--foundation-...)`を用いてLayer 1のトークンを参照していますか？',
        ]
      },
      {
        title: '### layer1',
        items: [
          'トークン名：',
          '**🤖 AI自己レビュー**',
          '- [ ] このトークンは、他の変数を参照せず、純粋な原子値（例: `#fff`, `16px`）を定義していますか？',
        ]
      }
    ];

    report.push(
      '',
      '## 修正指示',
      '下層layerを調査し、既存実装を流用して修正してください。',
      '新規作成が必要な場合は、承認を申請してください。',
      ...reviewSections.flatMap(section => ['', section.title, ...section.items]),
      '',
      '---',
      '',
      '## 承認申請（新規作成時のみ）',
      '- インスタンス名：',
      '- layer：',
      '- 流用できない理由：'
    );

    return report.join('\n');
  }
}

export default RuleEngine;
