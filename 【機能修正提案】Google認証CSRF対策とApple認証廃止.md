# 【機能修正提案】Google認証CSRF対策とApple認証廃止

- **サービス**: `account`
- **セクション**: `authentication`
- **関連ドキュメント**:
  - `develop/account/authentication/func-spec.md`
  - `app/specs/account/authentication-spec.yaml`

---

## 1. 提案概要

Google OAuth認証のCSRF対策（stateパラメータ検証）を実装し、未実装のApple ID認証を廃止することで、認証システムのセキュリティと保守性を向上させます。

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

- Google OAuth認証でstateパラメータの検証がTODOのままスキップされており、CSRF攻撃に脆弱
- `redirectUri`がコード内にデフォルト値（`http://localhost:8788/...`）としてハードコードされている
- Apple ID認証のルート（`auth.apple.tsx`, `auth.callback.apple.tsx`）が存在するが、プレースホルダーのみで未実装
- `authentication-spec.yaml`にGoogle OAuth関連の定義が存在しない（SSoT原則違反）

### 修正後 (To-Be)

- `auth.callback.google.tsx`でCookieに保存されたstateとGoogleから返されたstateを検証
- 検証成功後、`oauth_state` Cookieを即座に削除
- すべてのOAuth環境変数（`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`）が必須
- Apple ID認証関連ファイルを削除、login.tsxからAppleボタンを削除
- `authentication-spec.yaml`にOAuth設定、エラーメッセージ、DBスキーマ更新を追加

## 3. 背景・目的

### 背景

セキュリティレビューにより、以下の問題が検出されました：

1. **CSRF脆弱性**: stateパラメータの検証がスキップされており、攻撃者がユーザーのアカウントに不正なOAuth認証をバインドできる可能性
2. **設計不整合**: `authentication-spec.yaml`にGoogle OAuth関連の定義がなく、SSoT原則に違反
3. **デッドコード**: Apple ID認証は未実装のプレースホルダーのみで、ユーザーに混乱を与える

### 目的

- **目的1**: CSRF攻撃からの保護を実装し、認証セキュリティを強化
- **目的2**: 未使用のApple ID認証コードを削除し、コードベースを整理
- **目的3**: `authentication-spec.yaml`をSSoTとして更新し、設計と実装の整合性を確保

## 4. 変更の妥当性 (Pros / Cons)

Pros (利点):

- OAuth 2.0のセキュリティベストプラクティスに準拠したCSRF保護
- デッドコード削除によるコードベースの簡素化
- SSoT原則の遵守により、仕様と実装の乖離を防止
- 環境変数の必須化により、設定漏れによる本番環境でのセキュリティリスクを排除

Cons (懸念点):

- Apple ID認証を将来追加する場合、再実装が必要
- 環境変数が未設定の開発環境でOAuth認証が使用不可

**総合評価**:
セキュリティ脆弱性の修正とSSoT原則の遵守という点で、この変更は**非常に妥当性が高い**と判断します。Apple ID認証は元々未実装であり、必要になった時点で適切に実装すべきです。

## 5 設計フロー

### GUIDING_PRINCIPLES.md

変更なし

### func-spec.md

変更なし（将来的にOAuth認証フローの詳細記述を追加すべき）

### uiux-spec.md

変更なし（Appleボタン削除はUI変更だが、spec未記載のため）

### spec.yaml

**編集内容**:
- `oauth`セクションを追加（Google設定、state Cookie設定、Apple無効化）
- `error_messages.oauth`セクションを追加（OAuthエラーメッセージ）
- `database.users`に`password_hash`（名称変更）、`oauth_provider`、`oauth_id`フィールドを追加
- `idx_users_oauth`インデックスを追加

### file_list.md

**編集内容**:
- `auth.apple.tsx`を削除
- `auth.callback.apple.tsx`を削除

### data-flow-diagram.md

変更なし

## 6 TDD_WORK_FLOW.md 簡易版

### e2e-screen-test

`tests/e2e/account/authentication.spec.ts` - Apple認証テストがあれば削除（確認要）

### e2e-section-test

変更なし

### CSS実装 (layer2.css, layer3.ts, layer4.ts)

変更なし

### route

- `app/routes/auth.apple.tsx` - **削除**
- `app/routes/auth.callback.apple.tsx` - **削除**
- `app/routes/auth.google.tsx` - 環境変数チェック強化
- `app/routes/auth.callback.google.tsx` - CSRF検証実装、Cookie削除追加
- `app/routes/login.tsx` - Appleボタン削除

### components.test

変更なし

### components

変更なし

### logic.test

変更なし

### logic

変更なし

### data-io.test

変更なし

### data-io

変更なし

### その他

- `app/specs/account/authentication-spec.yaml` - OAuth設定、エラーメッセージ、DBスキーマ追加

---

## 実装ステータス

**完了**: 2026-02-03

すべての変更はブランチ `claude/google-auth-csrf-fix-9CdyY` にコミット済み。
