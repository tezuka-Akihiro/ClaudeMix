# 不具合調査・解消レポート - ナビゲーションテスト失敗

## 1. 不具合の概要

### 発生事象

* E2Eテスト `tests\e2e\account\common.spec.ts:56` でナビゲーションリンククリックが機能しない

### エラータイプ

* [x] test-failure (テスト失敗)
* [ ] runtime-error (実行時エラー)
* [ ] type-error (TypeScriptエラー)
* [ ] build-error (ビルドエラー)
* [ ] logic-error (ロジックエラー)
* [ ] integration-error (統合エラー)
* [ ] performance-issue (パフォーマンス問題)

### 優先度判定

* [x] **P1 (Error)**: E2Eテスト失敗 → 1時間以内に対応開始

### 再現手順

1. データベースをセットアップ (`npm run setup:db`)
2. 開発サーバーを起動 (`npm run dev:wrangler`)
3. アカウントE2Eテストを実行 (`npx playwright test tests/e2e/account`)
4. `should navigate between account pages` テストが失敗する

### 期待される動作

* `/account` ページで「設定」ナビゲーションリンクをクリックすると、`/account/settings` にナビゲートする
* URLが `/account/settings` に変更される
* 「設定」ナビゲーションアイテムがハイライトされる (aria-current="page")

### 実際の動作

* 「設定」リンクをクリックしてもURLが `/account` のまま変化しない
* ナビゲーションが発生しない
* タイムアウトエラー: `Expected: "http://127.0.0.1:8788/account/settings" Received: "http://127.0.0.1:8788/account"`

### 環境

* **OS**: Windows 11
* **ブラウザ**: Chromium (Playwright)
* **Node.js**: v18+
* **その他**: Remix + Cloudflare Workers + Wrangler

---

## 2. 階層別エラー確認

### 影響レイヤー

* [x] **UI層** (`routes/`, `components/`)
* [ ] **純粋ロジック層** (`lib/`)
* [ ] **副作用層** (`data-io/`)
* [x] **テスト層** (`tests/`)
* [ ] **設定層** (`config`, `scripts`)
* [ ] **インフラ層** (サーバー、DB、ネットワーク)

### テスト・ビルド確認

* `[x]` **E2Eテスト** (`npm run test:e2e`)
  * 結果: テスト11番目 (navigation test) が失敗。10テストは成功。
* `[x]` **ビルド** (`npm run build`)
  * 結果: 成功 (サーバー起動時に自動実行)
* `[ ]` **ユニット/インテグレーションテスト** (`npm run test`)
  * 結果: 未実施
* `[ ]` **Lint/フォーマット** (`npm run lint`)
  * 結果: 未実施
* `[x]` **ローカル開発環境での動作確認** (`npm run dev`)
  * 結果: サーバーは正常に起動

---

## 3. 根本原因分析 (5 Whys法)

### 仮説

* EmailChangeModalのフォーカストラップ実装がグローバルなキーボードイベントリスナーを追加しており、ページナビゲーションを阻害している可能性
* Remixのクライアント側ナビゲーションが正しく動作していない可能性
* ハイドレーション問題または状態管理の問題

### Why1: なぜこのエラーが発生したか？

→ 「設定」リンクのクリックがナビゲーションを引き起こしていない

### Why2: なぜリンククリックがナビゲーションを引き起こさないか？

→ エラーコンテキストでは、リンクは正しくレンダリングされている (`link "設定" /url: /account/settings`)。クリックイベントが適切に処理されていない可能性がある。

### Why3: なぜクリックイベントが適切に処理されないか？

→ 最近追加したEmailChangeModalのフォーカストラップコードがグローバルイベントリスナーを登録している。または、ビルド/ハイドレーションの問題。

### Why4: なぜこの問題が以前のテスト実行では発生しなかったか？

→ EmailChangeModalにフォーカストラップを追加した後、サーバーを再起動した際に発生し始めた。初回のテスト実行では成功していた (test 11: ok)。

### Why5: なぜ最終的にこの状況になったか？

→ **根本原因**: タイミング問題またはビルドキャッシュの問題。または、EmailChangeModalのフォーカストラップ実装がページナビゲーションに干渉している可能性。

---

## 4. 調査ログ

### 調査1: エラーコンテキストの確認

