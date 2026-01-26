---
slug: "test-e2e-filter"
title: "Playwrightによるフィルター機能のE2Eテスト実装"
author: "ClaudeMix Dev Team"
publishedAt: "2026-01-15"
category: "インフォメーション"
tags: ["Playwright", "testing"]
description: "ブログのカテゴリ・タグフィルター機能をPlaywrightでテストする実装例"
freeContentHeading: "まとめ"
testOnly: true
---

この記事では、ブログのカテゴリ・タグフィルター機能をPlaywrightでテストする実装例を紹介します。

## FilterPanelのE2Eテスト設計

フィルター機能のE2Eテストでは、以下の項目を確認する必要があります:

1. **カテゴリフィルタの動作確認**
   - CategorySelectorでカテゴリを選択
   - 決定ボタンクリック後、該当カテゴリの記事のみが表示される
   - URLパラメータが正しく設定される

2. **タグフィルタの動作確認**
   - TagGrid内のタグボタンを選択
   - 複数タグ選択時はAND条件で絞り込まれる
   - 決定ボタンクリック後、該当タグを持つ記事のみが表示される

3. **複合フィルタの動作確認**
   - カテゴリとタグを同時に選択
   - 両方の条件を満たす記事のみが表示される

## テストデータの管理

テストデータは `spec.yaml` で一元管理します。これにより、テストコードの保守性が向上します。

```typescript
// tests/e2e/utils/loadSpec.ts の使用例
import { getTestArticlesByTag, getTestArticlesByCategory } from './loadSpec';

// Playwrightタグを持つテスト記事を取得
const playwrightArticles = getTestArticlesByTag('Playwright');

// Tutorials & Use Cases カテゴリのテスト記事を取得
const tutorialArticles = getTestArticlesByCategory(3);
```

## フィルタ適用後の検証ポイント

1. **URL確認**: URLクエリパラメータが正しく設定されているか
2. **記事表示確認**: フィルタ条件に一致する記事のみが表示されているか
3. **記事カウント確認**: 表示件数が期待値と一致しているか
4. **パネル閉じる確認**: フィルタ適用後、FilterPanelが自動的に閉じるか

## 実装例

```typescript
test('タグフィルタ選択確認', async ({ page }) => {
  await page.goto('/blog');

  // FilterPanelを開く
  await page.click('[data-testid="filter-toggle-button"]');

  // Playwrightタグを選択
  await page.click('[data-testid="tag-button"][data-tag="Playwright"]');

  // 決定ボタンをクリック
  await page.click('[data-testid="filter-submit-button"]');

  // URLパラメータを確認
  await expect(page).toHaveURL(/tags=Playwright/);

  // フィルタ適用後の記事を確認
  const articles = await page.locator('[data-testid="post-card"]').all();
  expect(articles.length).toBeGreaterThan(0);
});
```

## ベストプラクティス

E2Eテストを書く際のベストプラクティスをいくつか紹介します。

### 1. セレクタの選定

テスト用のセレクタは `data-testid` を使用することを推奨します。これにより、CSSクラスやDOM構造の変更に影響されにくいテストを書くことができます。

```typescript
// 良い例: data-testidを使用
await page.click('[data-testid="submit-button"]');

// 悪い例: CSSクラスに依存
await page.click('.btn-primary');
```

### 2. 待機処理の適切な使用

`waitForTimeout` の使用は避け、代わりに `waitForSelector` や `waitForLoadState` を使用しましょう。

```typescript
// 良い例: 要素の出現を待つ
await page.waitForSelector('[data-testid="result"]');

// 悪い例: 固定時間待機
await page.waitForTimeout(1000);
```

### 3. テストの独立性

各テストは他のテストに依存せず、単独で実行できるようにしましょう。テスト間で状態を共有しないことが重要です。

## トラブルシューティング

E2Eテストでよく遭遇する問題とその解決方法を紹介します。

### タイムアウトエラー

要素が見つからない場合、タイムアウトエラーが発生します。以下の点を確認してください：

- セレクタが正しいか
- 要素が表示されるまでの待機処理が適切か
- ネットワークリクエストが完了しているか

### フレーキーテスト

テストが不安定な場合（たまに失敗する）、以下の対策を検討してください：

- 適切な待機処理の追加
- テスト環境の安定化
- 並列実行の見直し

## まとめ

フィルター機能のE2Eテストでは、spec.yamlからテストデータを読み込み、実際のユーザー操作をシミュレートすることで、堅牢なテストを実現できます。

テストの品質を維持するためには、適切なセレクタの選定、待機処理の使用、そしてテストの独立性を意識することが重要です。

## 参考リソース

さらに詳しく学びたい方は、以下のリソースを参照してください：

- [Playwright公式ドキュメント](https://playwright.dev/docs/intro)
- [E2Eテストのベストプラクティス](https://playwright.dev/docs/best-practices)
