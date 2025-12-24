# account サービス開発原則 (GUIDING_PRINCIPLES)

## 1. 目的とスコープ

このドキュメントは、`account` サービス開発における技術的な方針、アーキテクチャ原則、および品質基準を定義します。
以降のすべての設計ドキュメント（`func-spec.md`, `uiux-spec.md` など）は、この原則に従って作成されなければなりません。

**サービス概要**:

- **目的**: ブログ記事の有料サブスクリプションを実現するため、会員登録、認証、プロフィール管理、決済管理の機能を提供する
- **主要機能**:
  - 会員登録（メール/パスワード）
  - ログイン/ログアウト
  - OAuth認証（Google/Apple）
  - プロフィール情報の閲覧・編集
  - パスワード変更
  - 退会処理
  - Stripeによる有料プラン管理（1/3/6ヶ月プラン）
  - サブスクリプション状態の同期
  - ブログ記事へのアクセス権限の提供
- **ターゲットユーザー**: ブログの有料記事を購読したい読者、技術情報に対価を支払う意思のある開発者

**開発スコープ**:

- **範囲内 (In Scope)**: 会員登録、認証（メール/パスワード、OAuth）、パスワードリセット、プロフィール管理、サブスクリプション管理（Stripe）、セッション管理（Cloudflare Workers KV）
- **範囲外 (Out of Scope)**: 2段階認証、プロフィール画像アップロード、ユーザー間メッセージ機能、管理者画面

---

## 2. 遵守すべきアーキテクチャ原則

このサービスは、プロジェクトのボイラープレートで定義された以下の主要なアーキテクチャ原則を厳格に遵守します。詳細な規約については、各ドキュメントを参照してください。

- **3大層分離アーキテクチャ**: `CLAUDE.md` および `README.md` に記載の通り、UI層・純粋ロジック層・副作用層の責務を分離します。
- **Outside-In TDD**: `TDD_WORK_FLOW.md` に記載された開発フローに従います。
- **スタイリング憲章**: `docs/CSS_structure/STYLING_CHARTER.md` に基づくCSS階層アーキテクチャを遵守します。

---

## 3. ルーティング規約

**採用パターン**: **Remix v2 Flat Routes規則**を採用します。フォルダベース形式は使用しません。

**命名規則**:
| パターン | ファイル名 | 生成されるURL | 備考 |
| :--- | :--- | :--- | :--- |
| 登録ページ | `register.tsx` | `/register` | 会員登録フォーム |
| ログインページ | `login.tsx` | `/login` | ログインフォーム |
| ログアウト | `logout.tsx` | `/logout` | ログアウト処理（action） |
| パスワードリセット要求 | `forgot-password.tsx` | `/forgot-password` | メールアドレス入力フォーム |
| パスワードリセット実行 | `reset-password.$token.tsx` | `/reset-password/:token` | 新パスワード入力フォーム |
| アカウントトップ | `account._index.tsx` | `/account` | マイページトップ |
| 設定ページ | `account.settings.tsx` | `/account/settings` | プロフィール編集、パスワード変更 |
| サブスクリプション | `account.subscription.tsx` | `/account/subscription` | プラン選択、決済管理 |

**URL設計**:

- **会員登録**: `/register` → `app/routes/register.tsx`
- **ログイン**: `/login` → `app/routes/login.tsx`
- **ログアウト**: `/logout` → `app/routes/logout.tsx`
- **パスワードリセット要求**: `/forgot-password` → `app/routes/forgot-password.tsx`
- **パスワードリセット実行**: `/reset-password/:token` → `app/routes/reset-password.$token.tsx`
- **マイページ**: `/account` → `app/routes/account._index.tsx`
- **設定**: `/account/settings` → `app/routes/account.settings.tsx`
- **サブスクリプション**: `/account/subscription` → `app/routes/account.subscription.tsx`

**技術的制約**:

