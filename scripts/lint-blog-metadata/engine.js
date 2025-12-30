#!/usr/bin/env node

/**
 * Blog Metadata Linter - メインエントリーポイント
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import RuleEngine from './core.js';
import { getFrontmatterRules } from './rules/frontmatter.js';
import { getMetadataRules } from './rules/metadata.js';
import { getFreeContentHeadingRules } from './rules/validate-free-content-heading.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BlogMetadataLinter {
  constructor() {
    this.engine = new RuleEngine();
    this.config = null;
  }

  /**
   * 初期化処理
   */
  async initialize() {
    try {
      console.log('🚀 Blog Metadata Linter を初期化中...');

      // lint設定を読み込み
      const configPath = path.join(__dirname, 'config.json');
      this.config = this.engine.loadConfig(configPath);

      // ルール登録
      const frontmatterRules = getFrontmatterRules();
      const metadataRules = getMetadataRules();
      const freeContentHeadingRules = getFreeContentHeadingRules();

      const allRules = {
        ...frontmatterRules,
        ...metadataRules,
        ...freeContentHeadingRules
      };

      for (const rule of Object.values(allRules)) {
        this.engine.registerRule(rule);
      }

      const frontmatterCount = Object.keys(frontmatterRules).length;
      const metadataCount = Object.keys(metadataRules).length;
      const freeContentHeadingCount = Object.keys(freeContentHeadingRules).length;

      console.log(`📦 Frontmatterルール ${frontmatterCount} 個を登録`);
      console.log(`🎯 Metadataルール ${metadataCount} 個を登録`);
      console.log(`🔍 FreeContentHeadingルール ${freeContentHeadingCount} 個を登録`);
      console.log('✅ 初期化完了\n');
    } catch (error) {
      console.error('❌ 初期化エラー:', error.message);
      process.exit(1);
    }
  }

  /**
   * マークダウンファイルを収集
   */
  async collectMarkdownFiles(targetPath) {
    console.log('📄 ファイルリストを構築中...');

    const pattern = path.join(targetPath, '**/*.md').replace(/\\/g, '/');
    const files = await glob(pattern, {
      ignore: this.config.ignore?.files || [],
      nodir: true
    });

    const absoluteFiles = files.map(file => path.resolve(file));

    console.log(`📊 ${absoluteFiles.length} ファイルを検査します\n`);

    return absoluteFiles;
  }

  /**
   * 検証実行
   */
  async lintFiles(targetPath) {
    // マークダウンファイル収集
    const files = await this.collectMarkdownFiles(targetPath);

    if (files.length === 0) {
      console.log('⚠️ 検査対象ファイルが見つかりませんでした');
      return 0;
    }

    console.log('🔍 検査実行中...');

    // 検証実行
    const results = await this.engine.checkFiles(files);

    console.log('✅ 検査完了\n');

    // 結果出力
    this.displayResults(results);

    return this.engine.getExitCode();
  }

  /**
   * 結果を表示
   */
  displayResults(results) {
    // 1. コンソールにはサマリーのみ表示
    const summary = this.engine.getSummary();
    console.log('='.repeat(50));
    console.log('📈 実行サマリー');
    console.log('='.repeat(50));
    console.log(`検査ファイル数: ${summary.files}`);
    console.log(`検出問題数: ${summary.total}`);
    console.log(`  エラー: ${summary.errors}`);
    console.log(`  警告: ${summary.warnings}`);
    console.log(`  情報: ${summary.info}`);

    // 2. 詳細なエラー内容はMarkdownファイルに出力
    const outputDir = path.join(process.cwd(), 'tests', 'lint');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const markdownOutput = this.formatMarkdownReport(results, summary);
    const outputPath = path.join(outputDir, 'blog-metadata-report.md');
    fs.writeFileSync(outputPath, markdownOutput);

    console.log(`\n💾 Lint結果を ${outputPath} に保存しました`);
    console.log(`📋 詳細は ${outputPath} を確認してください`);
  }

  /**
   * Markdownレポート生成
   */
  formatMarkdownReport(results, summary) {
    const timestamp = new Date().toLocaleString('ja-JP');
    let markdown = `# Blog Metadata Lint Report\n\n`;
    markdown += `生成日時: ${timestamp}  \n`;
    markdown += `検査ファイル数: ${summary.files}  \n`;
    markdown += `検出問題数: ${summary.total}件（エラー: ${summary.errors}, 警告: ${summary.warnings}, 情報: ${summary.info}）\n\n`;
    markdown += `---\n\n`;

    // ファイルごとにグループ化
    const groupedByFile = this.groupResultsByFile(results);

    if (Object.keys(groupedByFile).length > 0) {
      markdown += `## 検出された問題\n\n`;

      for (const [file, fileResults] of Object.entries(groupedByFile)) {
        markdown += `### ${file}\n\n`;

        const errors = fileResults.filter(r => r.severity === 'error');
        const warnings = fileResults.filter(r => r.severity === 'warning');
        const infos = fileResults.filter(r => r.severity === 'info');

        if (errors.length > 0) {
          markdown += `**❌ エラー (${errors.length}件)**\n\n`;
          errors.forEach(result => {
            markdown += `- \`[${result.rule}]\` ${result.message}\n`;
            if (result.suggestion) {
              markdown += `  - **推奨**: ${result.suggestion}\n`;
            }
          });
          markdown += `\n`;
        }

        if (warnings.length > 0) {
          markdown += `**⚠️ 警告 (${warnings.length}件)**\n\n`;
          warnings.forEach(result => {
            markdown += `- \`[${result.rule}]\` ${result.message}\n`;
            if (result.suggestion) {
              markdown += `  - **推奨**: ${result.suggestion}\n`;
            }
          });
          markdown += `\n`;
        }

        if (infos.length > 0) {
          markdown += `**ℹ️ 情報 (${infos.length}件)**\n\n`;
          infos.forEach(result => {
            markdown += `- \`[${result.rule}]\` ${result.message}\n`;
          });
          markdown += `\n`;
        }

        markdown += `---\n\n`;
      }
    }

    // サマリーテーブル
    markdown += `## サマリー\n\n`;
    markdown += `| カテゴリ | 件数 |\n`;
    markdown += `|:---------|-----:|\n`;
    markdown += `| エラー   | ${summary.errors}    |\n`;
    markdown += `| 警告     | ${summary.warnings}    |\n`;
    markdown += `| 情報     | ${summary.info}    |\n`;
    markdown += `| **合計** | **${summary.total}** |\n\n`;

    // ファイル別サマリー
    if (Object.keys(groupedByFile).length > 0) {
      markdown += `---\n\n`;
      markdown += `## ファイル別サマリー\n\n`;
      markdown += `| ファイル | エラー | 警告 | 情報 |\n`;
      markdown += `|:---------|-------:|-----:|-----:|\n`;

      for (const [file, fileResults] of Object.entries(groupedByFile)) {
        const errorCount = fileResults.filter(r => r.severity === 'error').length;
        const warningCount = fileResults.filter(r => r.severity === 'warning').length;
        const infoCount = fileResults.filter(r => r.severity === 'info').length;
        markdown += `| ${file} | ${errorCount} | ${warningCount} | ${infoCount} |\n`;
      }

      const cleanFilesCount = summary.files - Object.keys(groupedByFile).length;
      markdown += `\n---\n\n`;
      markdown += `**✅ 問題のないファイル**: ${cleanFilesCount}件\n`;
    } else {
      markdown += `**✅ すべてのファイルに問題はありません**\n`;
    }

    return markdown;
  }

  /**
   * ファイルごとにグループ化
   */
  groupResultsByFile(results) {
    const grouped = {};
    results.forEach(result => {
      if (!grouped[result.file]) {
        grouped[result.file] = [];
      }
      grouped[result.file].push(result);
    });
    return grouped;
  }
}

// メインエントリーポイント
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('使用方法: node scripts/lint-blog-metadata/engine.js <ファイルまたはディレクトリ>');
    console.error('例: node scripts/lint-blog-metadata/engine.js content/blog/posts');
    process.exit(1);
  }

  const targetPath = args[0];

  const linter = new BlogMetadataLinter();
  await linter.initialize();
  const exitCode = await linter.lintFiles(targetPath);
  process.exit(exitCode);
}

main().catch(error => {
  console.error('❌ 実行エラー:', error);
  process.exit(1);
});
