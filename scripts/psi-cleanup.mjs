// psi-cleanup.mjs - PSIレポートクリーンアップ
// 用途: 古いレポートを削除し、ディレクトリ肥大を防止
// コマンド: node scripts/psi-cleanup.mjs [--keep=N] [--dry-run]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_DIR = path.join(__dirname, '../.claude/skills/lighthouse/reports');

function parseArgs() {
  const args = process.argv.slice(2);
  let keep = 3;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--keep=')) {
      keep = parseInt(arg.split('=')[1], 10);
      if (isNaN(keep) || keep < 1) keep = 3;
    }
    if (arg === '--dry-run') dryRun = true;
  }

  return { keep, dryRun };
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KiB`;
  return `${bytes}B`;
}

function main() {
  const { keep, dryRun } = parseArgs();

  if (!fs.existsSync(REPORT_DIR)) {
    console.log('No reports directory found.');
    return;
  }

  const files = fs.readdirSync(REPORT_DIR);

  // ページキーでグルーピング
  const groups = new Map();

  for (const file of files) {
    const filePath = path.join(REPORT_DIR, file);
    const stat = fs.statSync(filePath);

    // タイムスタンプを抽出してグルーピング
    // 新形式: _blog_2026-02-13T14-53-48-907Z.json
    // 旧形式: blog-posts-mobile-2026-02-13T10-45-37-598Z.json
    const newMatch = file.match(/^(.+?)_(\d{4}-\d{2}-\d{2}T[\d-]+Z)\.(json|html)$/);
    const oldMatch = file.match(/^(.+?)-(\d{4}-\d{2}-\d{2}T[\d-]+Z)\.(json|html)$/);

    const match = newMatch || oldMatch;
    if (!match) continue;

    const pageKey = match[1];
    if (!groups.has(pageKey)) {
      groups.set(pageKey, []);
    }

    groups.get(pageKey).push({
      file,
      path: filePath,
      timestamp: match[2],
      size: stat.size,
    });
  }

  // 各グループ内でタイムスタンプ降順ソート
  let totalDeleted = 0;
  let totalFreed = 0;
  const deletedFiles = [];

  for (const [pageKey, entries] of groups) {
    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // keep件以降を削除対象
    const toDelete = entries.slice(keep);
    for (const entry of toDelete) {
      deletedFiles.push(entry);
      totalFreed += entry.size;
      totalDeleted++;

      if (!dryRun) {
        fs.unlinkSync(entry.path);
      }
    }
  }

  // 結果表示
  const action = dryRun ? 'Would delete' : 'Deleted';
  console.log(`## PSI Reports Cleanup ${dryRun ? '(DRY RUN)' : ''}\n`);
  console.log(`Strategy: Keep ${keep} latest per page group\n`);

  if (deletedFiles.length === 0) {
    console.log('No files to clean up.');
  } else {
    console.log(`${action}: ${totalDeleted} files (${formatBytes(totalFreed)} freed)`);
    for (const entry of deletedFiles) {
      console.log(`  - ${entry.file} (${formatBytes(entry.size)})`);
    }
  }

  // 残存ファイル数
  const remainingCount = files.length - totalDeleted;
  const remainingSize = files.reduce((sum, f) => {
    try {
      return sum + fs.statSync(path.join(REPORT_DIR, f)).size;
    } catch { return sum; }
  }, 0) - totalFreed;

  console.log(`\nRemaining: ${remainingCount} files (${formatBytes(remainingSize)})`);
}

main();
