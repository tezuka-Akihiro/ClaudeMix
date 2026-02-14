// psi-trend.mjs - PSIスコアトレンド表示
// 用途: 過去のレポートからスコア推移を表示
// コマンド: node scripts/psi-trend.mjs [--page=/blog]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_DIR = path.join(__dirname, '../.claude/skills/lighthouse/reports');

function parseArgs() {
  const args = process.argv.slice(2);
  let pageFilter = null;

  for (const arg of args) {
    if (arg.startsWith('--page=')) {
      pageFilter = arg.split('=')[1];
    }
  }

  return { pageFilter };
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatTimestamp(ts) {
  // 2026-02-13T14-53-48-907Z → 2026-02-13 14:53
  return ts
    .replace(/T/, ' ')
    .replace(/-(\d{2})-(\d{2})-\d+Z$/, ':$1')
    .substring(0, 16);
}

function loadReports() {
  if (!fs.existsSync(REPORT_DIR)) {
    console.error('No reports directory found.');
    process.exit(1);
  }

  const files = fs.readdirSync(REPORT_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  const reports = [];

  for (const file of files) {
    // 新形式のみ対象: _blog_2026-02-13T14-53-48-907Z.json
    const match = file.match(/^(.+?)_(\d{4}-\d{2}-\d{2}T[\d-]+Z)\.json$/);
    if (!match) continue;

    const pageKey = match[1];
    const timestamp = match[2];

    try {
      const data = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), 'utf8'));
      const lr = data.lighthouseResult;
      const audits = lr.audits;

      const urlPath = new URL(data.id).pathname;

      reports.push({
        pageKey,
        urlPath,
        timestamp,
        performance: Math.round(lr.categories.performance.score * 100),
        fcp: Math.round(audits['first-contentful-paint']?.numericValue || 0),
        lcp: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
        tbt: Math.round(audits['total-blocking-time']?.numericValue || 0),
        cls: audits['cumulative-layout-shift']?.numericValue || 0,
        si: Math.round(audits['speed-index']?.numericValue || 0),
      });
    } catch {
      // Skip invalid files
    }
  }

  return reports;
}

function main() {
  const { pageFilter } = parseArgs();
  const reports = loadReports();

  if (reports.length === 0) {
    console.log('No reports found.');
    return;
  }

  // ページごとにグルーピング
  const byPage = new Map();
  for (const r of reports) {
    if (pageFilter && !r.urlPath.includes(pageFilter)) continue;
    if (!byPage.has(r.urlPath)) {
      byPage.set(r.urlPath, []);
    }
    byPage.get(r.urlPath).push(r);
  }

  if (byPage.size === 0) {
    console.log(`No reports found${pageFilter ? ` for "${pageFilter}"` : ''}.`);
    return;
  }

  console.log('## PSI Performance Trend\n');

  for (const [urlPath, entries] of byPage) {
    // タイムスタンプ降順（新しい順）
    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    console.log(`=== ${urlPath} ===`);

    for (const e of entries) {
      const ts = formatTimestamp(e.timestamp);
      console.log(`${ts} → Perf: ${e.performance.toString().padStart(3)} (LCP:${formatMs(e.lcp)} FCP:${formatMs(e.fcp)} SI:${formatMs(e.si)})`);
    }

    // 最新と最古の差分
    if (entries.length >= 2) {
      const latest = entries[0];
      const oldest = entries[entries.length - 1];
      const perfDelta = latest.performance - oldest.performance;
      const lcpDelta = latest.lcp - oldest.lcp;
      const sign = (n) => n > 0 ? `+${n}` : `${n}`;
      const trend = perfDelta > 0 ? '📈 改善' : perfDelta < 0 ? '📉 悪化' : '➡️ 横ばい';
      console.log(`Delta: ${sign(perfDelta)}pts (LCP ${sign(lcpDelta)}ms) ${trend}`);
    }

    console.log('');
  }
}

main();