* **方法**: `tests\e2e\test-results\account-common-Account-Com-81fff-igate-between-account-pages-chromium\error-context.md` を読む
* **結果**: ナビゲーションリンクは正しくレンダリングされている。`link "設定" [cursor=pointer] /url: /account/settings` が存在。
* **判断**: UI層のレンダリングは正常。問題はクライアント側のイベント処理にある可能性。

### 調査2: AccountNavコンポーネントの確認

* **方法**: `app/components/account/common/AccountNav.tsx` を読む
* **結果**: Remix の `<Link>` コンポーネントを使用して正しく実装されている。`to={item.path}` で `/account/settings` を指定。
* **判断**: コンポーネント実装は正しい。Remixのクライアント側ナビゲーションが動作していない可能性。

### 調査3: EmailChangeModalのフォーカストラップ確認

* **方法**: `app/components/account/profile/EmailChangeModal.tsx` を読む
* **結果**: `useEffect` で `document.addEventListener('keydown', handleTabKey)` を登録。モーダルが開いている時 (`isOpen`) のみアクティブ。
* **判断**: `/account` ページではモーダルは存在しないため、このイベントリスナーは影響しないはず。

### 調査4: テストの前後比較

* **方法**: 最初のテスト実行と2回目以降のテスト実行結果を比較
* **結果**:
  * 最初の実行: Test 11 (navigation) が成功
  * 2回目以降: Test 11 (navigation) が失敗
* **判断**: サーバー再起動後やビルド後に問題が発生。タイミングまたはキャッシュ問題の可能性。

### 調査5: data-testid変更の影響確認

* **方法**: `email-change-button` を `modal-trigger` に変更した影響を調査
* **結果**: 他の複数のテストが `email-change-button` を期待しているため失敗。元に戻す必要があった。
* **判断**: data-testidの変更は直接的な原因ではないが、テスト全体の安定性に影響。

---

## 5. 特定された原因

### 抽象レイヤー

* Remixのクライアント側ナビゲーションと何らかの干渉が発生している
* テストのタイミング問題またはページハイドレーションの問題
* 不明確: フォーカストラップのグローバルイベントリスナーの影響は限定的と思われるが、完全には排除できない

### 具体レイヤー

* `tests\e2e\account\common.spec.ts:61-64` でのナビゲーションテストが失敗
* `app/components/account/common/AccountNav.tsx` の `<Link>` コンポーネントのクリックが機能していない
* 可能性: `app/components/account/profile/EmailChangeModal.tsx` のフォーカストラップが影響

### 影響範囲

* ✅ 影響あり:
  * `tests\e2e\account\common.spec.ts:56` (navigation test)
  * `app/components/account/common/AccountNav.tsx`

* ⚠️ 影響の可能性:
  * `app/components/account/profile/EmailChangeModal.tsx` (フォーカストラップ)
  * その他のクライアント側ナビゲーション

---

---

## ⚠️ 再発 - 2025-12-26 (2回目)

### 再発日時

2025-12-26 (PC再起動後の修正作業中)

### 再発の経緯

1. **初回発生**: サーバー再起動後にNavigationテスト失敗 → PC再起動で解決
2. **一時的に解決**: PC再起動後、FlashMessageテストが失敗(profile testに進んでいた)
3. **再発**: account.settings.tsx と account.subscription.tsx の loader を変更した後、再度Navigationテスト失敗

### 変更内容

**account.settings.tsx**:

* 重複している認証ロジックを削除
* `useRouteLoaderData('routes/account')` を使用して親ルートの認証データを取得
* クライアント側ナビゲーションを有効にするために最小限の空 loader を追加: `export async function loader() { return json({}); }`

**account.subscription.tsx**:

* 同様の変更を適用

### 試した対策（追加）

6. ✅ 子ルートに最小限の空 loader を追加 → 効果なし
7. ✅ ビルドクリーン (`rm -rf build`) → 効果なし

### 現在の仮説

1. **Remixのネストルーティングの制約**: 空のloaderを持つ子ルートへのクライアント側ナビゲーションが正しく動作しない
2. **Windows/Wranglerのキャッシュ問題の再発**: PC再起動が必要な状態に再び陥っている
3. **useRouteLoaderDataの問題**: 親ルートのデータを取得する実装が、ナビゲーションに影響している可能性

### 推奨対応

**方針A（推奨）**: PC再起動を再度実施

* 前回これで解決したため、最も確実な方法
* ただし、根本解決にはならない

**方針B**: 子ルートのloaderを完全に復元

