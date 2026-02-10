/**
 * Lighthouse測定スクリプト
 * Playwrightを使用してLighthouse測定を実行します
 */

import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MeasurementConfig {
  url: string;
  name: string;
  formFactor: "mobile" | "desktop";
}

const REPORT_DIR = path.join(__dirname, "reports");

// レポートディレクトリが存在しない場合は作成
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function measureLighthouse(config: MeasurementConfig) {
  console.log(`\n🔍 測定開始: ${config.name} (${config.formFactor})`);
  console.log(`   URL: ${config.url}`);

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
      throw new Error("Lighthouse測定に失敗しました");
    }

    // レポートを保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `${config.name}-${config.formFactor}-${timestamp}`;

    // HTMLレポート
    const htmlPath = path.join(REPORT_DIR, `${baseName}.html`);
    fs.writeFileSync(htmlPath, runnerResult.report[0]);
    console.log(`   ✅ HTMLレポート: ${htmlPath}`);

    // JSONレポート
    const jsonPath = path.join(REPORT_DIR, `${baseName}.json`);
    fs.writeFileSync(jsonPath, runnerResult.report[1]);
    console.log(`   ✅ JSONレポート: ${jsonPath}`);

    // スコアサマリーを表示
    const lhr = runnerResult.lhr;
    console.log(`\n📊 スコアサマリー:`);
    console.log(`   Performance: ${Math.round(lhr.categories.performance.score! * 100)}`);
    console.log(`   Accessibility: ${Math.round(lhr.categories.accessibility.score! * 100)}`);
    console.log(`   Best Practices: ${Math.round(lhr.categories["best-practices"].score! * 100)}`);
    console.log(`   SEO: ${Math.round(lhr.categories.seo.score! * 100)}`);

    // パフォーマンス指標を表示
    const metrics = lhr.audits["metrics"].details as any;
    if (metrics && metrics.items && metrics.items[0]) {
      const item = metrics.items[0];
      console.log(`\n⏱️  パフォーマンス指標:`);
      console.log(`   FCP: ${item.firstContentfulPaint}ms`);
      console.log(`   LCP: ${item.largestContentfulPaint}ms`);
      console.log(`   TBT: ${item.totalBlockingTime}ms`);
      console.log(`   CLS: ${item.cumulativeLayoutShift}`);
      console.log(`   Speed Index: ${item.speedIndex}ms`);
    }

    // リソースサイズを表示
    const resourceSummary = lhr.audits["resource-summary"].details as any;
    if (resourceSummary && resourceSummary.items) {
      console.log(`\n📦 リソースサイズ:`);
      for (const item of resourceSummary.items) {
        const sizeKB = Math.round(item.size / 1024);
        console.log(`   ${item.resourceType}: ${sizeKB} KiB (${item.requestCount} requests)`);
      }
    }

    // 未使用のJavaScript/CSSを表示
    const unusedJsAudit = lhr.audits["unused-javascript"];
    if (unusedJsAudit.details) {
      const wastedBytes = (unusedJsAudit.details as any).overallSavingsBytes;
      const wastedKB = Math.round(wastedBytes / 1024);
      console.log(`\n⚠️  未使用JavaScript: ${wastedKB} KiB`);
    }

    const unusedCssAudit = lhr.audits["unused-css-rules"];
    if (unusedCssAudit.details) {
      const wastedBytes = (unusedCssAudit.details as any).overallSavingsBytes;
      const wastedKB = Math.round(wastedBytes / 1024);
      console.log(`   未使用CSS: ${wastedKB} KiB`);
    }

    return runnerResult.lhr;
  } finally {
    await browser.close();
  }
}

async function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  const measurements: MeasurementConfig[] = [
    // ブログ一覧ページ（モバイル）
    {
      url: `${baseUrl}/blog`,
      name: "blog-posts",
      formFactor: "mobile",
    },
    // ブログ一覧ページ（デスクトップ）
    {
      url: `${baseUrl}/blog`,
      name: "blog-posts",
      formFactor: "desktop",
    },
    // ログインページ（モバイル）
    {
      url: `${baseUrl}/login`,
      name: "login",
      formFactor: "mobile",
    },
    // 会員登録ページ（モバイル）
    {
      url: `${baseUrl}/register`,
      name: "register",
      formFactor: "mobile",
    },
  ];

  console.log("🚀 Lighthouse測定を開始します");
  console.log(`   対象URL: ${baseUrl}`);
  console.log(`   測定数: ${measurements.length}`);

  for (const measurement of measurements) {
    try {
      await measureLighthouse(measurement);
    } catch (error) {
      console.error(`\n❌ 測定失敗: ${measurement.name}`, error);
    }
  }

  console.log("\n✅ すべての測定が完了しました");
  console.log(`   レポート保存先: ${REPORT_DIR}`);
}

main().catch(console.error);