- `/account`配下のルートは、すべてセッション認証が必要（未認証時は`/login`へリダイレクト）
- OAuth callbackルートは`/auth/callback/google`、`/auth/callback/apple`として実装
- Cloudflare Workers KVでセッション管理を行うため、セッションIDはCookieに保存

---

## 4. セクション間連携と共通化方針

**セクション定義** - このサービスは以下の4つのセクションで構成されます：

- **`common`**: アカウントサービス全体で共有されるレイアウト、セッション管理ユーティリティ、認証保護機能、共通UIコンポーネント（フォーム部品、エラー表示等）を提供
- **`authentication`**: 会員登録、ログイン、ログアウト、OAuth連携（Google/Apple）を実装
- **`profile`**: プロフィール情報の表示・編集、パスワード変更、退会処理を実装
- **`subscription`**: Stripeによる有料プラン管理（1/3/6ヶ月）、決済処理、サブスクリプション状態の同期を実装

**共通コンポーネントの配置ルール**:

- **基本方針**: サービス内共通コンポーネントは `app/components/account/common/` に配置します
- **セッション管理ユーティリティ**: `app/lib/account/common/` に配置します（純粋ロジック層）
- **プロジェクト共通コンポーネント**: プロジェクト全体で利用されるコンポーネントは、オペレーターに相談の上、適切な場所に配置する
- **file-list.md管理方針**: 複数セクションで共有されるコンポーネントは、commonセクションのfile-list.mdに記載します

**他サービス（blogなど）からの利用許可**:

- **公開インターフェース**: `app/lib/account/common/` 配下のセッション検証関数は、他サービス（`services.blog`）からもインポートして利用することを許可します
- **推奨される公開関数**:
  - `validateSession()`: セッション検証（セッションIDからユーザー情報を取得）
  - `requireAuth()`: 認証必須ガード（未認証時にエラーをthrow）
  - `requireSubscription()`: サブスクリプション必須ガード（未契約時にエラーをthrow）
- **利用例**: blogサービスの有料記事詳細ページ（`routes/blog.$postId.tsx`）から`requireSubscription()`を呼び出し、サブスクリプション状態に応じてアクセス制御を実施

**実装順序**:

- **重要**: `common`セクションは、他のセクションよりも**必ず先に実装**してください。他のセクションがセッション管理ユーティリティや共通コンポーネントに依存するためです
- **推奨順序**: common → authentication → profile (Phase 1) → subscription → profile (Phase 2)

**Phase分離による依存関係の解決**:

- 一部のセクションは、機能を**Phase 1（基本機能）**と**Phase 2（高度な機能）**に分割します
- **profile セクション**:
  - **Phase 1** (authenticationセクション完了後に実装可能): プロフィール表示、メールアドレス変更、パスワード変更
  - **Phase 2** (subscriptionセクション完了後に実装): アカウント削除機能（Stripeサブスクリプション解約処理を含む）
- この分割により、循環依存を回避し、段階的な実装が可能になります

**データフロー**:

```mermaid
graph TD
    A[/register Route] -->|action| B[会員登録処理]
    B --> C[data-io: ユーザー作成]
    C --> D[lib: パスワードハッシュ化]

    E[/login Route] -->|action| F[ログイン処理]
    F --> G[data-io: ユーザー認証]
    G --> H[lib: セッション生成]

    I[/account Route] -->|loader| J[セッション取得]
    J --> K[lib: セッション検証]
    K --> L[data-io: ユーザー情報取得]
    L --> M[UI: マイページ表示]

    N[/account/subscription Route] -->|action| O[Stripe決済処理]
    O --> P[data-io: Stripe API連携]
    P --> Q[lib: サブスクリプション状態更新]
```

**主要なデータフロー**:

