// psi-summary.mjs - PSI JSONレポートから診断サマリーを抽出
// 用途: Phase 2の分析に必要な情報をコンパクトに出力（<2KB/ページ）
// コマンド: node scripts/psi-summary.mjs [report.json|--latest]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_DIR = path.join(__dirname, '../.claude/skills/lighthouse/reports');

const PERF_THRESHOLDS = {
  'first-contentful-paint': 1800,
  'largest-contentful-paint': 2500,
  'total-blocking-time': 200,
  'cumulative-layout-shift': 0.1,
  'speed-index': 3400,
};

const METRIC_LABELS = {
  'first-contentful-paint': 'FCP',
  'largest-contentful-paint': 'LCP',
  'total-blocking-time': 'TBT',
  'cumulative-layout-shift': 'CLS',
  'speed-index': 'SI',
};

function findLatestReports() {
  if (!fs.existsSync(REPORT_DIR)) {
    console.error('No reports directory found.');
    process.exit(1);
  }

  const files = fs.readdirSync(REPORT_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  // ページごとに最新1件を取得
  const latestByPage = new Map();
  for (const file of files) {
    // _blog_2026-02-13T14-53-48-907Z.json → _blog_
    // _blog_filling-the-void-of-why-now_2026-02-13T... → _blog_filling-the-void-of-why-now_
    const match = file.match(/^(.+?)_\d{4}-\d{2}-\d{2}T/);
    if (match) {
      const pageKey = match[1];
      if (!latestByPage.has(pageKey)) {
        latestByPage.set(pageKey, file);
      }
    }
  }

  return [...latestByPage.values()].map(f => path.join(REPORT_DIR, f));
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KiB`;
  return `${bytes}B`;
}

function extractSummary(data) {
  const lr = data.lighthouseResult;
  const audits = lr.audits;
  const categories = lr.categories;

  // 1. カテゴリスコア
  const scores = {
    performance: Math.round(categories.performance.score * 100),
    accessibility: Math.round(categories.accessibility.score * 100),
    'best-practices': Math.round(categories['best-practices'].score * 100),
    seo: Math.round(categories.seo.score * 100),
  };

  // 2. Core Web Vitals メトリクス
  const metrics = {};
  for (const [id, label] of Object.entries(METRIC_LABELS)) {
    const audit = audits[id];
    if (audit) {
      const value = audit.numericValue;
      const threshold = PERF_THRESHOLDS[id];
      const isCls = id === 'cumulative-layout-shift';
      metrics[label] = {
        value: isCls ? value.toFixed(3) : formatMs(value),
        raw: isCls ? value : Math.round(value),
        pass: isCls ? value <= threshold : value <= threshold,
      };
    }
  }

  // 3. 失敗監査（scoreDisplayModeがmetricSavingsで、score < 1.0）
  const issues = [];
  for (const [id, audit] of Object.entries(audits)) {
    if (audit.scoreDisplayMode === 'metricSavings' && audit.score !== null && audit.score < 1.0) {
      const issue = { id, score: audit.score, title: audit.title };

      if (audit.metricSavings) {
        issue.lcpSaving = audit.metricSavings.LCP || 0;
        issue.fcpSaving = audit.metricSavings.FCP || 0;
      }

      if (audit.details?.overallSavingsBytes) {
        issue.savingsBytes = audit.details.overallSavingsBytes;
      }

      // トップアイテム（最大3件）
      if (audit.details?.items?.length > 0) {
        issue.topItems = audit.details.items.slice(0, 3).map(item => {
          const name = item.url ? path.basename(new URL(item.url).pathname) : item.label || '';
          return { name, wastedBytes: item.wastedBytes || item.totalBytes || 0 };
        }).filter(i => i.name);
      }

      issues.push(issue);
    }
  }
  issues.sort((a, b) => (b.lcpSaving || 0) - (a.lcpSaving || 0));

  // 4. LCP要素情報
  let lcpInfo = null;
  const lcpBreakdown = audits['lcp-breakdown-insight'];
  if (lcpBreakdown?.details?.items) {
    const items = lcpBreakdown.details.items;
    // LCP要素情報（通常index 1）
    const elementItem = items.find(i => i.node || i.selector);
    const breakdownItem = items.find(i => i.items && Array.isArray(i.items));

    lcpInfo = {};
    if (elementItem) {
      lcpInfo.selector = elementItem.node?.selector || elementItem.selector || '';
      lcpInfo.nodeLabel = elementItem.node?.nodeLabel || elementItem.nodeLabel || '';
    }
    if (breakdownItem?.items) {
      lcpInfo.breakdown = breakdownItem.items
        .filter(i => i.subpart)
        .map(i => ({ subpart: i.subpart, duration: Math.round(i.duration || 0) }));
    }
  }

  // 5. リソースサマリー
  let resources = null;
  const resourceSummary = audits['resource-summary'];
  if (resourceSummary?.details?.items) {
    resources = resourceSummary.details.items
      .filter(i => i.resourceType !== 'total' && i.transferSize > 0)
      .map(i => ({ type: i.resourceType, count: i.requestCount, size: i.transferSize }))
      .sort((a, b) => b.size - a.size);
  }

  // 6. Best Practices 失敗監査
  const bpIssues = [];
  if (scores['best-practices'] < 100) {
    const bpRefs = categories['best-practices'].auditRefs || [];
    for (const ref of bpRefs) {
      const audit = audits[ref.id];
      if (audit && audit.score !== null && audit.score < 1.0) {
        bpIssues.push({ id: ref.id, title: audit.title });
      }
    }
  }

  return { url: data.id, scores, metrics, issues, lcpInfo, resources, bpIssues };
}

function printSummary(summary) {
  const { url, scores, metrics, issues, lcpInfo, resources, bpIssues } = summary;

  // URLからパスを抽出
  const urlPath = new URL(url).pathname;

  // ヘッダー
  const scoreStatus = scores.performance >= 95 ? '✅' : '❌';
  console.log(`\n=== ${urlPath} (Performance: ${scores.performance}${scoreStatus} A11y: ${scores.accessibility} BP: ${scores['best-practices']} SEO: ${scores.seo}) ===`);

  // メトリクス
  const metricParts = Object.entries(metrics).map(([label, m]) => {
    const status = m.pass ? '' : '❌';
    return `${label}=${m.value}${status}`;
  });
  console.log(`Metrics: ${metricParts.join(' ')}`);

  // LCP要素
  if (lcpInfo) {
    if (lcpInfo.nodeLabel) {
      const label = lcpInfo.nodeLabel.length > 50
        ? lcpInfo.nodeLabel.substring(0, 50) + '...'
        : lcpInfo.nodeLabel;
      console.log(`LCP Element: "${label}"`);
    }
    if (lcpInfo.breakdown?.length > 0) {
      const parts = lcpInfo.breakdown.map(b => `${b.subpart}: ${formatMs(b.duration)}`);
      console.log(`LCP Breakdown: ${parts.join(' | ')}`);
    }
  }

  // 失敗監査（Performance）
  if (issues.length > 0) {
    console.log('Issues:');
    for (const issue of issues.slice(0, 5)) {
      let line = `  - ${issue.id}:`;
      if (issue.savingsBytes) line += ` ${formatBytes(issue.savingsBytes)} waste`;
      if (issue.lcpSaving) line += ` (LCP+${formatMs(issue.lcpSaving)})`;
      if (issue.topItems?.length > 0) {
        const topItem = issue.topItems[0];
        if (topItem.wastedBytes) {
          line += ` → ${topItem.name} ${formatBytes(topItem.wastedBytes)}`;
        }
      }
      console.log(line);
    }
  }

  // Best Practices 失敗
  if (bpIssues.length > 0) {
    console.log('BP Issues:');
    for (const issue of bpIssues) {
      console.log(`  - ${issue.id}: ${issue.title}`);
    }
  }

  // リソースサマリー
  if (resources) {
    const total = resources.reduce((sum, r) => sum + r.size, 0);
    const totalReqs = resources.reduce((sum, r) => sum + r.count, 0);
    const parts = resources.slice(0, 5).map(r => `${r.type}:${formatBytes(r.size)}`);
    console.log(`Resources: ${totalReqs}req ${formatBytes(total)} (${parts.join(' ')})`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let reportFiles;

  if (args.length === 0 || args[0] === '--latest') {
    reportFiles = findLatestReports();
    if (reportFiles.length === 0) {
      console.error('No JSON reports found in reports directory.');
      process.exit(1);
    }
  } else {
    reportFiles = args.filter(a => !a.startsWith('--')).map(f => path.resolve(f));
  }

  console.log('## PSI Diagnostic Summary\n');

  for (const file of reportFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const summary = extractSummary(data);
      printSummary(summary);
    } catch (error) {
      console.error(`Error processing ${path.basename(file)}: ${error.message}`);
    }
  }

  console.log('');
}

main();
