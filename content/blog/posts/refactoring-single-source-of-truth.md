---
slug: "refactoring-single-source-of-truth"
title: "E2Eテストが壊れ続けた理由と、テストデータ一元管理による解決"
description: "設計書・実装・テストの情報散在とE2Eテストデータ問題を、spec.yaml中心のSingle Source of Truth設計で解決したリファクタリング実践記"
author: "ClaudeMix Team"
publishedAt: "2025-11-27"
category: "Claude Best Practices"
tags: ["refactoring", "testing", "architecture"]
---

## はじめに

ブログ機能の開発を進める中で、記事を1つ追加するたびにE2Eテストが壊れるという問題に直面しました。テストコード自体に問題はなく、原因はテストデータが本番データに依存していたことでした。

この記事では、**情報散在**と**E2Eテストデータ問題**を`spec.yaml`を中心とした**Single Source of Truth設計**で解決したリファクタリングの実践記録をお伝えします。

## 問題の発生：情報散在がもたらした課題

### 2.1 情報散在の具体例

プロジェクト初期、カテゴリ名「Claude Best Practices」という単純な情報が、以下の4箇所に散在していました：

```
カテゴリ名「Claude Best Practices」の定義箇所:
- spec.yaml: カテゴリマスタ定義
- func-spec.md: 機能仕様書の説明文
- PostCard.tsx: 実装コメント
- posts.spec.ts: E2Eテストのアサーション
```

この状態では、カテゴリ名を変更する際に4ファイルの同期が必要となり、更新漏れが頻繁に発生しました。結果として：

- テストが原因不明で失敗する
- ドキュメントが陳腐化する
- 調査に30分以上かかることも

### 2.2 E2Eテストデータ問題

特に深刻だったのが、E2Eテストが本番データに依存していたことです：

```typescript
// ❌ 問題のあるテストコード
it('should filter by category', async ({ page }) => {
  await page.click('[data-category="1"]');
  const results = await page.locator('[data-testid="post-card"]');
  await expect(results).toHaveCount(3); // ← 記事追加で壊れる
});
```

この実装では、以下の問題が発生していました：

- **新記事を追加** → カテゴリ1の記事が4件になり、テスト失敗
- **既存記事のカテゴリ変更** → カテゴリ1の記事が2件になり、テスト失敗
- **問題特定に時間がかかる** → テストコードは正しいが、データが原因

記事を追加するたびにテストを修正するという、本末転倒な状況に陥っていました。

## 設計方針の策定

### 3.1 Single Source of Truthの原則

問題を根本から解決するため、以下の設計方針を採用しました：

1. **`spec.yaml`を唯一の真実の源（Single Source of Truth）とする**
2. 設計書・実装・テストはすべて`spec.yaml`を参照
3. リテラル値のハードコードを排除

この方針により、値の変更が`spec.yaml`の1箇所で完結するようになります。

### 3.2 スコープの見極め

`spec.yaml`に何を入れ、何を入れないかの判断基準を明確にしました：

```yaml
# ✅ spec.yamlに入れるべき
categories:          # マスタデータ（カテゴリ一覧）
ui_selectors:        # UIセレクタ定義
test_articles:       # テストデータ定義
business_rules:      # ビジネスルール値（例: ページサイズ）

# ❌ 入れないもの
- 実装ロジックに依存する計算値
- 一時的なモックデータ
- 頻繁に変わる設定値
```

重要なのは、**複数箇所で参照される不変の情報**を`spec.yaml`に集約することです。

## 実装手順

リファクタリングは段階的に実施し、早期に効果を実感できるようにしました。

### Phase 1: テスト専用記事の作成

まず、E2Eテストで使用するテスト専用の記事を作成しました：

```markdown
<!-- content/blog/posts/test-article-category-1.md -->
---
slug: "test-article-category-1"
title: "【テスト記事】カテゴリ1: 初心者向けガイド"
publishedAt: "2025-12-01"
category: "Claude Best Practices"
tags: ["guide", "beginner"]
description: "E2Eテスト専用記事: カテゴリ1とタグ2つの組み合わせテスト用"
---

E2Eテスト専用の記事です。
```

そして、`spec.yaml`でテストデータを定義：

```yaml
# develop/blog/posts/spec.yaml
test_articles:
  - slug: "test-article-category-1"
    title: "【テスト記事】カテゴリ1: 初心者向けガイド"
    category_id: 1
    tags: ["guide", "beginner"]
    description: "E2Eテスト専用記事: カテゴリ1とタグ2つの組み合わせテスト用"
  - slug: "test-article-unique-tag"
    title: "【テスト記事】ユニークタグ記事"
    category_id: 3
    tags: ["e2e-test-only"]
    description: "E2Eテスト専用記事: ユニークタグによる絞り込みテスト用"
```

これにより、本番データとテストデータを完全に分離できました。

### Phase 2: E2Eテストのリファクタリング

テストコードを、`spec.yaml`を参照する形に修正しました：