1. **会員登録**: Route → data-io（ユーザー作成） → lib（パスワードハッシュ化） → lib（セッション生成） → Cookie保存
2. **ログイン**: Route → data-io（認証） → lib（セッション生成） → Cookie保存
3. **パスワードリセット**: Route → data-io（トークン生成・KV保存） → data-io（メール送信） → Route（トークン検証） → data-io（パスワード更新） → lib（全セッション破棄）
4. **マイページ**: Route → lib（セッション検証） → data-io（ユーザー情報取得） → UI（表示）
5. **サブスクリプション**: Route → data-io（Stripe API） → lib（状態更新） → UI（結果表示）
6. **退会処理**: Route → data-io（アクティブなサブスクリプション確認） → data-io（Stripeサブスクリプション即時解約） → data-io（D1: subscriptionsテーブル削除） → data-io（D1: usersテーブル削除） → lib（全セッション破棄） → /loginへリダイレクト

---

## 5. 用語集 (Glossary)

このサービス開発で使用される主要な用語、英単語の日本語訳、および略語の定義を以下に示します。一貫したコミュニケーションと実装のために、これらの定義に従ってください。

| 用語 (Term) | 定義・翻訳 (Definition/Translation) | 備考・使用例 (Notes/Examples) |
| :--- | :--- | :--- |
| User | ユーザー | サービスに登録したアカウント保持者 |
| Session | セッション | ログイン状態を維持するための一時的な認証情報 |
| Session ID | セッションID | セッションを識別する一意の文字列。Cookieに保存 |
| OAuth | OAuth認証 | Google/Appleなどの外部プロバイダーによる認証方式 |
| Password Reset Token | パスワードリセットトークン | パスワードリセット用の一時的な認証トークン。KVに保存（TTL: 1時間） |
| Subscription | サブスクリプション | 定期購読契約 |
| Plan | プラン | 1ヶ月/3ヶ月/6ヶ月の課金プラン |
| Stripe | Stripe | オンライン決済サービス。サブスクリプション管理に使用 |
| Webhook | Webhook | Stripeからの非同期通知。決済完了やキャンセルを通知 |
| Cloudflare Workers KV | KV | Cloudflareのグローバル分散型キーバリューストア。セッション・トークン保存に使用 |
| Hash | ハッシュ化 | パスワードを不可逆的に暗号化する処理 |
| Redirect | リダイレクト | 未認証ユーザーを`/login`へ自動遷移させる処理 |
| Auth Guard | 認証保護 | 認証が必要なページへのアクセスを制御する機能 |
| Profile | プロフィール | ユーザーの登録情報（メール、名前等） |
| Section | サービスを構成する機能単位 | 例: `common`, `authentication`, `profile`, `subscription` |

---

## 6. テスト戦略

**層別テスト方針**:

- **UI層**: Playwrightによるブラウザテスト（`tests/e2e/`）
  - ユーザーインタラクションの検証
  - ページ遷移、フォーム送信、表示内容の確認
  - 認証フローのE2Eテスト（登録 → ログイン → マイページ遷移）
- **純粋ロジック層**: Vitestによる単体テスト（`tests/unit/`）
  - 入出力の検証（副作用なし）
  - エッジケース、境界値テスト
  - パスワードハッシュ化、セッション検証ロジックのテスト
- **副作用層**: モック化したVitestテスト（`tests/integration/`）
  - Stripe API、Cloudflare KV操作のモック検証
  - エラーハンドリングの確認

**カバレッジ目標**:

- **純粋ロジック層（lib）**: 80%以上のラインカバレッジ（セッション管理、パスワードハッシュ化などセキュリティ重要ロジックは100%を目指す）
- **副作用層（data-io）**: モックを用いた主要パスのカバレッジ70%以上

**テストデータ**:

- **配置場所**: `develop/account/{section}/spec.yaml`
- **管理方針**: 実装とテストの値（定数、メッセージテキスト、テストデータ）はspec.yamlで一元管理する
- **モックデータの方針**:
  - テストユーザーデータはspec.yaml内で定義
  - Stripe APIレスポンスのモックデータも定義

---

## 7. エラーハンドリングと例外処理

**エラー境界**:

