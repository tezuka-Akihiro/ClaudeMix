---
slug: "test-e2e-filter"
title: "Playwrightによるフィルター機能のE2Eテスト実装"
author: "ClaudeMix Dev Team"
publishedAt: "2025-11-15"
category: "インフォメーション"
tags: []
description: "ブログのカテゴリ・タグフィルター機能をPlaywrightでテストする実装例"
freeContentHeading: "テストデータの管理"
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

## まとめ

フィルター機能のE2Eテストでは、spec.yamlからテストデータを読み込み、実際のユーザー操作をシミュレートすることで、堅牢なテストを実現できます。