```typescript
// tests/e2e/screen/blog.screen.spec.ts

// ✅ 修正後: spec.yaml参照、存在確認
it('should filter posts by category', async ({ page }) => {
  // spec.yamlからテストデータを読み込む
  const spec = await loadBlogPostsSpec();
  const categoryToTest = spec.categories[2]; // カテゴリ3
  const testArticles = await getTestArticlesByCategory(categoryToTest.id);

  // テスト用記事が存在することを確認
  expect(testArticles.length).toBeGreaterThan(0);
  const testArticle = testArticles[0];

  await page.goto(TARGET_URL);

  // フィルタを適用
  const filterToggleButton = page.getByTestId('filter-toggle-button');
  await filterToggleButton.click();

  const categorySelector = page.getByTestId('category-selector');
  await categorySelector.selectOption(categoryToTest.name);

  const filterSubmitButton = page.getByTestId('filter-submit-button');
  await filterSubmitButton.click({ force: true });

  // テスト用記事が表示されることを確認（件数ではなく存在確認）
  const testArticleCard = page.locator(
    `[data-testid="post-card"][data-slug="${testArticle.slug}"]`
  );
  await expect(testArticleCard).toBeVisible();
});
```

**重要な変更点**：
- 件数チェック（`toHaveCount(3)`）→ **存在確認**（`toBeVisible()`）に変更
- ハードコードされた値 → `spec.yaml`から取得
- 本番データ依存 → テスト専用記事を使用

この変更により、記事を追加してもテストが壊れなくなりました。

### Phase 3: ヘルパー関数の整備

テストコードの可読性を向上させるため、ヘルパー関数を作成しました：

```typescript
// tests/e2e/utils/loadSpec.ts
import yaml from 'yaml';
import fs from 'fs/promises';

export async function loadBlogPostsSpec() {
  const content = await fs.readFile(
    'develop/blog/posts/spec.yaml',
    'utf-8'
  );
  return yaml.parse(content);
}

export async function getTestArticlesByCategory(categoryId: number) {
  const spec = await loadBlogPostsSpec();
  return spec.test_articles.filter(
    (article) => article.category_id === categoryId
  );
}

export async function getTestArticlesByTag(tag: string) {
  const spec = await loadBlogPostsSpec();
  return spec.test_articles.filter(
    (article) => article.tags?.includes(tag)
  );
}
```

これにより、テストコードの意図が明確になり、保守性が大幅に向上しました。

## 成果と効果測定

### 定量的成果

リファクタリングの効果を数値で測定しました：

| 指標 | Before | After | 改善率 |
|------|--------|-------|--------|
| 値変更時の修正ファイル数 | 4-5ファイル | 1ファイル | **80%削減** |
| E2Eテスト失敗頻度（記事追加時） | 100% | 0% | **100%改善** |
| テストデータ起因の調査時間 | 30分/回 | 0分 | **完全解消** |

### 定性的成果

数値では測れない、開発体験の改善も大きな成果でした：

- ✅ **記事追加・変更でテストが壊れなくなった**
  - 以前: 記事追加のたびにテスト修正が必要
  - 現在: 本番記事を自由に追加・変更可能

- ✅ **カテゴリ名変更が`spec.yaml` 1箇所で完結**
  - 以前: 4-5ファイルを同期する必要があった
  - 現在: `spec.yaml`を変更するだけで全体に反映

- ✅ **テストコードの意図が明確になった**
  - 以前: 件数チェックで何をテストしているか不明瞭
  - 現在: 存在確認で「特定条件の記事が表示されるか」が明確

## 学んだこと・Tips

### 良かった判断

1. **段階的実施（Phase 1-2優先）**
   - テスト専用記事の作成とE2Eテスト修正を優先
   - 早期に効果を実感でき、モチベーション維持につながった

2. **テスト専用記事の作成**
   - 本番データとテストデータを完全分離
   - タイトルに`【テスト記事】`を付けて識別しやすく

3. **存在確認への変更**
   - 件数チェック → 存在確認に変更
   - データの増減に強いテストに

### 注意点

1. **`spec.yaml`の肥大化防止**
   - セクション分割（`categories`, `test_articles`など）
   - スコープを明確にし、入れるべきものを厳選

2. **テストの読みやすさ**
   - ヘルパー関数でラップし、抽象度を適切に保つ
   - コメントで`spec.yaml`参照を明記

### 再利用可能なパターン

このリファクタリングで得られたパターンは、他のセクションにも適用可能です：

```typescript
// 汎用的なspec読み込みヘルパー
export async function loadSpec<T>(specPath: string): Promise<T> {
  const content = await fs.readFile(specPath, 'utf-8');
  return yaml.parse(content);
}

// 使用例
const blogSpec = await loadSpec<BlogSpec>('develop/blog/posts/spec.yaml');
const flowSpec = await loadSpec<FlowSpec>('develop/servicename/spec.yaml');
```

## まとめ

情報散在とE2Eテストデータ問題を、`spec.yaml`中心の**Single Source of Truth設計**で解決しました。

### 重要なポイント

1. **`spec.yaml`を唯一の真実の源とする** - 値の変更が1箇所で完結
2. **テスト専用データを分離する** - 本番データへの依存を排除
3. **存在確認でテストを書く** - データ増減に強いテストに
4. **段階的に実施する** - 早期に効果を実感し、モチベーション維持

この手法は、他のプロジェクトセクションにも適用可能です。設計書・実装・テストの情報管理に課題を感じている方は、ぜひ参考にしてみてください。

## 参考リソース

- [REFACTORING_PLAN.md](https://github.com/yourusername/claudemix/blob/main/REFACTORING_PLAN.md) - 技術的実装計画の詳細
- [develop/blog/posts/spec.yaml](https://github.com/yourusername/claudemix/blob/main/develop/blog/posts/spec.yaml) - 実際のspec.yaml
- [tests/e2e/screen/blog.screen.spec.ts](https://github.com/yourusername/claudemix/blob/main/tests/e2e/screen/blog.screen.spec.ts) - リファクタリング後のE2Eテスト