- **Route層**: Remixの `CatchBoundary` / `ErrorBoundary` を使用
  - 認証失敗時: `/login`へリダイレクト
  - Stripe決済失敗時: エラーメッセージ表示とリトライ促進
  - セッション期限切れ: `/login`へリダイレクト
- **Component層**: エラー状態の表示方法（インライン表示、フォーム検証エラー）

**セキュリティ関連のエラーハンドリング**:

- **パスワード誤り**: 「メールアドレスまたはパスワードが正しくありません」（どちらが誤りか特定させない）
- **既存メールアドレス**: 「このメールアドレスは既に登録されています」
- **セッション不正**: 即座にログアウトし、`/login`へリダイレクト

**ユーザー通知**:

- **エラーメッセージの表示方法**: フォーム下部にインライン表示
- **ログ出力ポリシー**: 本番環境では認証エラーの詳細をログ出力（セキュリティ監査用）、ユーザーには汎用的なメッセージを表示

---

## 8. 命名規約

**ファイル命名**:

- **コンポーネント**: PascalCase（例: `LoginForm.tsx`, `AccountLayout.tsx`）
- **ロジック**: camelCase（例: `hashPassword.ts`, `validateSession.ts`）
- **定数ファイル**: camelCase（例: `constants.ts`）
- **サーバー専用ファイル**: `.server.ts` サフィックスを付与（例: `createUser.server.ts`）

**変数・関数命名**:

- **変数**: camelCase（例: `userId`, `isAuthenticated`）
- **定数**: UPPER_SNAKE_CASE（例: `SESSION_COOKIE_NAME`, `PASSWORD_MIN_LENGTH`）
- **関数**: camelCase、動詞で始める（例: `createSession`, `verifyPassword`）
- **型・インターフェース**: PascalCase（例: `User`, `SessionData`, `SubscriptionPlan`）

**プロジェクト固有の命名パターン**:

- **Routeファイル**: Flat Routes規則に従う
  - `/login`: `app/routes/login.tsx`
  - `/account`: `app/routes/account._index.tsx`
  - `/account/settings`: `app/routes/account.settings.tsx`
- **Componentディレクトリ**: `app/components/account/<section>/`
- **Libディレクトリ**: `app/lib/account/<section>/`
- **Data-IOディレクトリ**: `app/data-io/account/<section>/`

---

## 9. ドキュメント完了条件（Definition of Done）

このドキュメントを含む各設計ドキュメントは、以下の条件を満たした時点で完了とみなします：

1. ✅ **リント検証の合格**: `node scripts/lint-template/engine.js` が0件の違反を報告
2. ✅ **必須項目の記載**: テンプレートの`[例: ...]`や`[記述してください]`などのプレースホルダーがすべて実際の内容に置換されている
3. ✅ **用語の一貫性**: 用語集（セクション5）に定義された用語が本文中で一貫して使用されている
4. ✅ **依存ドキュメントとの整合性**: `CLAUDE.md`や`README.md`で定義された原則に矛盾がない
5. ✅ **アーキテクチャ原則の遵守**: 3大層分離、スタイリング憲章などの原則が明示的に反映されている

---

## 10. ドキュメント間の優先順位

設計判断や実装方針に矛盾が生じた場合、以下の優先順位に従います：

1. **最優先**: [`CLAUDE.md`](../../CLAUDE.md) - プロジェクト全体のマスタールール
2. **第2優先**: 本ドキュメント (`GUIDING_PRINCIPLES.md`) - サービス固有の方針
3. **第3優先**: [`func-spec.md`](func-spec.md), [`uiux-spec.md`](uiux-spec.md) - 機能詳細仕様
4. **参考**: [`spec.yaml`](spec.yaml), [`file-list.md`](file-list.md) - 実装詳細

**重要**: 上位のドキュメントに記載されていない事項について、下位のドキュメントで独自に定義することは許可されます。しかし、上位のドキュメントと矛盾する定義は禁止されます。
