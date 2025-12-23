# file-list.md - common Section

## 目的

commonセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| common.spec.ts | tests/e2e/account/common.spec.ts | commonセクション単独のE2Eテスト（認証保護、セッション管理、ナビゲーションを含む） |

---

## 2. UI層（Phase 3.3 / 3.4）

### 2.1 Routes (common固有)

| ファイル名 | パス | URL | 説明 |
| :--- | :--- | :--- | :--- |
| account.tsx | app/routes/account.tsx | /account | アカウント全体の親レイアウトRoute（AuthGuard、セッション検証） |
| account._index.tsx | app/routes/account._index.tsx | /account | マイページトップのRoute（AccountLayoutを使用した最小限の実装） |

**注**: account.tsx は全 `/account/*` ルートの親レイアウトとして機能し、認証保護とセッション管理を提供します。account._index.tsxは他のセクション（authentication、profile、subscription）でも使用されます。

### 2.2 Components (common固有)

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| AccountLayout.tsx | app/components/account/common/AccountLayout.tsx | /account配下の全ページのレイアウトコンテナ（Nav/Contentエリア） |
| AccountLayout.test.tsx | app/components/account/common/AccountLayout.test.tsx | ユニットテスト |
| AuthGuard.tsx | app/components/account/common/AuthGuard.tsx | 認証保護コンポーネント（セッション検証、未認証時リダイレクト） |
| AuthGuard.test.tsx | app/components/account/common/AuthGuard.test.tsx | ユニットテスト |
| AccountNav.tsx | app/components/account/common/AccountNav.tsx | アカウントナビゲーション（マイページ、設定、サブスクリプションへのリンク） |
| AccountNav.test.tsx | app/components/account/common/AccountNav.test.tsx | ユニットテスト |
| FormField.tsx | app/components/account/common/FormField.tsx | 共通フォーム入力フィールド（ラベル、入力欄、エラー表示） |
| FormField.test.tsx | app/components/account/common/FormField.test.tsx | ユニットテスト |
| Button.tsx | app/components/account/common/Button.tsx | 共通ボタンコンポーネント（primary/secondary/danger、ローディング状態） |
| Button.test.tsx | app/components/account/common/Button.test.tsx | ユニットテスト |
| ErrorMessage.tsx | app/components/account/common/ErrorMessage.tsx | エラーメッセージ表示コンポーネント（error/warning/info） |
| ErrorMessage.test.tsx | app/components/account/common/ErrorMessage.test.tsx | ユニットテスト |

---

## 3. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| validateSession.ts | app/lib/account/common/validateSession.ts | セッションの有効性を検証（有効期限チェック、改ざん検証） |
| validateSession.test.ts | app/lib/account/common/validateSession.test.ts | ユニットテスト |
| createSessionData.ts | app/lib/account/common/createSessionData.ts | セッションデータの生成（sessionId、userId、expiresAt） |
| createSessionData.test.ts | app/lib/account/common/createSessionData.test.ts | ユニットテスト |
| isSessionExpired.ts | app/lib/account/common/isSessionExpired.ts | セッション期限切れチェック（現在時刻と比較） |
| isSessionExpired.test.ts | app/lib/account/common/isSessionExpired.test.ts | ユニットテスト |
| getActiveNavItem.ts | app/lib/account/common/getActiveNavItem.ts | 現在のパスに基づいてアクティブなナビゲーション項目を判定 |
| getActiveNavItem.test.ts | app/lib/account/common/getActiveNavItem.test.ts | ユニットテスト |

---

## 4. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| getSession.server.ts | app/data-io/account/common/getSession.server.ts | Cloudflare Workers KVからセッション取得（CookieからsessionIdを取得） |
| getSession.server.test.ts | app/data-io/account/common/getSession.server.test.ts | ユニットテスト（KVモック使用） |
| saveSession.server.ts | app/data-io/account/common/saveSession.server.ts | Cloudflare Workers KVにセッション保存（TTL設定、Cookie生成） |
| saveSession.server.test.ts | app/data-io/account/common/saveSession.server.test.ts | ユニットテスト（KVモック使用） |
| destroySession.server.ts | app/data-io/account/common/destroySession.server.ts | Cloudflare Workers KVからセッション削除（Cookie無効化） |
| destroySession.server.test.ts | app/data-io/account/common/destroySession.server.test.ts | ユニットテスト（KVモック使用） |
| getUserById.server.ts | app/data-io/account/common/getUserById.server.ts | ユーザー情報取得（D1またはKVから取得） |
| getUserById.server.test.ts | app/data-io/account/common/getUserById.server.test.ts | ユニットテスト（DBモック使用） |
