---
slug: "blog-metadata-lint-system"
title: "AIレビューで磨くリントシステム設計：ブログメタデータ検証の実装"
description: "ブログ記事のメタデータ品質を自動保証するリントシステムを、AIとの共同設計で構築。エッジランタイムに最適化したプレビルド志向の実装と、設計レビューによる改善プロセスを解説します。"
author: "ClaudeMix Team"
publishedAt: "2025-12-09"
category: "Claude Best Practices"
tags: ["architecture", "testing", "Vite", "Projects"]
---

今回のテーマは **ブログメタデータリントシステムの設計と実装** です。
この記事は、以下のような方に向けて書いています。

- AIとの共同設計でコード品質を向上させたい方
- エッジランタイム環境でのリント設計に興味がある方
- プレビルドベースのアーキテクチャを学びたい方

この記事を読むと、AIレビューを活用した設計プロセスと、エッジランタイムに最適化したリントシステムの実装方法について理解が深まります。

今日の学びを一言でいうと
「実装前のAIレビューで、より良い設計が生まれる」
です！

## はじめに

ClaudeMix ブログは Cloudflare Workers 上で動作するエッジファーストなアーキテクチャを採用しています。その中で、ブログ記事のメタデータ（カテゴリ、タグ、description など）の品質を自動的に保証する仕組みが必要でした。

**エッジランタイムでは動的検証が困難**です。そのため、Markdown を事前に HTML へ変換する「プレビルド思想」と同様に、メタデータ検証もビルド時に完了させる設計を目指しました。

## 開発の進捗

- **Before**: ブログ記事のメタデータを手動でチェックしていたため、タグの typo や description の不足などのミスが発生していました。
- **Current**: プラグインベースのリントシステムを実装し、prebuild フローで全記事のメタデータを自動検証。エラーはコンソールサマリーと Markdown レポートで確認できます。
- **Next**: 将来的には、画像の alt 属性チェックや内部リンクの検証など、コンテンツ品質全般に検証範囲を拡大予定です。

## 具体的なタスク

- **Before**:
  既存の3つの lint システム（Markdown, Template, CSS Architecture）のアーキテクチャを調査し、一貫性のある設計方針を策定しました。

- **Current**:
  6つの検証ルール（必須フィールド、日付範囲、カテゴリ、タグ、slug 形式、description 長）を実装し、spec.yaml から許可値を動的に読み込む仕組みを構築しました。

- **Next**:
  実際のブログ記事にリントを適用し、検出された問題を修正。TypeScript タグの追加や description フィールドの拡充を行いました。

## 課題と解決策

プロジェクトの要件として、以下の3つの制約がありました。

1. 既存 lint システムと同じアーキテクチャを採用する（学習コスト最小化）
2. spec.yaml を Single Source of Truth として動的に参照する
3. 開発者体験を考慮した出力形式を実現する

### 工夫したこと

**アーキテクチャの統一**

既存の `lint-template` システムのコア設計を踏襲しました。具体的には、プラグインベースの `RuleEngine` クラスと、ルール登録機構を採用することで、開発者が直感的に理解できる構造を維持しました。

```javascript
// scripts/lint-blog-metadata/core.js
class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.config = null;
    this.results = [];
  }

  registerRule(name, rule) {
    this.rules.set(name, rule);
  }

  async checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileResults = [];

    for (const [ruleName, rule] of this.rules.entries()) {
      const ruleConfig = this.config?.rules?.[ruleName];
      if (ruleConfig && ruleConfig.enabled === false) continue;

      const ruleResults = await rule.check(content, filePath, ruleConfig || {});
      if (Array.isArray(ruleResults)) {
        fileResults.push(...ruleResults);
      }
    }
    return fileResults;
  }
}
```

**spec.yaml 統合**

js-yaml を使って spec.yaml をパースし、categories と tags の許可値を動的に取得しました。これにより、spec.yaml を更新するだけで検証ルールが自動的に反映される仕組みを実現しました。

```javascript
// scripts/lint-blog-metadata/rules/metadata.js
'category-validation': {
  check: function(content, filePath, config) {
    const { data } = matter(content);
    const specPath = path.join(process.cwd(), config.specPath);
    const spec = yaml.load(fs.readFileSync(specPath, 'utf8'));
    const allowedCategories = spec.categories.map(cat => cat.name);

    if (!allowedCategories.includes(data.category)) {
      results.push({
        message: `無効なカテゴリ: "${data.category}"`,
        suggestion: `許可されたカテゴリ: ${allowedCategories.join(', ')}`
      });
    }
  }
}
```

### ぶつかった壁