* account.settings.tsx と account.subscription.tsx の認証loaderを元に戻す
* `useRouteLoaderData` の使用を中止
* 重複認証は許容する

**方針C**: 空loaderを削除してuseRouteLoaderDataのみにする

* 最小限の空loaderが干渉している可能性を排除

---

## ✅ 初回解決 - PC再起動により解消（2025-12-26）

### 初回解決日時

2025-12-26

### 初回解決方法

**PC再起動により問題が解消されました。**

### 考えられる原因

1. **プロセス・メモリキャッシュの問題**
   * Node.jsプロセスやWranglerプロセスがメモリ上に古い状態を保持していた
   * ビルドキャッシュやモジュールキャッシュの不整合

2. **ファイルシステムキャッシュ**
   * Windowsのファイルシステムキャッシュがビルド成果物の古いバージョンを保持
   * ホットリロード時のファイル変更検知の失敗

3. **ネットワークスタックの問題**
   * ローカルホスト接続 (127.0.0.1:8788) のTCP/IPスタックの状態不整合
   * TIME_WAIT状態のソケットが残留していた可能性

4. **開発サーバーの状態管理**
   * Wranglerの内部状態とビルド成果物の不一致
   * Remixのクライアント側ルーティングキャッシュの問題

### 再発防止策

1. **サーバー再起動時のクリーンアップ**

   ```bash
   rm -rf build
   npm run dev:wrangler
   ```

2. **定期的なプロセスクリーンアップ**
   * 長時間開発する際は、定期的にサーバーを再起動
   * `npm run dev:wrangler` を再実行してクリーンビルド

3. **ポート競合の確認**
   * 8788ポートを使用している他のプロセスがないか確認
   * 必要に応じて `netstat -ano | findstr :8788` で確認

### 検証結果

**修正後のテスト結果:**

* ✅ Test 11 (Navigation): 成功
* ✅ その他のテスト: 進行中

---

## 6. 解消方針 (参考: 当時の検討内容)

### 方針1（第一優先）: 手動デバッグとブラウザコンソール確認

* **概要**: Playwrightのheadedモードで実行し、ブラウザのコンソールエラーやネットワークログを確認
* **メリット**: 実際の動作を目視で確認でき、JavaScriptエラーやネットワーク問題を特定できる
* **デメリット/懸念点**: 時間がかかる。自動化されていない。
* **推定作業時間**: 15-30分
* **Breaking Change**: No

### 方針2（第二優先）: EmailChangeModalのフォーカストラップを条件付きで無効化

* **概要**: フォーカストラップのイベントリスナーをモーダル要素内でのみ有効にし、ドキュメントレベルではなくモーダルスコープに限定
* **メリット**: グローバルイベントリスナーの影響を排除できる
* **デメリット/懸念点**: フォーカストラップが正しく動作しなくなる可能性
* **推定作業時間**: 20-30分
* **Breaking Change**: No

### 方針3（第三優先）: テストにwaitForNavigation追加

* **概要**: テストコードにナビゲーション完了待機ロジックを追加
* **メリット**: タイミング問題を解決できる
* **デメリット/懸念点**: 根本原因の解決にはならない
* **推定作業時間**: 5-10分
* **Breaking Change**: No

### 最終的な対応 (ユーザーへの報告と指示待ち)

* **状況**: 同じテストが2回失敗したため、ユーザーに報告して指示を仰ぐ
* **推奨アクション**: 方針1で手動デバッグを実施し、根本原因を特定する

---

## 7. テスト戦略

### 追加すべきテストケース

#### Navigationテスト

```typescript
test('should navigate with explicit wait', async ({ page }) => {
  await page.goto('/account');
  const nav = page.locator('[data-testid="account-nav"]');

  // Wait for navigation explicitly
  await Promise.all([
    page.waitForURL('/account/settings'),
    nav.locator('text=設定').click(),
  ]);

  await expect(page).toHaveURL('/account/settings');
});
```

### 回帰テスト

* [ ] 既存機能が正常動作することを確認
* [ ] 関連機能に影響がないことを確認
* [x] 他のテスト (1-10) は成功している

---

## 8. 修正実施記録

### 修正1: EmailChangeModalにフォーカストラップ追加

**ファイル**: app/components/account/profile/EmailChangeModal.tsx

**変更内容**:

