# common - 機能設計書

## 📋 機能概要

### 機能名

Common Components (共通コンポーネント)

### 所属サービス

**account** の **common** セクションに配置

### 機能の目的・価値

- **解決する課題**: アカウントサービス全体で統一されたレイアウト、セッション管理、認証保護を提供する
- **提供する価値**: `/account`配下の全ページでセキュアで一貫性のあるユーザー体験を提供し、認証が必要なページへの不正アクセスを防ぐ
- **ビジネス効果**: セキュリティ強化、ユーザー体験の向上、開発効率の向上（共通機能の再利用）

### 実装優先度

**CRITICAL** - 他のセクション（authentication、profile、subscription）が依存するため、**最優先**で実装する

## 🎯 機能要件

### 基本機能

#### Layout Components

1. **AccountLayout**: `/account`配下の全ページ共通レイアウト
   - ヘッダー: AccountNavを含む
   - メインコンテンツエリア: 子コンポーネント表示
   - 認証チェック: 未認証時は`/login`へリダイレクト
   - 配置: `app/components/account/common/AccountLayout.tsx`

2. **AccountNav**: アカウント関連ナビゲーション
   - ナビゲーション項目:
     - マイページ (`/account`)
     - 設定 (`/account/settings`)
     - サブスクリプション (`/account/subscription`)
   - 現在のページをハイライト表示
   - 配置: `app/components/account/common/AccountNav.tsx`

#### Authentication Components

1. **AuthGuard**: 認証保護コンポーネント
   - セッション検証を実行
   - 未認証時: `/login`へリダイレクト（`redirect-url`パラメータ付き）
   - 認証済み時: 子コンポーネントをレンダリング
   - 配置: `app/components/account/common/AuthGuard.tsx`

#### Form Components

1. **FormField**: 共通フォーム入力フィールド
   - Props: label, name, type, error, required
   - エラー表示機能付き
   - アクセシビリティ対応（aria-label、aria-invalid）
   - 配置: `app/components/account/common/FormField.tsx`

2. **Button**: 共通ボタンコンポーネント
   - Props: variant (primary, secondary, danger), disabled, loading
   - ローディング状態表示機能
   - 配置: `app/components/account/common/Button.tsx`

#### Error Components

1. **ErrorMessage**: エラーメッセージ表示コンポーネント
   - Props: message, type (error, warning, info)
   - インライン表示とモーダル表示の両対応
   - 配置: `app/components/account/common/ErrorMessage.tsx`

### 開発戦略: 段階的強化 (Progressive Enhancement)

1. **ステップ1: モック実装 (UIの確立)**
   - UI層はまず、固定値や単純なPropsを用いて「ガワ」を実装します。この段階では、`loader`や`action`からの実データ連携は行いません。
2. **ステップ2: 機能強化 (ロジックの接続)**
   - モック実装されたUIに、`loader`からの実データや`action`の処理を接続し、完全な機能として仕上げます。

## 🔄 データフロー・処理（3大層分離アーキテクチャ）

### 必要なデータ要件

- **セッションID**: Cookieから取得する認証トークン
- **ユーザー情報**: セッションから取得したユーザーID、メールアドレス、サブスクリプション状態
- **ナビゲーション項目**: AccountNavに表示するためのリスト（ラベル、パス、アクティブ状態）

> **注意**: これらのデータの具体的な構造（キー名、型など）は `spec.yaml` で定義します。このドキュメントでは、機能を実現するために「どのようなデータが必要か」という要件のみを記述します。

### 出力データ要件

loaderがUIに渡すべきデータ：

- **認証済みユーザー情報**:
  - ユーザーを一意に識別する情報
  - 連絡先情報（メールアドレス等）
  - サブスクリプションの契約状態（アクティブ、非アクティブ、トライアル期間等）

- **ナビゲーション項目リスト**:
  - 各ナビゲーション項目の表示ラベル
  - 各項目のリンク先パス
  - 現在表示中のページを示すアクティブ状態

> **注**: 具体的な型定義（インターフェース名、フィールド名、型名）は `app/specs/account/types.ts` で定義します。

### app/components要件（app/routes, app/components）

```text
1. [UI層の責務]
   Layout Components:
   - AccountLayout:
     - 構造: [AccountNav] [children]
     - 認証チェック: AuthGuardを使用
     - レスポンシブ対応
     - デザイントークンを使用したスタイリング

   - AccountNav:
     - ナビゲーション項目を動的に生成（propsから受け取る）
     - 現在のページをハイライト表示（data-active属性）
     - モバイル対応（ハンバーガーメニュー）
     - 各項目クリックで対応するページへ遷移

   Authentication Components:
   - AuthGuard:
     - セッション検証をlib層に委譲
     - 未認証時: `/login?redirect-url=${currentPath}` へリダイレクト
     - 認証済み時: childrenをレンダリング
     - ローディング状態の表示

   Form Components:
   - FormField:
     - labelとinputを自動関連付け（htmlFor）
     - エラー時: 赤枠表示とエラーメッセージ表示
     - required時: ラベルにアスタリスク表示
     - アクセシビリティ: aria-invalid、aria-describedby

   - Button:
     - variant別のスタイリング（primary: 青、secondary: 灰色、danger: 赤）
     - disabled時: 透明度50%、クリック無効
     - loading時: スピナー表示、テキストは"処理中..."

   Error Components:
   - ErrorMessage:
     - type別のアイコン表示（error: ×、warning: !、info: i）
     - インライン表示時: フォーム下部に配置
     - 自動消去機能（5秒後）
```

