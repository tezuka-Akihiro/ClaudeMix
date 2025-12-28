# 不具合調査・解消レポート - Modalフォーカストラップテスト失敗

## 1. 不具合の概要

### 発生事象

* E2Eテスト `tests\e2e\account\common.spec.ts:136` でModalのフォーカストラップが機能しない
* Tab押下後、フォーカスがモーダル外に出ている

### エラータイプ

* [x] test-failure (テスト失敗)

### 優先度判定

* [x] **P1 (Error)**: E2Eテスト失敗

### 再現手順

1. `/account/settings` にアクセス
2. 「メールアドレスを変更」ボタンをクリック
3. Modalが開く
4. Tabキーを押す
5. フォーカスがモーダル内に留まっていることを期待するが、モーダル外に出ている

### 期待される動作

* Modalが開いたときフォーカスが最初のフォーカス可能要素に設定される
* Tabキーを押すと次のフォーカス可能要素に移動する(モーダル内)
* フォーカスがモーダル内にトラップされる

### 実際の動作

* Tab押下後、フォーカスがモーダル外にある
* `modal.locator(':focus').count()` が 0 を返す

### 環境

* **OS**: Windows 11
* **ブラウザ**: Chromium (Playwright)
* **Node.js**: v18+

---

## 2. 階層別エラー確認

### 影響レイヤー

* [x] **UI層** (`routes/`, `components/`)
* [x] **テスト層** (`tests/`)

### テスト・ビルド確認

* `[x]` **E2Eテスト**
  * 結果: 15テスト成功、1テスト失敗 (Modal focus trap)
* `[x]` **ビルド**
  * 結果: 成功

---

## 3. 根本原因分析

### 仮説

* フォーカストラップのuseEffectが実行される前にTabが押されている
* 初期フォーカス設定が非同期で完了していない
* フォーカス可能要素の検出に問題がある
* イベントハンドラが正しくフォーカス移動を阻止できていない

### 調査結果

**EmailChangeModal内のフォーカス可能要素**:
1. newEmail input
2. currentPassword input
3. Save button
4. Cancel button

**フォーカストラップ実装**:
```typescript
useEffect(() => {
  if (!isOpen || !modalRef.current) return;

  const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Set initial focus to first element
  if (firstElement) {
    firstElement.focus();
  }

  // Trap focus within modal
  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    // ... trap logic
  };

  document.addEventListener('keydown', handleTabKey);
  return () => document.removeEventListener('keydown', handleTabKey);
}, [isOpen]);
```

**テストコード**:
```typescript
await modalTrigger.click();
const modal = page.locator('[role="dialog"]');
await expect(modal).toBeVisible();
await expect(modal).toHaveAttribute('aria-modal', 'true');

// Wait for focus trap to be set up
await page.waitForTimeout(100);

// Press Tab and verify focus stays within modal
await page.keyboard.press('Tab');
const isInsideModal = await modal.locator(':focus').count() > 0;
expect(isInsideModal).toBe(true); // ❌ false が返される
```

### Why1: なぜフォーカスがモーダル外にあるか？

→ Tab押下時にフォーカストラップが機能していない

### Why2: なぜフォーカストラップが機能しないか？

→ イベントハンドラが正しく実行されていないか、初期フォーカス設定のタイミング問題

### Why3: なぜイベントハンドラが正しく実行されないか？

→ ブラウザのデフォルトTab動作が先に実行され、イベントハンドラが追いついていない可能性

### 根本原因

* **タイミング問題**: 初期フォーカス設定とTab押下のタイミングが合っていない
* **イベント処理順序**: ブラウザのデフォルト動作とカスタムハンドラの実行順序の問題

---

## 4. 解消方針

### 方針1（推奨）: テストに追加の待機を入れる

* **概要**: フォーカスが実際に設定されたことを確認してからTabを押す
* **実装**:
```typescript
// Wait for first input to be focused
await expect(modal.locator('input[name="newEmail"]')).toBeFocused();
await page.keyboard.press('Tab');
```
* **メリット**: 確実にフォーカス設定後にテストが進む
* **デメリット**: テスト特有の修正で、実装の問題は解決しない

### 方針2: フォーカス設定を即座に実行

* **概要**: setTimeout を使わず、即座にフォーカスを設定
* **実装**: 既に即座に実行されているため、これ以上の改善は難しい

### 方針3: テストの検証方法を変更

* **概要**: `:focus` セレクタではなく、`document.activeElement` を使用
* **メリット**: より確実にフォーカス状態を取得できる可能性
* **デメリット**: Playwrightでの実装方法が複雑

---

## 5. 実施する修正

### 修正: テストにフォーカス確認待機を追加

**ファイル**: tests\e2e\account\common.spec.ts

**変更内容**:

```typescript
// Before
await page.waitForTimeout(100);
await page.keyboard.press('Tab');

// After
// Wait for initial focus to be set
await expect(modal.locator('input')).first().toBeFocused();
await page.keyboard.press('Tab');
```

**理由**: フォーカスが実際に設定されたことを確認してからTabを押すことで、タイミング問題を回避

---

## 6. ユーザーへの報告

### 現状

* **成功**: 15テスト (Authentication, Navigation, FlashMessage等)
* **失敗**: 1テスト (Modal focus trap)

### 試した対策

1. ✅ フォーカストラップ実装追加
2. ❌ 100ms待機追加 → 効果なし (2回目の失敗)

### 推奨アクション

* 方針1を実施: テストでフォーカス設定を明示的に待機

**実装しますか？それとも別の指示がありますか？**

---

**レポート作成日時**: 2025-12-26
**作成者**: Claude Code