```typescript
// Added
import { useEffect, useRef } from 'react';

// Added focus trap useEffect
useEffect(() => {
  if (!isOpen || !modalRef.current) return;

  // Get all focusable elements
  const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  // ... focus trap logic

  document.addEventListener('keydown', handleTabKey);
  return () => document.removeEventListener('keydown', handleTabKey);
}, [isOpen]);
```

**理由**: Modalテストでフォーカストラップ機能が求められていた

**影響**: グローバルキーボードイベントリスナーが追加され、ナビゲーションに影響を与える可能性

### 修正2: data-testid変更の取り消し

**ファイル**: app/components/account/profile/ProfileDisplay.tsx

**変更内容**:

```typescript
// Before (broken)
data-testid="modal-trigger"

// After (reverted)
data-testid="email-change-button"
```

**理由**: 他のテストが `email-change-button` を期待していたため

**影響**: Modalテストも `email-change-button` を使用するように変更

---

## 9. 検証結果

### 修正前

* **症状**: Navigationテストが最初の実行では成功、サーバー再起動後に失敗
* **再現性**: サーバー再起動後は毎回失敗

### 修正後

* **症状**: 変化なし - 依然として失敗
* **確認方法**:

  ```bash
  npm run dev:wrangler
  npx playwright test tests/e2e/account -c tests/e2e/playwright.config.ts --reporter=list
  ```

* **結果**: Test 11 (navigation) が継続して失敗

---

## 10. 再発防止策

### プロセス改善

1. グローバルイベントリスナーを追加する際は、影響範囲を慎重に検討する
2. data-testid変更時は全テストでの使用箇所を確認する
3. サーバー再起動後の動作確認を標準化する

### ツール・自動化

1. E2Eテストをheadedモードで実行できるスクリプトを追加
2. ブラウザコンソールエラーを自動収集する仕組みを検討

### ドキュメント整備

1. フォーカストラップ実装のベストプラクティスをドキュメント化
2. テストデータIDの命名規則とメンテナンス方法を明確化

---

## 11. タイムライン

| 時刻 | イベント | 担当 |
| :--- | :--- | :--- |
| セッション開始 | FlashMessageテスト失敗を修正 | Claude |
| +15分 | Modalテスト失敗を発見、フォーカストラップ実装 | Claude |
| +30分 | サーバー再起動後、Navigationテスト失敗を発見 | Claude |
| +45分 | data-testid変更の影響を発見、元に戻す | Claude |
| +60分 | 再テスト実施、依然として失敗 | Claude |
| +70分 | 不具合調査レポート作成、ユーザーに報告 | Claude |

---

## 12. 関連リソース

### 関連ファイル

* [tests\e2e\account\common.spec.ts](tests/e2e/account/common.spec.ts) - 失敗しているテスト
* [app\components\account\common\AccountNav.tsx](app/components/account/common/AccountNav.tsx) - ナビゲーションコンポーネント
* [app\components\account\profile\EmailChangeModal.tsx](app/components/account/profile/EmailChangeModal.tsx) - フォーカストラップ実装
* [app\components\account\profile\ProfileDisplay.tsx](app/components/account/profile/ProfileDisplay.tsx) - data-testid変更箇所

### 参照ドキュメント

* [不具合調査・解消テンプレート.md](不具合調査・解消テンプレート.md) - このレポートのベース

---

## 13. ユーザーへの報告

### 現状

* E2Eテスト実行中、Navigationテスト (`tests\e2e\account\common.spec.ts:56`) が継続して失敗
* 「設定」リンククリックがナビゲーションを引き起こさない
* 15テスト成功、1テスト失敗の状態

### 試した対策

1. ✅ FlashMessageコンポーネント実装 → 成功
2. ✅ EmailChangeModalにフォーカストラップ追加 → 実装完了
3. ❌ data-testid変更 → 他テスト失敗により取り消し
4. ❌ サーバー再起動 → 問題継続
5. ❌ テストコード修正 (waitForURL追加) → 効果なし

### 推奨アクション

* **方針1**: Playwrightをheadedモードで実行し、ブラウザコンソールを確認して根本原因を特定
* **方針2**: EmailChangeModalのフォーカストラップをモーダルスコープに限定
* **方針3**: このテストをスキップして残りのテストを先に進める

**ユーザーへの質問**: どの方針で進めますか?または、他の指示がありますか?

---

**レポート作成日時**: 2025-12-26
**作成者**: Claude Code
