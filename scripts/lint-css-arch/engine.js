#!/usr/bin/env node

import { fileURLToPath } from 'url';
import fs from 'fs';
import path, { dirname, join } from 'path';
import RuleEngine from './core.js';
import { getLayer1Rules } from './rules/layer1.js';
import { getLayer2Rules } from './rules/layer2.js';
import { getLayer3Rules } from './rules/layer3.js';
import { getLayer4Rules } from './rules/layer4.js';
import { getLayer5Rules } from './rules/layer5.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CLI引数のパース
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    service: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--service' && args[i + 1]) {
      options.service = args[i + 1];
      i++;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

/**
 * ヘルプメッセージの表示
 */
function showHelp() {
  console.log(`
=== CSS Architecture Linter ===

Usage:
  npm run lint:css-arch [options]

Options:
  --service <name>    検査対象のサービスを指定 (デフォルト: config.jsonのdefaultService)
  --help, -h          ヘルプを表示

Examples:
  npm run lint:css-arch
  npm run lint:css-arch -- --service servicename
`);
}

/**
 * サービス名に基づいてファイルパスを生成する
 * @param {string} serviceName - サービス名
 * @returns {object} レイヤーごとのパス
 */
function generatePaths(serviceName) {
  return {
    layer1: 'app/styles/globals.css',
    layer2: `app/styles/${serviceName}/layer2.css`,
    layer3: `app/styles/${serviceName}/layer3.ts`,
    layer4: `app/styles/${serviceName}/layer4.ts`,
    layer5: `app/components/${serviceName}/**/*.{tsx,jsx}`
  };
}

/**
 * レポートファイルを書き出す
 * @param {RuleEngine} engine - RuleEngineのインスタンス
 */
function writeReportFiles(engine) {
  const outputDir = join(process.cwd(), 'tests', 'lint');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`\n📁 出力ディレクトリを作成しました: ${outputDir}`);
  }

  // Layer Report
  const layerReport = engine.formatLayerReport();
  const layerReportPath = join(outputDir, 'css-arch-layer-report.md');
  fs.writeFileSync(layerReportPath, layerReport);
  console.log(`\n💾 Layer Report を ${layerReportPath} に保存しました`);

  // Implementation Report (ファイルごと)
  const resultsByLayer = engine.getResultsByLayer();
  const layer5Results = resultsByLayer.layer5;

  if (layer5Results.length > 0) {
    const groupedByFile = {};
    layer5Results.forEach(result => {
      if (!groupedByFile[result.file]) groupedByFile[result.file] = [];
      groupedByFile[result.file].push(result);
    });

    for (const [file, results] of Object.entries(groupedByFile)) {
      const reportContent = engine.formatSingleFileReport(file, results);
      const fileName = path.basename(file).replace(/\.(tsx|jsx)$/, '.md');
      const reportPath = join(outputDir, `impl-${fileName}`);
      fs.writeFileSync(reportPath, reportContent);
      console.log(`💾 Implementation Report を ${reportPath} に保存しました`);
    }
  }
}

/**
 * メイン処理
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    // RuleEngineの初期化
    const engine = new RuleEngine();

    // 設定ファイルの読み込み
    const configPath = join(__dirname, 'keyword.json');
    const config = engine.loadConfig(configPath);

    // サービス名の決定
    const serviceName = options.service;

    if (!serviceName) {
      console.error('❌ エラー: サービス名が指定されていません');
      console.error('   --service <name> オプションは必須です。');
      process.exit(2);
    }

    console.log(`\n📋 対象サービス: ${serviceName}`);

    // ルールの登録
    const allRules = {
      ...getLayer1Rules(),
      ...getLayer2Rules(),
      ...getLayer3Rules(),
      ...getLayer4Rules(),
      ...getLayer5Rules()
    };

    for (const [ruleName, rule] of Object.entries(allRules)) {
      engine.registerRule(rule);
    }

    console.log(`📌 ${engine.rules.size} 個のルールを登録しました`);

    // Lint実行
    console.log(`\n🔍 CSS Architecture Lint 検査を開始します...\n`);

    const paths = generatePaths(serviceName);
    const results = await engine.checkPaths(paths); // checkServiceからcheckPathsに変更

    // サマリーの出力
    const summary = engine.getSummary();
    console.log('\n📊 Summary:');
    console.log(`  Layers: ${summary.layers}`);
    console.log(`  Files: ${summary.files}`);
    console.log(`  Errors: ${summary.errors}`);
    console.log(`  Warnings: ${summary.warnings}`);

    // レポートファイルの生成
    writeReportFiles(engine);

    if (results.length === 0) {
      console.log('\n✅ Lint 検査が正常に完了しました');
    } else {
      console.log(`\n❌ ${results.length}件の違反が検出されました。詳細はレポートを確認してください。`);
    }

  } catch (error) {
    console.error('\n❌ システムエラーが発生しました:');
    console.error(`   ${error.message}`);

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(2);
  }
}

// 実行
main();
