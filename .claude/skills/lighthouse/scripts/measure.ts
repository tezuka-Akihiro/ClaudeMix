/**
 * Lighthouse自動測定スクリプト
 *
 * 全対象ページのLighthouseスコアを測定し、基準値との比較結果を出力する。
 * 基準値: Performance≥95, Accessibility=100, Best Practices=100, SEO=100
 *
 * 使用方法:
 *   npx tsx .claude/skills/lighthouse/scripts/measure.ts
 *
 * 環境変数:
 *   BASE_URL - 測定対象のベースURL（デフォルト: http://localhost:3000）
 */

import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 型定義 ---

interface MeasurementConfig {
  url: string;
  name: string;
  formFactor: "mobile" | "desktop";
}

interface Thresholds {
  performance: number;
  accessibility: number;
  "best-practices": number;
  seo: number;
}

interface PageResult {
  name: string;
  formFactor: string;
  scores: Record<string, number>;
  pass: boolean;
  failures: string[];
}

// --- 設定 ---

const THRESHOLDS: Thresholds = {
  performance: 95,
  accessibility: 100,
  "best-practices": 100,
  seo: 100,
};

const REPORT_DIR = path.join(__dirname, "..", "reports");

// --- 測定対象パス ---

function getMeasurements(baseUrl: string): MeasurementConfig[] {
  return [
    { url: `${baseUrl}/blog`, name: "blog-posts", formFactor: "mobile" },
    { url: `${baseUrl}/blog`, name: "blog-posts", formFactor: "desktop" },
    {
      url: `${baseUrl}/blog/about-claudemix`,
      name: "blog-detail",
      formFactor: "mobile",
    },
    {
      url: `${baseUrl}/blog/about-claudemix`,
      name: "blog-detail",
      formFactor: "desktop",
    },
    { url: `${baseUrl}/login`, name: "login", formFactor: "mobile" },
    { url: `${baseUrl}/login`, name: "login", formFactor: "desktop" },
    { url: `${baseUrl}/register`, name: "register", formFactor: "mobile" },
    { url: `${baseUrl}/register`, name: "register", formFactor: "desktop" },
  ];
}

// --- 測定関数 ---

async function measureLighthouse(
  config: MeasurementConfig
): Promise<PageResult> {
  console.log(`\n--- 測定: ${config.name} (${config.formFactor}) ---`);
  console.log(`    URL: ${config.url}`);

  const browser = await chromium.launch({
    args: ["--remote-debugging-port=9222"],
  });

  try {
    const runnerResult = await lighthouse(
      config.url,
      {
        port: 9222,
        output: ["html", "json"],
        formFactor: config.formFactor,
        screenEmulation: {
          mobile: config.formFactor === "mobile",
          width: config.formFactor === "mobile" ? 375 : 1350,
          height: config.formFactor === "mobile" ? 667 : 940,
          deviceScaleFactor: config.formFactor === "mobile" ? 2 : 1,
          disabled: false,
        },
      },
      undefined
    );

    if (!runnerResult) {
      throw new Error(`測定失敗: ${config.name}`);
    }

    const lhr = runnerResult.lhr;

    // レポートを保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `${config.name}-${config.formFactor}-${timestamp}`;

    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    const htmlPath = path.join(REPORT_DIR, `${baseName}.html`);
    fs.writeFileSync(htmlPath, runnerResult.report[0]);

    const jsonPath = path.join(REPORT_DIR, `${baseName}.json`);
    fs.writeFileSync(jsonPath, runnerResult.report[1]);

    // スコアを抽出
    const scores: Record<string, number> = {
      performance: Math.round(lhr.categories.performance.score! * 100),
      accessibility: Math.round(lhr.categories.accessibility.score! * 100),
      "best-practices": Math.round(
        lhr.categories["best-practices"].score! * 100
      ),
      seo: Math.round(lhr.categories.seo.score! * 100),
    };

    // 基準値との比較
    const failures: string[] = [];
    for (const [category, threshold] of Object.entries(THRESHOLDS)) {
      const score = scores[category];
      const pass =
        category === "performance" ? score >= threshold : score >= threshold;
      if (!pass) {
        failures.push(category);
      }
    }

    const pagePass = failures.length === 0;

    // スコアサマリーを表示
    for (const [category, score] of Object.entries(scores)) {
      const threshold = THRESHOLDS[category as keyof Thresholds];
      const mark = score >= threshold ? "PASS" : "FAIL";
      console.log(
        `    ${category}: ${score} (threshold: ${threshold}) ${mark}`
      );
    }

    return {
      name: config.name,
      formFactor: config.formFactor,
      scores,
      pass: pagePass,
      failures,
    };
  } finally {
    await browser.close();
  }
}

// --- メイン ---

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const measurements = getMeasurements(baseUrl);

  console.log("=== Lighthouse Score Report ===");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Pages: ${measurements.length}`);

  const results: PageResult[] = [];

  for (const measurement of measurements) {
    try {
      const result = await measureLighthouse(measurement);
      results.push(result);
    } catch (error) {
      console.error(`\nERROR: ${measurement.name} (${measurement.formFactor})`, error);
      results.push({
        name: measurement.name,
        formFactor: measurement.formFactor,
        scores: { performance: 0, accessibility: 0, "best-practices": 0, seo: 0 },
        pass: false,
        failures: ["measurement-error"],
      });
    }
  }

  // サマリー出力
  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.filter((r) => !r.pass).length;

  console.log("\n=== Summary ===");
  console.log(`PASS: ${passCount}/${results.length} pages meet all thresholds`);
  console.log(`FAIL: ${failCount}/${results.length} pages below threshold`);

  if (failCount > 0) {
    console.log("\nFailed pages:");
    for (const result of results.filter((r) => !r.pass)) {
      console.log(
        `  ${result.name} (${result.formFactor}): ${result.failures.join(", ")}`
      );
    }
  }

  console.log(`\nReports saved to: ${REPORT_DIR}`);

  // 終了コード: 全合格なら0、基準未達ありなら1
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(2);
});