**出力形式の設計**

初期設計案では、コンソールに個別エラーも出力する設計でした。しかし、**AI（Claude）がレビューで「サマリーと詳細を分離すべき」という指摘**をしてくれました。

この指摘を受けて、以下のような二段階レポート形式に設計を変更しました。

- **コンソール**: サマリーのみ表示（検査ファイル数、エラー数、警告数）
- **Markdown ファイル**: ファイルごとにグループ化された詳細エラー

この変更により、開発者は概要を即座に把握し、必要に応じて詳細を確認できるようになりました。

### 解決方法

**二段階レポートの実装**

`displayResults()` メソッドでコンソールにサマリーを出力し、`formatMarkdownReport()` メソッドでファイルごとにグループ化された詳細エラーを Markdown に出力しました。

```javascript
// scripts/lint-blog-metadata/engine.js
displayResults(results) {
  const summary = this.engine.getSummary();

  // コンソールにはサマリーのみ
  console.log('\n' + '='.repeat(50));
  console.log('📈 実行サマリー');
  console.log('='.repeat(50));
  console.log(`検査ファイル数: ${summary.files}`);
  console.log(`検出問題数: ${summary.total}`);
  console.log(`  エラー: ${summary.errors}`);
  console.log(`  警告: ${summary.warnings}`);

  // 詳細はMarkdownファイルに出力
  const markdownOutput = this.formatMarkdownReport(results, summary);
  const outputPath = path.join(process.cwd(), 'tests', 'lint', 'blog-metadata-report.md');
  fs.writeFileSync(outputPath, markdownOutput);

  console.log(`\n💾 Lint結果を ${outputPath} に保存しました`);
}
```

**プレビルド志向の設計**

エッジランタイムの制約を踏まえ、**ランタイムでの動的検証ではなく、ビルド時の静的検証を採用**しました。これは、Markdown を事前に HTML へ変換するプレビルドシステムと同じ思想であり、エッジ環境でのパフォーマンスを最大化します。

```json
// package.json
{
  "scripts": {
    "lint:blog-metadata": "node scripts/lint-blog-metadata/engine.js content/blog/posts",
    "prebuild": "npm run lint:md && npm run lint:blog-metadata && node scripts/prebuild/generate-blog-posts.js"
  }
}
```

## コード抜粋

最終的に実装した検証ルールの一例です。日付検証では、年月のみを比較し、±1ヶ月の範囲内であることを確認します。

```javascript
// scripts/lint-blog-metadata/rules/frontmatter.js
'date-validation': {
  name: 'date-validation',
  description: 'publishedAt の日付検証（年月が前後1ヶ月以内）',
  severity: 'error',

  check: function(content, filePath, config) {
    const results = [];
    const { data } = matter(content);

    if (!data.publishedAt) {
      return results; // required-fieldsで検出されるのでスキップ
    }

    const publishedDate = new Date(data.publishedAt);
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const publishedYear = publishedDate.getFullYear();
    const publishedMonth = publishedDate.getMonth();

    // 前後1ヶ月の範囲を計算
    const minDate = new Date(currentYear, currentMonth - 1, 1);
    const maxDate = new Date(currentYear, currentMonth + 2, 0);
    const publishedYearMonth = new Date(publishedYear, publishedMonth, 1);

    if (publishedYearMonth < new Date(minDate.getFullYear(), minDate.getMonth(), 1) ||
        publishedYearMonth > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      results.push({
        message: `publishedAt の年月は現在から前後1ヶ月以内である必要があります`,
        suggestion: `許可範囲: ${minDate.getFullYear()}-${minDate.getMonth() + 1} 〜 ${maxDate.getFullYear()}-${maxDate.getMonth() + 1}`
      });
    }

    return results;
  }
}
```

## 今回の学びと感想

今回の開発で最も印象的だったのは、**実装前に AI がレビューしてくれたことで、設計を改善できた**という点です。

当初の設計案では「コンソールに詳細エラーも出力」という方針でしたが、AI が「開発者体験を考慮するなら、サマリーと詳細を分離すべき」と指摘してくれました。この一言がなければ、実装後に「見づらい」という問題に気づいて手戻りしていたかもしれません。

また、**プレビルド思想の徹底**により、エッジランタイムの制約を逆手に取ることができました。動的検証ができないという制約は、「すべてをビルド時に完了させる」という明確な設計指針を与えてくれました。

AI との共同設計は、単なるコード生成ではありません。設計の壁打ち相手として、実装前に問題点を指摘してくれる存在として、非常に価値がありました。

同じような課題で悩んだ方はいませんか？
もっと良い解決方法があれば教えてください！