### 🧠 純粋ロジック要件（app/lib/account/common）

```text
2. [純粋ロジック層の責務]
   セッション管理:
   - validateSession.ts: セッションの有効性を検証
     - 入力: sessionId (string), sessionData (SessionData)
     - 処理: 有効期限チェック、改ざん検証
     - 出力: boolean（有効/無効）

   - createSessionData.ts: セッションデータの生成
     - 入力: userId (string), expiresAt (Date)
     - 処理: セッションデータオブジェクトの生成
     - 出力: SessionData

   - isSessionExpired.ts: セッション期限切れチェック
     - 入力: expiresAt (Date)
     - 処理: 現在時刻と比較
     - 出力: boolean（期限切れ/有効）

   ナビゲーション:
   - getActiveNavItem.ts: 現在のパスに基づいてアクティブなナビゲーション項目を判定
     - 入力: currentPath (string), navItems (NavItem[])
     - 処理: パスマッチング
     - 出力: NavItem[]（isActiveフラグを更新したリスト）
```

### 🔌 副作用要件（app/data-io/account/common）

```text
3. [副作用層の責務]
   セッション管理:
   - getSession.server.ts: Cloudflare Workers KVからセッション取得
     - 入力: request (Request) - Cookieヘッダーを含む
     - 処理:
       - CookieからセッションIDを抽出
       - Cloudflare Workers KVからセッションデータを取得
     - 出力: SessionData | null

   - saveSession.server.ts: Cloudflare Workers KVにセッション保存
     - 入力: sessionId (string), sessionData (SessionData), expiresAt (Date)
     - 処理:
       - Cloudflare Workers KVに保存（TTL設定）
       - CookieにセッションIDを設定
     - 出力: Cookie文字列

   - destroySession.server.ts: Cloudflare Workers KVからセッション削除
     - 入力: sessionId (string)
     - 処理:
       - Cloudflare Workers KVから削除
       - Cookieを無効化
     - 出力: Cookie削除文字列（expires=過去日時）

   ユーザー情報取得:
   - getUserById.server.ts: ユーザー情報取得
     - 入力: userId (string)
     - 処理: データベース（D1またはKV）からユーザー情報を取得
     - 出力: User | null

   セッション一括削除:
   - deleteAllUserSessions.server.ts: ユーザーのすべてのセッションを削除
     - 入力: userId (string)
     - 処理:
       - Cloudflare Workers KVから該当ユーザーのセッションをすべて削除
       - セッションキーのパターン: `session:${sessionId}` → 値に`userId`を含む
     - 出力: void
     - 用途: パスワード変更、パスワードリセット、アカウント削除時のセキュリティ対策
```

### 🔐 セッション管理のデータフロー

```text
セッション検証 (Route: /account/*):
1. [Route層の責務]
   - loader内でセッション検証を実行
   - 未認証時: `/login`へリダイレクト
   - 認証済み時: ユーザー情報をUIに渡す

2. [Data-IO層の責務]
   - getSession.server.ts: CookieからセッションIDを取得し、KVからセッションデータを取得

3. [Logic層の責務]
   - validateSession.ts: セッションの有効性を検証（期限切れチェック、改ざん検証）

4. [Data-IO層の責務]
   - getUserById.server.ts: セッションから取得したuserIdで、ユーザー情報を取得

フロー図:
Request (Cookie)
  → Data-IO: getSession (KV読み込み)
  → Logic: validateSession (検証)
  → Data-IO: getUserById (DB/KV読み込み)
  → Route: loader返却
  → UI: レンダリング
```

## 🔒 セキュリティ要件

### セッション管理のセキュリティ

1. **セッションIDの生成**:
   - 暗号学的に安全な乱数生成（crypto.randomUUID()）
   - 推測不可能な128bit以上のランダム文字列

2. **Cookie設定**:
   - `HttpOnly`: JavaScriptからアクセス不可
   - `Secure`: HTTPS通信のみ
   - `SameSite=Lax`: CSRF攻撃対策
   - `Max-Age`: セッション有効期限（7日間）

3. **セッションデータの保存**:
   - Cloudflare Workers KVに保存（グローバル分散、暗号化済み）
   - TTL設定による自動削除

4. **セッション検証**:
   - 有効期限チェック（期限切れは即座に無効化）
   - 改ざん検証（必要に応じてHMAC署名）

### エラーハンドリング

1. **セッション期限切れ**:
   - `/login?redirect-url=${currentPath}` へリダイレクト
   - ユーザーにメッセージ表示: "セッションが期限切れです。再度ログインしてください。"

2. **セッション不正**:
   - 即座にセッション削除
   - `/login` へリダイレクト
   - ログ出力（セキュリティ監査用）

3. **KVアクセスエラー**:
   - リトライロジック（最大3回）
   - 失敗時: エラーページ表示
