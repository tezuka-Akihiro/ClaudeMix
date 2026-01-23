# Phase 5.1: E2Eテスト作成（👁️）

あなたは、TDD開発フローのE2Eテスト実装を実行します。

## 🎯 目的

**E2Eテスト**を先に作成することで、実装の完了基準を明確にし、後続の実装フェーズで「何を作るべきか」を常に参照可能にする。

## 📋 成果物

1. **E2E Screen Test**: 画面遷移テスト
2. **E2E Section Test**: 機能テスト

## 📍 前提条件

- Phase 4が完了している（MOCK_POLICY.md, TDD_WORK_FLOW.mdが存在）
- file-list.mdに実装対象ファイルがリストアップされている
- uiux-spec.mdに画面仕様が定義されている

## 思考プロセス（CoT）

以下の順序で段階的に実装してください：

```text
Step 1: uiux-spec.mdを読み込み、画面構成を理解する
  → どのページ遷移をテストすべきか？

Step 2: E2E Screen Test（画面遷移テスト）を作成する
  → ページロード、DOM要素の存在、ナビゲーション

Step 3: func-spec.mdを読み込み、機能要件を理解する
  → どのユーザーシナリオをテストすべきか？

Step 4: E2E Section Test（機能テスト）を作成する
  → フォーム送信、データ表示、エラーハンドリング

Step 5: E2Eテストを実行し、失敗することを確認する
  → Red状態（実装前なので失敗が正しい）
```

## ⚙️ 実行手順

### ステップ 1: E2E Screen Test（画面遷移テスト）

**目的**: ページ遷移が正しく動作するかを検証する。

**出力**: `tests/e2e/{service}/{section}/screen.spec.ts`

**実装内容**:
- ページのロード確認
- 基本的なDOM要素の存在確認
- ナビゲーション動作の確認

**実装例**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('{section} - Screen Test', () => {
  test('should load the page', async ({ page }) => {
    await page.goto('/{service}/{section}')
    await expect(page).toHaveTitle(/{expected-title}/)
  })

  test('should display main elements', async ({ page }) => {
    await page.goto('/{service}/{section}')
    await expect(page.locator('[data-testid="main-container"]')).toBeVisible()
  })

  test('should navigate to detail page', async ({ page }) => {
    await page.goto('/{service}/{section}')
    await page.click('[data-testid="item-link"]')
    await expect(page).toHaveURL(/{expected-url}/)
  })
})
```

**検証基準**: `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md`を参照

**実行**:

```bash
# スクリプトを使用してE2Eテスト実行
./scripts/run-e2e.sh tests/e2e/{service}/{section}/screen.spec.ts
```

### ステップ 2: E2E Section Test（機能テスト）

**目的**: セクション全体の機能が正しく動作するかを検証する。

**出力**: `tests/e2e/{service}/{section}/section.spec.ts`

**実装内容**:
- ユーザーシナリオのテスト
- フォーム送信のテスト
- データ表示のテスト
- エラーハンドリングのテスト

**実装例**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('{section} - Section Test', () => {
  test('should submit form successfully', async ({ page }) => {
    await page.goto('/{service}/{section}')
    await page.fill('[data-testid="input-field"]', 'test value')
    await page.click('[data-testid="submit-button"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should display validation errors', async ({ page }) => {
    await page.goto('/{service}/{section}')
    await page.click('[data-testid="submit-button"]')
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('should display data list', async ({ page }) => {
    await page.goto('/{service}/{section}')
    const items = page.locator('[data-testid="item"]')
    await expect(items).toHaveCount(await items.count())
  })
})
```

**検証基準**: `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md`を参照

**実行**:

```bash
# スクリプトを使用してE2Eテスト実行
./scripts/run-e2e.sh tests/e2e/{service}/{section}/section.spec.ts
```

### ステップ 3: Red状態の確認

E2Eテストを実行し、**失敗する（Red状態）**ことを確認する。

```bash
./scripts/run-e2e.sh tests/e2e/{service}/{section}/
```

実装前なので、テストが失敗するのが正しい状態です。これがTDDの**Red（失敗）**フェーズです。

## ✅ 完了条件

- [ ] E2E Screen Testが作成されている
- [ ] E2E Section Testが作成されている
- [ ] E2Eテストを実行し、Red状態（失敗）を確認している
- [ ] uiux-spec.mdの画面仕様がすべてテストでカバーされている
- [ ] func-spec.mdの機能要件がすべてテストでカバーされている

## 🔗 次フェーズ

**Phase 5.2: CSS実装** (`prompts/05-02-css.md`)

## 📚 参照ドキュメント

- `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md`: E2Eテストの基準
- `develop/{service}/{section}/uiux-spec.md`: 画面仕様書
- `develop/{service}/{section}/func-spec.md`: 機能設計書
- `scripts/run-e2e.sh`: E2Eテスト実行スクリプト
