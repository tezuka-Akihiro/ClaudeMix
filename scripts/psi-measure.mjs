import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THRESHOLDS = {
  performance: 95,
  accessibility: 100,
  'best-practices': 100,
  seo: 100,
};

const REPORT_DIR = path.join(__dirname, '../.claude/skills/lighthouse/reports');
const PATHS_FILE = path.join(__dirname, '../.claude/skills/lighthouse/docs/paths.md');

async function getApiKey() {
  if (process.env.PAGESPEED_API_KEY) {
    return process.env.PAGESPEED_API_KEY;
  }

  const devVarsPath = path.join(__dirname, '../.dev.vars');
  if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, 'utf8');
    const match = content.match(/^PAGESPEED_API_KEY=(.+)$/m);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function parsePaths() {
  const content = fs.readFileSync(PATHS_FILE, 'utf8');
  const baseUrlMatch = content.match(/^base_url:\s*(.+)$/m);
  const baseUrl = baseUrlMatch ? baseUrlMatch[1].trim() : 'https://claudemix.dev';

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
        const name = parts[1];
        const urlPath = parts[2];
        if (urlPath && urlPath.startsWith('/')) {
          paths.push({ name, path: urlPath });
        }
      }
    }
  }

  return { baseUrl, paths };
}

async function measurePage(url, apiKey, strategy = 'mobile') {
  const categories = Object.keys(THRESHOLDS).map(c => `category=${c}`).join('&');
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&${categories}&strategy=${strategy}${apiKey ? `&key=${apiKey}` : ''}`;

  console.log(`Measuring: ${url} ...`);
  const response = await fetch(apiUrl);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PSI API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  try {
    const apiKey = await getApiKey();
    const { baseUrl, paths } = parsePaths();

    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    const results = [];
    let allPassed = true;

    for (const p of paths) {
      const url = `${baseUrl}${p.path}`;
      const data = await measurePage(url, apiKey);

      const scores = {
        performance: data.lighthouseResult.categories.performance.score * 100,
        accessibility: data.lighthouseResult.categories.accessibility.score * 100,
        'best-practices': data.lighthouseResult.categories['best-practices'].score * 100,
        seo: data.lighthouseResult.categories.seo.score * 100,
      };

      const pagePassed =
        scores.performance >= THRESHOLDS.performance &&
        scores.accessibility >= THRESHOLDS.accessibility &&
        scores['best-practices'] >= THRESHOLDS['best-practices'] &&
        scores.seo >= THRESHOLDS.seo;

      if (!pagePassed) allPassed = false;

      results.push({
        name: p.name,
        path: p.path,
        scores,
        passed: pagePassed
      });

      // Save report
      const fileName = `${p.path.replace(/\//g, '_') || 'home'}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      fs.writeFileSync(path.join(REPORT_DIR, fileName), JSON.stringify(data, null, 2));

      // Rate limit protection
      if (paths.indexOf(p) < paths.length - 1) {
        const waitTime = apiKey ? 5000 : 30000;
        console.log(`Waiting ${waitTime / 1000}s for next request...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Output Markdown Table
    console.log('\n## Lighthouse Score Report (via PageSpeed Insights API)\n');
    console.log('| ページ | Performance | Accessibility | Best Practices | SEO | 判定 |');
    console.log('| :--- | :---: | :---: | :---: | :---: | :---: |');

    for (const r of results) {
      const formatScore = (score, category) => `${score} ${score >= THRESHOLDS[category] ? '✅' : '❌'}`;
      console.log(`| ${r.path} | ${formatScore(r.scores.performance, 'performance')} | ${formatScore(r.scores.accessibility, 'accessibility')} | ${formatScore(r.scores['best-practices'], 'best-practices')} | ${formatScore(r.scores.seo, 'seo')} | ${r.passed ? 'PASS' : 'FAIL'} |`);
    }

    const passCount = results.filter(r => r.passed).length;
    console.log(`\n**結果: ${passCount}/${results.length} ページが全基準をクリア**\n`);

    if (!allPassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
