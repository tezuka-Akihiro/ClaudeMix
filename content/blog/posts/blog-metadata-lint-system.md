---
slug: "blog-metadata-lint-system"
title: "AIレビューで磨くリントシステム設計：ブログメタデータ検証の実装"
description: "ブログ記事のメタデータ品質を自動保証するリントシステムを、AIとの共同設計で構築。エッジランタイムに最適化したプレビルド志向の実装と、AIレビューによる改善プロセスを解説します。"
author: "ClaudeMix Team"
publishedAt: "2025-12-09"
category: "ClaudeMix 考察"
tags: ["architecture", "testing", "Vite", "CLAUDE.md"]
freeContentHeading: "具体的なタスク"
---

## はじめに

### ブログのメタデータ管理でこんなことありませんか？

- カテゴリのタイポやタグの不整合、descriptionの書き忘れといったミスが蓄積している。
- 記事数が増えるにつれて手作業での管理が限界を迎え、品質の低下が目立ち始めた。
- サイト内の情報が整理されず、ユーザー体験やSEOに悪影響を及ぼす負債を感じている。

### この記事をお勧めしない人

- メタデータの品質が多少低くても、コンテンツの本質には影響しないと考える人。
- 手作業でのダブルチェックが、自動化されたシステムより信頼できると信じる人。
- AIとの協調設計や、ビルドプロセスを最適化するアーキテクチャに興味がない人。

もし一つでも当てはまらないなら、読み進める価値があるかもしれません。

### 蓄積される「コンテンツの技術的負債」

- 手作業での品質管理を続けると、サイトには「見えない技術的負債」が静かに蓄積されていく。
- タグの不整合で関連記事が機能しなくなり、SEO評価の低下によって流入が減少する。
- 最終的にサイトは情報が整理されない状態に陥り、読者が価値ある情報に辿り着けず離脱する。

### 品質自動保証という明るい未来

- この記事を読めば、AIとの協調設計を通じて、コンテンツの品質を自動で保証するリントシステムの設計思想が手に入る。
- 具体的には、Cloudflare Workersのようなエッジ環境に最適化された「プレビルド検証アーキテクチャ」の設計図を手に入れられる。
- この方法は、本ブログ自身のメタデータ品質を担保するために実証済みであり、実効性の高いアプローチを提示する。
- この情報は、AIを"レビュー担当者"として活用し、品質を自動で担保する未来の開発現場から得られた一次情報である。

> ※ **リントシステム**: ルール違反がないか自動でチェックしてくれる仕組み。
> ※ **エッジ環境**: ユーザーに近いサーバーでプログラムを動かす環境。サイトが速くなります。
> ※ **プレビルド検証アーキテクチャ**: 公開「前」にページの品質を「検証」する「設計思想」のこと。
> ※ **メタデータ**: 記事のタイトルやカテゴリなど、コンテンツ自身ではなく「コンテンツに関する情報」のこと。

### 私も同じでした

私も過去に同じ問題で悩み抜き、このブログを「AIによる実装」と「人間による設計・レビュー」で作り上げる過程でこのリントシステムを構築しました。この記事で、あなたのコンテンツ品質を自動で守る基本的な考え方と、明日から試せるTipsを持ち帰れるように書きました。さらに深掘りして、AIに高品質なコードを生成させるための"ガードレール設計"を知りたい方は、その詳細な実装方法を確認できます。

## 開発の進捗

- **Before**: ブログ記事のメタデータを手動でチェックしていたため、タグのタイポや description の不足などのミスが発生していました。
- **Current**: プラグイン（※）形式のリントシステムを実装し、prebuild フロー（※）で全記事のメタデータを自動検証。エラーはコンソールサマリー（※）と Markdown レポート（※）で確認できます。
- **Next**: 将来的には、画像の alt 属性チェックや内部リンクの検証など、コンテンツ品質全般に検証範囲を拡大予定です。

> ※ **プラグイン**: 機能を追加・変更しやすくする仕組み。
> ※ **prebuild フロー**: サイトを公開する前に行う一連の自動処理の流れ。
> ※ **コンソールサマリー**: 開発者向け画面に出る、チェック結果の要約。
> ※ **Markdown レポート**: チェック結果をまとめた、読みやすい報告書ファイル。

## 具体的なタスク

- **Before**:
  既存のリントシステムのアーキテクチャ（※）を調査し、一貫性のある設計方針を策定しました。
- **Current**:
  複数の検証ルール（必須フィールド、カテゴリ、タグ、日付形式、slug 形式、description 長）を実装し、spec.yaml（※）から許可値を動的に読み込む仕組みを構築しました。
- **Next**:
  実際のブログ記事にリントを適用し、検出された問題を修正しました。

> ※ **アーキテクチャ**: システム全体の設計図や骨組みのこと。
> ※ **spec.yaml**: サイトの設定（例: 使えるカテゴリ名など）を書いておく設定ファイル。

ここからは、実際にClaudeMixで実装した具体的な設計と実装コードを公開します。

プラグイン形式のRuleEngineクラス実装、spec.yamlとの統合方法、AIレビューによる設計改善プロセス、そして二段階レポート機能の実装まで、ClaudeMixで実際に記述したJavaScriptコードを、ステップバイステップで解説します。

## 課題と解決策

ClaudeMix ブログは Cloudflare Workers 上で動作するため、**エッジ環境では動的な検証が困難**です。そのため、Markdown を事前に HTML へ変換する「プレビルド思想（※）」と同様に、メタデータ検証もビルド時に完了させる設計を目指しました。

