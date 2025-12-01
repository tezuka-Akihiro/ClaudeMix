#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseFileListMarkdown } from './lib/parseFileListMarkdown.js';
import { scanDirectory } from './lib/scanDirectory.js';
import { calculateFileDiff } from './lib/calculateFileDiff.js';

/**
 * CLIエントリーポイント
 * file-list.mdと実際のファイルシステムの差分を検出
 *
 * Usage: node scripts/lint-file-list/check-diff.js <develop-section-path>
 * Example: node scripts/lint-file-list/check-diff.js develop/servicename/implementation-flow/
 */

function main() {
  // コマンドライン引数のチェック
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ エラー: 対象パスを指定してください');
    console.error('');
    console.error('使用方法:');
    console.error('  node scripts/lint-file-list/check-diff.js <develop-section-path>');
    console.error('');
    console.error('例:');
    console.error('  node scripts/lint-file-list/check-diff.js develop/servicename/implementation-flow/');
    process.exit(1);
  }

  const sectionPath = args[0];
  const fileListPath = path.join(sectionPath, 'file-list.md');

  // file-list.mdの存在確認
  if (!fs.existsSync(fileListPath)) {
    console.error(`❌ エラー: file-list.mdが見つかりません: ${fileListPath}`);
    process.exit(1);
  }

  // file-list.mdの読み込み
  const fileListContent = fs.readFileSync(fileListPath, 'utf-8');

  // ファイルリストの抽出
  const definedFiles = parseFileListMarkdown(fileListContent);

  if (definedFiles.length === 0) {
    console.log('⚠️  警告: file-list.mdにファイルが定義されていません');
    process.exit(0);
  }

  // sectionPathからserviceとsectionを抽出
  // 例: develop/servicename/implementation-flow/ → service: servicename, section: implementation-flow
  // OS間のパス区切り文字の違いを吸収するため、'develop'を基準にパスを分割する
  const developIndex = sectionPath.replace(/\\/g, '/').lastIndexOf('develop/');

  if (developIndex === -1) {
    console.error('❌ エラー: パス形式が不正です');
    console.error('   パスに "develop/" が含まれている必要があります。');
    console.error(`   指定されたパス: ${sectionPath}`);
    process.exit(1);
  }

  const relevantPath = sectionPath.substring(developIndex);
  const pathParts = relevantPath.replace(/\/$/, '').split('/'); // トレーリングスラッシュを削除して分割
  const service = pathParts[1];
  const section = pathParts[2];

  // 実装ディレクトリのスキャン（3つのディレクトリ）
  const targetDirs = [
    path.join(process.cwd(), 'app', 'components', service, section),
    path.join(process.cwd(), 'app', 'lib', service, section),
    path.join(process.cwd(), 'app', 'data-io', service, section),
  ];

  const scanOptions = {
    excludePatterns: ['node_modules', '.git', 'build', 'dist', 'public/build', 'tests'],
    includeExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  };

  // 各ディレクトリをスキャンして結果をマージ
  let actualFiles = [];
  for (const targetDir of targetDirs) {
    if (fs.existsSync(targetDir)) {
      const files = scanDirectory(targetDir, scanOptions);
      actualFiles = actualFiles.concat(files);
    }
  }

  // 相対パスに変換（プロジェクトルートからの相対パス）
  const relativeActualFiles = actualFiles.map(file =>
    path.relative(process.cwd(), file)
  );

  // 差分計算
  const { undefinedFiles, missingFiles } = calculateFileDiff(definedFiles, relativeActualFiles);

  // 結果の表示
  if (undefinedFiles.length === 0 && missingFiles.length === 0) {
    console.log('✅ file-list.mdと実装ファイルの整合性が確認されました');
    console.log(`   定義ファイル数: ${definedFiles.length}`);
    console.log(`   実装ファイル数: ${relativeActualFiles.filter(f => f.startsWith('app/')).length}`);
    process.exit(0);
  }

  // 未定義ファイルの表示
  if (undefinedFiles.length > 0) {
    console.error(`❌ file-list.mdに未定義のファイルが${undefinedFiles.length}件検出されました:`);
    console.error('');
    undefinedFiles.forEach(file => {
      console.error(`  📄 ${file}`);
    });
    console.error('');
    console.error('対処方法:');
    console.error('  1. 不要なファイルの場合 → 削除してください');
    console.error('  2. 必要なファイルの場合 → file-list.mdに追加してください');
    console.error('');
    console.error(`file-list.md: ${fileListPath}`);
    console.error('');
  }

  // 不足ファイルの表示（情報として）
  if (missingFiles.length > 0) {
    console.log(`ℹ️  file-list.mdに定義されているが実在しないファイルが${missingFiles.length}件あります:`);
    console.log('');
    missingFiles.forEach(file => {
      console.log(`  📄 ${file}`);
    });
    console.log('');
  }

  // 未定義ファイルがある場合はエラーコードで終了
  if (undefinedFiles.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main();
