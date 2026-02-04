# 【機能修正提案】認証基盤のRemix_Auth統合

- **サービス**: `account`
- **セクション**: `authentication`, `common`
- **関連ドキュメント**:
  - `develop/account/GUIDING_PRINCIPLES.md`
  - `develop/account/authentication/func-spec.md`
  - `app/specs/account/authentication-spec.yaml`
  - `docs/boilerplate_architecture/AUTH_ARCHITECTURE_REDEFINITION.md`

---

## 1. 提案概要

Google OAuth および通常のメール/パスワード認証を `Remix Auth` ライブラリへ統合し、認証ロジックの安全性向上と統制を実現します。プロジェクトの「3大層分離」および「KV/D1ハイブリッド戦略」を維持するため、ライブラリを副作用層（Data-IO）に隔離し、純粋ロジック層（Lib）を汚染させない疎結合な設計を導入します。

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

- **認証方式**: Google OAuth とフォーム認証がそれぞれの独自ロジックで実装されている。
- **セッション管理**: `saveSession`, `getSession` などの関数による手動管理。状態検証（CSRF等）が散在している。
- **層の境界**: OAuth プロフィールデータ（ライブラリ依存型）が直接扱われており、将来的なライブラリ変更に弱い。
- **ストレージ**: KV/D1 の使い分けはされているが、認証エンジンの統制下にはない。

### 修正後 (To-Be)

- **認証エンジン**: `Remix Auth` を採用し、`GoogleStrategy` および `FormStrategy` に認証・プロトコル処理を委託。
- **副作用層（Data-IO）への隔離**:
    - `authenticator.server.ts` でライブラリを一括管理。
    - `strategies/` 内で各認証方式を定義。
    - **Mapper** を導入し、ライブラリ依存の型をドメインモデルへ即座に変換。
- **純粋ロジック層（Lib）の死守**:
    - `lib` 層は変換済みのドメインモデルのみを受け取り、ビジネスルールの検証に専念。
    - ライブラリ固有のパッケージをインポートしない「ライブラリ非依存原則」の徹底。
- **セッション管理の統合**: `WorkersKVSessionStorage` を通じて `Remix Auth` と Workers KV を連携させ、堅牢なセッションライフサイクル管理を実現。

## 3. 背景・目的

### 背景

1. **セキュリティリスク**: OAuth のプロトコル検証や CSRF 対策を手動で行うと、エッジケースの漏れによる脆弱性が生じやすい。
2. **保守性の低下**: 認証ロジックが独自実装に依存しているため、将来的なプロバイダー追加やセキュリティ要件の変更に対する追従コストが高い。
3. **アーキテクチャの厳格化**: プロジェクトの「3大層分離」を認証という副作用の塊に対しても適用し、スケール可能なコードベースを維持する必要がある。

### 目的

- **安全性**: 実績のある `Remix Auth` に通信・プロトコル部分を委託し、脆弱性を排除する。
- **統制**: 認証フローを一箇所に集約し、セッション管理とストレージ戦略をライブラリの規約に沿って統合する。
- **柔軟性**: `lib` 層をライブラリから切り離すことで、ドメインロジックの再利用性とテスト容易性を向上させる。

## 4. 変更の妥当性 (Pros / Cons)

### Pros (利点)

- プロトコルレベルのバグ（CSRF等）の排除。
- 認証フローの標準化によるコードの可読性向上。
- `lib` 層がピュアに保たれるため、ユニットテストが 100% 容易に実施可能。
- プロバイダー追加（将来的な Apple ID 復活等）が容易。

### Cons (懸念点)

- 既存の独自実装コードの大幅な書き換えが必要。
- `Remix Auth` および各種 Strategy パッケージの依存関係が追加される（副作用層に限定）。

**総合評価**:
セキュリティリスクの回避と、プロジェクトの設計原則（層分離）の長期的な維持という観点から、この刷新は必須かつ極めて妥当であると判断します。

## 5. 設計フロー

