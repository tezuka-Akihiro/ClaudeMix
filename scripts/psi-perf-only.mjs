// psi-perf-only.mjs - Performance限定クイック測定
// 用途: Performanceカテゴリのみ取得し、1行/ページで結果表示（JSON保存しない）
// コマンド: node scripts/psi-perf-only.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS_FILE = path.join(__dirname, '../.claude/skills/lighthouse/docs/paths.md');

function getApiKey() {
  if (process.env.PAGESPEED_API_KEY) {
    return process.env.PAGESPEED_API_KEY;
  }

  const devVarsPath = path.join(__dirname, '../.dev.vars');
  if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, 'utf8');
    const match = content.match(/^PAGESPEED_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }

  return null;
}

function parsePaths() {
  const content = fs.readFileSync(PATHS_FILE, 'utf8');
  const baseUrlMatch = content.match(/^base_url:\s*(.+)$/m);
  const baseUrl = baseUrlMatch ? baseUrlMatch[1].trim().replace(/^<|>$/g, '') : 'https://claudemix.dev';

  const paths = [];
  const lines = content.split('\n');
  let inTable = false;

  for (const line of lines) {
    if (line.includes('| ページ | パス |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        const urlPath = parts[2];
        if (urlPath && urlPath.startsWith('/')) {
          paths.push(urlPath);
        }
      }
    }
  }

  return { baseUrl, paths };
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

async function measurePerf(url, apiKey) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=mobile${apiKey ? `&key=${apiKey}` : ''}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PSI API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  try {
    const apiKey = getApiKey();
    const { baseUrl, paths } = parsePaths();

    console.log('## Performance Quick Check (mobile)\n');

    let allPass = true;

    for (let i = 0; i < paths.length; i++) {
      const urlPath = paths[i];
      const url = `${baseUrl}${urlPath}`;

      process.stdout.write(`Measuring ${urlPath} ... `);

      const data = await measurePerf(url, apiKey);
      const audits = data.lighthouseResult.audits;
      const perfScore = Math.round(data.lighthouseResult.categories.performance.score * 100);

      const fcp = formatMs(audits['first-contentful-paint'].numericValue);
      const lcp = formatMs(audits['largest-contentful-paint'].numericValue);
      const tbt = formatMs(audits['total-blocking-time'].numericValue);
      const cls = audits['cumulative-layout-shift'].numericValue.toFixed(3);
      const si = formatMs(audits['speed-index'].numericValue);

      const status = perfScore >= 95 ? '✅' : '❌';
      if (perfScore < 95) allPass = false;

      const paddedPath = urlPath.padEnd(40);
      console.log(`\r${paddedPath} → Perf: ${perfScore.toString().padStart(3)}${status} (FCP:${fcp} LCP:${lcp} TBT:${tbt} CLS:${cls} SI:${si})`);

      // Rate limit
      if (i < paths.length - 1) {
        const waitTime = apiKey ? 3000 : 30000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!allPass) process.exit(1);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

main();