また、プロジェクトの要件として、以下の3つの制約がありました。

1. 既存 lint システムと同じアーキテクチャを採用する（学習コスト最小化）
2. spec.yaml を Single Source of Truth（※）として動的に参照する
3. 開発者体験を考慮した出力形式を実現する

> ※ **プレビルド思想**: ユーザーがアクセスする「前」に、あらかじめページを作っておく考え方。
> ※ **Single Source of Truth**: 「信頼できる唯一の情報源」という意味。情報が1箇所にまとまっている状態。

### 工夫したこと

#### アーキテクチャの統一

既存の `lint-template` システムのコア設計を踏襲しました。具体的には、プラグイン形式の `RuleEngine` クラス（ルールを管理するプログラム）と、ルール登録機構を採用することで、開発者が直感的に理解できる構造を維持しました。

~~~javascript
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
~~~

#### spec.yaml 統合

js-yaml（※）を使って spec.yaml を読み込み、categories と tags の許可値を動的に取得しました。これにより、spec.yaml を更新するだけで検証ルールが自動的に反映される仕組みを実現しました。

~~~javascript
// scripts/lint-blog-metadata/rules/metadata.js
'category-validation': {
  check: function(content, filePath, config) {
    const { data } = matter(content); // matterは記事のメタデータを読み取るライブラリ
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
~~~

> ※ **js-yaml**: JavaScriptでYAML形式のファイルを読み書きするためのライブラリ（道具）。

### ぶつかった壁

#### 出力形式の設計

初期設計案では、コンソールに個別エラーも出力する設計でした。しかし、**AI（Claude）がレビューで「サマリーと詳細を分離すべき」という指摘**をしてくれました。

この指摘を受けて、以下のような二段階レポート形式に設計を変更しました。

- **コンソール**: サマリーのみ表示（検査ファイル数、エラー数、警告数）
- **Markdown ファイル**: ファイルごとにグループ化された詳細エラー

この変更により、開発者は概要を即座に把握し、必要に応じて詳細を確認できるようになりました。

### 解決方法

#### 二段階レポートの実装

`displayResults()` メソッドでコンソールにサマリーを出力し、`formatMarkdownReport()` メソッドでファイルごとにグループ化された詳細エラーを Markdown に出力しました。

~~~javascript
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
~~~

#### プレビルド志向の設計

エッジ環境の制約を踏まえ、**ランタイムでの動的検証ではなく、ビルド時の静的検証を採用**しました。これは、Markdown を事前に HTML へ変換するプレビルドシステムと同じ思想であり、エッジ環境でのパフォーマンスを最大化します。

~~~json
// package.json
{
  "scripts": {
    "lint:blog-metadata": "node scripts/lint-blog-metadata/engine.js content/blog/posts", // メタデータをリントするコマンド
    "prebuild": "npm run lint:md && npm run lint:blog-metadata && node scripts/prebuild/generate-blog-posts.js"
  }
}
~~~

## コード抜粋

最終的に実装した検証ルールの一例です。カテゴリ検証では、spec.yaml から動的に許可値を読み込み、記事のカテゴリが許可リストに含まれているかを確認します。

~~~javascript
// scripts/lint-blog-metadata/rules/metadata.js
'category-validation': {
  name: 'category-validation',
  description: 'category の選択肢検証',
  severity: 'error',

  check: function(content, filePath, config) {
    const results = [];
    const { data } = matter(content);

    if (!data.category) { // categoryが未入力の場合は別のルールで検出するので、ここでは何もしない
      return results; // required-fieldsで検出されるのでスキップ
    }

    // spec.yaml からカテゴリ取得
    const specPath = path.join(process.cwd(), config.specPath || 'app/specs/blog/posts-spec.yaml');
    const spec = yaml.load(fs.readFileSync(specPath, 'utf8'));
    const allowedCategories = spec.categories.map(cat => cat.name);

    if (!allowedCategories.includes(data.category)) {
      results.push({
        message: `無効なカテゴリ: "${data.category}"`,
        line: 1,
        severity: config.severity || this.severity,
        file: filePath,
        rule: this.name,
        suggestion: `許可されたカテゴリ: ${allowedCategories.join(', ')}`
      });
    }

    return results;
  }
}
~~~

このコードの重要なポイントは、**spec.yaml を「信頼できる唯一の情報源（Single Source of Truth）」として扱っている**点です。カテゴリの追加や変更は spec.yaml を更新するだけで自動的に反映されるため、検証ルール自体を変更する必要がありません。

## 今回の学びと感想

今回の開発で最も印象的だったのは、**実装前にAIがレビューしてくれたことで、設計を改善できた**という点です。

当初の設計案では「コンソールに詳細エラーも出力」という方針でしたが、AI が「開発者体験を考慮するなら、サマリーと詳細を分離すべき」と指摘してくれました。この一言がなければ、実装後に「見づらい」という問題に気づいて手戻りしていたかもしれません。

また、**プレビルド思想の徹底**により、エッジランタイムの制約を逆手に取ることができました。動的検証ができないという制約は、「すべてをビルド時に完了させる」という明確な設計指針を与えてくれました。

AIとの共同設計は、単なるコード生成ではありません。設計の壁打ち相手として、実装前に問題点を指摘してくれる存在として、非常に価値がありました。

同じような課題で悩んだ方はいませんか？
もっと良い解決方法があれば教えてください！