### GUIDING_PRINCIPLES.md

**編集内容**:
- 「3大層分離アーキテクチャ」の項目に「ライブラリ非依存原則」を追記。
- データストレージ戦略の「ハイブリッド連携パターン」を、`Remix Auth` と `WorkersKVSessionStorage` を前提としたフローに更新。
- 用語集に `Remix Auth`, `Strategy` を追加。

### func-spec.md

**編集内容**:
- 処理フローを `Remix Auth` の `authenticate` 関数呼び出しを起点とする記述に変更。
- 各認証方式（Form, Google）の Strategy 内での責務（バリデーション、ユーザー検索、マッピング）を明確化。
- パスワードリセット等の周辺機能と `Remix Auth` セッションの整合性（パスワード変更後の全セッション破棄等）を再定義。

### uiux-spec.md

**編集内容**:
- データフロー設計（Route責務）を、`authenticator.authenticate` を中心とした構成図に刷新。
- Google ログインボタンの追加に伴う `LoginForm` の構造図・親子構造の更新。
- Apple ログインボタンの完全削除。

### spec.yaml (authentication-spec.yaml)

**編集内容**:
- `oauth.google` セクションを追加（enabled, scopes, state_cookie設定等）。
- `oauth.apple` を `enabled: false` として明示。
- `database.users` スキーマの更新（`password` → `password_hash` への名称変更、`oauth_provider`, `oauth_id` の追加、インデックス `idx_users_oauth` の追加）。
- `error_messages.oauth` の追加。

### file_list.md

**編集内容**:
- **新規追加**:
    - `app/data-io/account/common/authenticator.server.ts`
    - `app/data-io/account/common/session.server.ts`
    - `app/data-io/account/authentication/strategies/google.server.ts`
    - `app/data-io/account/authentication/strategies/form.server.ts`
    - `app/data-io/account/authentication/mappers/authMapper.server.ts`
- **削除**:
    - `app/routes/auth.apple.tsx`
    - `app/routes/auth.callback.apple.tsx`
    - `app/lib/account/common/createSessionData.ts`（authenticator 内に統合）
    - `app/data-io/account/common/saveSession.server.ts`（session.server に統合）

### data-flow-diagram.md

**編集内容**:
- `Remix Auth` を介した、UI層 -> 副作用層（Strategy/Mapper） -> 純粋ロジック層 -> 副作用層（D1/KV）の循環フローに更新。

---

## 6. TDD_WORK_FLOW.md (Phase 3 実施計画)

本機能修正の信頼性を担保するため、以下の順序でテスト駆動開発を実施します。

### ステップ 1: Data-IO / Session ユニットテスト
- **対象**: `app/data-io/account/common/session.server.ts`
- **内容**:
    - `commitSession` 呼び出し時に Workers KV にデータが保存されること。
    - `destroySession` 呼び出し時に KV からデータが削除されること。
- **検証**: Vitest + Miniflare (KV Mock)

### ステップ 2: Mapper / Pure Logic 結合テスト
- **対象**: `app/data-io/account/authentication/mappers/authMapper.server.ts`
- **内容**:
    - `remix-auth` から返却される多様な Profile 型が、独自の `User` ドメインモデルに正しく変換されること。
    - 無効なデータが渡された際に `lib` 層のバリデーションが正しくトリガーされること。
- **検証**: Vitest

### ステップ 3: Strategy バリデーションテスト
- **対象**: `app/data-io/account/authentication/strategies/form.server.ts`
- **内容**:
    - 不正なメール形式やパスワード不一致時に、適切なエラーメッセージが返却されること。
- **検証**: Vitest

### ステップ 4: E2E 認証フローテスト
- **対象**: `app/routes/login.tsx`, `app/routes/register.tsx`
- **内容**:
    - フォーム入力からログイン成功後のリダイレクト、およびセッション Cookie の発行。
    - ログアウト後のセッション無効化確認。
- **検証**: Playwright (Local Dev Server)
