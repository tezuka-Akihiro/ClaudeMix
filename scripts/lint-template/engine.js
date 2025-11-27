#!/usr/bin/env node

/**
 * Content Linter - プラグイン型ルールエンジン
 * 拡張可能なコンテンツ品質チェックシステム
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

// コアエンジンとルールをロード
import RuleEngine from './core.js';
import { getCommonRules } from './rules/common.js';
import { getTemplateRules } from './rules/template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentLinter {
  constructor(options = {}) {
    this.engine = new RuleEngine(options);
    this.config = null;
    this.templateConfig = null;
    this.options = options;
  }

  /**
   * 初期化処理
   */
  async initialize() {
    try {
      console.log('🚀 Content Linter を初期化中...');

      // lint設定を読み込み
      const configPath = path.join(__dirname, 'config.json');
      this.config = this.engine.loadConfig(configPath);

      // テンプレート設定を読み込み（generate設定から）
      try {
        const templateConfigPath = path.join(__dirname, '../generate/config.json');
        if (fs.existsSync(templateConfigPath)) {
          const templateContent = fs.readFileSync(templateConfigPath, 'utf8');
          this.templateConfig = JSON.parse(templateContent);
          console.log('📋 テンプレート設定を読み込みました');
        }
      } catch (error) {
        console.warn('⚠️ テンプレート設定の読み込みに失敗:', error.message);
      }

      // 共通ルールを登録
      const commonRuleSet = getCommonRules();
      Object.values(commonRuleSet).forEach(rule => {
        this.engine.registerRule(rule);
      });
      console.log(`📦 共通ルール ${Object.keys(commonRuleSet).length} 個を登録`);

      // テンプレート固有ルールを登録
      const templateRuleSet = getTemplateRules();
      Object.values(templateRuleSet).forEach(rule => {
        this.engine.registerRule(rule);
      });
      console.log(`🎯 テンプレートルール ${Object.keys(templateRuleSet).length} 個を登録`);

      console.log('✅ 初期化完了\n');
    } catch (error) {
      console.error('❌ 初期化エラー:', error.message);
      process.exit(1);
    }
  }


  /**
   * ファイルリストを構築
   */
  async buildFileList(targets) {
    const fileList = [];

    for (const target of targets) {
      if (fs.statSync(target).isFile()) {
        // 単一ファイル
        fileList.push({
          filePath: path.resolve(target),
          templateType: this.detectTemplateType(target)
        });
      } else if (fs.statSync(target).isDirectory()) {
        // ディレクトリ内のファイルを検索
        const pattern = path.join(target, '**/*').replace(/\\/g, '/');
        const files = await glob(pattern, {
          ignore: this.config.ignore?.files || [],
          nodir: true
        });

        files.forEach(file => {
          fileList.push({
            filePath: path.resolve(file),
            templateType: this.detectTemplateType(file)
          });
        });
      }
    }

    let filteredList = fileList.filter(file => this.shouldLintFile(file.filePath));

    // Filter by template type if specified
    if (this.options.template) {
      filteredList = filteredList.filter(file => file.templateType === this.options.template);
    }

    return filteredList;
  }

  /**
   * ファイルをlintすべきかチェック
   */
  shouldLintFile(filePath) {
    const ignorePatterns = this.config.ignore?.files || [];

    return !ignorePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    });
  }

  /**
   * テンプレートタイプを検出
   */
  detectTemplateType(filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    const fileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

    // ファイル名ベースの判定
    if (fileName.includes('workflow') || fileName.includes('tdd_work_flow')) {
      return '作業手順書';
    }

    if (fileName.includes('req') || fileName.includes('requirements')) {
      return '機能設計書';
    }

    if (fileName.includes('ui') || fileName.includes('screen')) {
      return '画面仕様書';
    }

    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      return '外部変数仕様書';
    }

    if (fileName.includes('test') && (fileName.endsWith('.tsx') || fileName.endsWith('.jsx'))) {
      return 'コンポーネントテスト';
    }

    if (fileName.includes('test') && (fileName.endsWith('.ts') || fileName.endsWith('.js'))) {
      return 'ユニットテスト';
    }

    if (fileContent.includes('## 機能要件') || fileContent.includes('## 非機能要件')) {
      return '機能設計書';
    }

    return null; // テンプレートタイプ不明
  }

  /**
   * ファイルをlint実行
   */
  async lintFiles(targets) {
    console.log('📄 ファイルリストを構築中...');
    const fileList = await this.buildFileList(targets);

    if (fileList.length === 0) {
      console.log('⚠️ 検査対象ファイルが見つかりませんでした');
      return 0;
    }

    console.log(`📊 ${fileList.length} ファイルを検査します\n`);

    // 並列でファイルをチェック
    const results = await this.engine.checkFiles(fileList);

    // 結果を表示
    this.displayResults(results);

    return this.engine.getExitCode();
  }

  /**
   * 結果を表示
   */
  displayResults(results) { // eslint-disable-line no-unused-vars
    // コンソール出力
    const consoleOutput = this.engine.formatResults('console');
    console.log(consoleOutput);

    // サマリー表示
    if (this.config.output?.summary !== false) {
      const summary = this.engine.getSummary();
      console.log('\n' + '='.repeat(50));
      console.log('📈 実行サマリー');
      console.log('='.repeat(50));
      console.log(`検査ファイル数: ${summary.files}`);
      console.log(`検出問題数: ${summary.total}`);
      console.log(`  エラー: ${summary.errors}`);
      console.log(`  警告: ${summary.warnings}`);
      console.log(`  情報: ${summary.info}`);
    }

    // ファイル出力
    const outputDir = path.join(process.cwd(), 'tests', 'lint');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`\n📁 出力ディレクトリを作成しました: ${outputDir}`);
    }

    const markdownOutput = this.engine.formatResults('markdown');
    const outputPath = path.join(outputDir, 'lint-results-interactive.md');
    fs.writeFileSync(outputPath, markdownOutput);
    console.log(`\n💾 Lint結果を ${outputPath} に保存しました`);
  }
}

// メインエントリーポイント
async function main() {
  const args = process.argv.slice(2);
  const targets = [];
  const options = {};

  // コマンドライン引数を解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      // 次の引数が値であると仮定
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options[key] = args[i + 1];
        i++; // 値の分だけインデックスを進める
      } else {
        options[key] = true; // 値がない場合はブール値として扱う
      }
    } else {
      targets.push(arg);
    }
  }

  if (targets.length === 0) {
    console.error('使用方法: node scripts/lint-template/engine.js <ファイルまたはディレクトリ>');
    process.exit(1);
  }

  const linter = new ContentLinter(options);
  await linter.initialize();
  const exitCode = await linter.lintFiles(targets);
  process.exit(exitCode);
}

main().catch(error => {
  console.error('❌ 実行エラー:', error);
  process.exit(1);
});