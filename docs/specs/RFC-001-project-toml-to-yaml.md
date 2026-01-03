# RFC-001: project.toml から project.yaml への移行

**ステータス**: 提案
**作成日**: 2026-01-03
**優先度**: 最高
**Phase**: 1

---

## 変更の概要

`scripts/project.toml` を YAML 形式に変換し、`app/specs/shared/project-spec.yaml` として再配置することで、プロジェクト全体の設定フォーマットを YAML に統一する。

---

## 背景と目的

### 現状の問題

1. **フォーマットの分断**
   - specファイル: YAML（7ファイル、2,019行）
   - プロジェクト設定: TOML（1ファイル）
   - パーサーライブラリ: `js-yaml` + `@iarna/toml`

2. **セキュリティリスク**
   - TOMLパーサー（`@iarna/toml`）の脆弱性リスク
   - パッケージメンテナンス状況の不透明性

3. **保守コスト**
   - 異なるフォーマット間での移動が困難
   - 開発者が2つの構文を理解する必要

### 目的

1. **セキュリティ向上**: TOMLパーサー依存を排除
2. **保守性向上**: YAML統一によるフォーマット一貫性
3. **拡張性確保**: 将来のサービス横断spec導入の基盤整備

---

## 変更内容

### 1. ファイル移行

**移行元**:
```
scripts/project.toml
```

**移行先**:
```
app/specs/shared/project-spec.yaml
```

**フォーマット変換例**:

```toml
# 変更前: scripts/project.toml
project_name = "New Remix Project"
service_name = "My Awesome App"
concept = "このプロジェクトのコンセプトを記述します"

[references]
world_view_site_url = "https://remix.run"
app_url = "https://zenn.dev/topics/blog"

[services.blog]
name = "ブログ"
description = "Remixとclaude code専用のブログ"
doc_path = "develop/blog/GUIDING_PRINCIPLES.md"

  [services.blog.sections.common]
  name = "Common Components"
  abstract_purpose = "サービス全体のページレイアウトと..."
```

```yaml
# 変更後: app/specs/shared/project-spec.yaml
metadata:
  version: "1.0.0"
  migrated_from: "scripts/project.toml"
  migration_date: "2026-01-03"

project:
  name: "New Remix Project"
  service_name: "My Awesome App"
  concept: "このプロジェクトのコンセプトを記述します"
  target: "このプロジェクトのターゲットユーザーを記述します"
  value_proposition: "このプロジェクトが提供する価値を記述します"

references:
  world_view_site_url: "https://remix.run"
  app_url: "https://zenn.dev/topics/blog"

services:
  blog:
    name: "ブログ"
    description: "Remixとclaude code専用のブログ"
    doc_path: "develop/blog/GUIDING_PRINCIPLES.md"
    sections:
      common:
        name: "Common Components"
        abstract_purpose: "サービス全体のページレイアウトと、共有コンポーネント（ヘッダー、フッターなど）の設計・実装を管理する。"
        specific_purpose: "サービス全体のページコンテナのレイアウトを定義し、その中に配置されるヘッダーとフッターの機能とUIを実装する。"
        input: "ワイヤーフレームで定義された全体レイアウト構造"
        processing: "共通コンポーネントの詳細設計を行い、TDDプロセスに従って実装する。"
        output: "app/components/blog/配下に配置された共通UIコンポーネント"
        doc_path: "develop/blog/common/func-spec.md"
      posts:
        name: "Articles"
        abstract_purpose: "投稿されたブログ記事を時系列で一覧表示する。"
        specific_purpose: "記事のタイトル、投稿日、概要などをリスト形式で表示し、各記事へのリンクを提供する。"
        input: "記事データのリスト"
        processing: "記事データをページネーションと共に表示する。"
        output: "記事一覧UIコンポーネント"
        doc_path: "develop/blog/posts/func-spec.md"
      post-detail:
        name: "記事詳細ページ"
        abstract_purpose: "個別のブログ記事の詳細を表示し、サブスクリプション状態に応じたアクセス制御を行う。"
        specific_purpose: "記事のタイトル、本文、投稿日、著者などの詳細情報を表示するページを実装する。note型の「導入部分は公開、本編は会員限定」という表示制御を行い、未契約ユーザーには購読促進UIを表示する。"
        input: "記事のIDまたはスラッグ、ユーザーのサブスクリプション状態"
        processing: "指定された記事データを取得し、マークダウンをHTMLに変換して整形・表示する。サブスクリプション状態に基づいて記事の可視範囲を判定し、未契約ユーザーにはペイウォールを表示する。"
        output: "記事詳細UIコンポーネント、部分表示UI、購読促進バナー"
        doc_path: "develop/blog/post-detail/func-spec.md"

  account:
    name: "アカウント"
    description: "会員登録、認証、プロフィール管理、サブスクリプション管理を提供するアカウントシステム"
    doc_path: "develop/account/GUIDING_PRINCIPLES.md"
    sections:
      common:
        name: "Common Components"
        abstract_purpose: "アカウントサービス全体のページレイアウト、セッション管理基盤、認証保護、共有UIコンポーネントの設計・実装を管理する。"
        specific_purpose: "/account配下の全ページで共有されるレイアウトコンテナを定義し、Cloudflare Workers KVを使ったセッション管理ユーティリティを提供する。さらに、認証が必要なページの保護機能、ナビゲーション、フォーム部品、エラー表示などの共通UIコンポーネントを実装する。"
        input: "ワイヤーフレームで定義された/account配下のレイアウト構造、認証要件"
        processing: "共通コンポーネントとセッション管理ユーティリティの詳細設計を行い、TDDプロセスに従って実装する。Cloudflare Workers KVからのセッション取得・検証機能を提供する。"
        output: "app/components/account/common/配下に配置された共通UIコンポーネント、app/lib/account/common/配下のセッション管理ユーティリティ、認証保護付きレイアウト"
        doc_path: "develop/account/common/func-spec.md"
      authentication:
        name: "Authentication"
        abstract_purpose: "ユーザーの会員登録、ログイン、ログアウト、OAuth連携を管理する。"
        specific_purpose: "メールアドレス/パスワードによる認証と、Google/Apple OAuthによるソーシャルログインを実装し、ログイン/ログアウト時のセッション生成・破棄を行う。"
        input: "ユーザーの認証情報（メール、パスワード、OAuthトークン）"
        processing: "認証情報の検証、ログイン成功時のセッション生成、ログアウト時のセッション破棄、OAuth認可フローの処理"
        output: "ログイン/ログアウト/会員登録UI、認証結果"
        doc_path: "develop/account/authentication/func-spec.md"
      profile:
        name: "Profile Management"
        abstract_purpose: "ユーザーの登録情報の閲覧・編集・退会処理を管理する。"
        specific_purpose: "/account配下でユーザー自身のプロフィール情報を表示・編集し、パスワード変更や退会処理を実装する。"
        input: "ユーザーID、更新する情報（メール、パスワード等）"
        processing: "プロフィール情報の取得・更新、パスワードのハッシュ化、退会時のデータ削除"
        output: "プロフィール表示・編集UI、退会確認フロー"
        doc_path: "develop/account/profile/func-spec.md"
      subscription:
        name: "Subscription Management"
        abstract_purpose: "Stripeを使った有料プランのサブスクリプション管理を行う。"
        specific_purpose: "1ヶ月/3ヶ月/6ヶ月プランの選択、Stripe Checkoutによる決済、サブスクリプション状態の管理を実装する。"
        input: "プラン選択、Stripe決済情報"
        processing: "Stripe APIとの連携、サブスクリプション状態の同期、Webhookによる更新通知の処理"
        output: "プラン選択UI、決済フロー、サブスクリプション状態表示"
        doc_path: "develop/account/subscription/func-spec.md"
```

### 2. スクリプト変更

**ファイル**: `scripts/generate/scaffold-and-lint.js`

**変更箇所**:

```javascript
// 変更前 (行3-4)
import toml from '@iarna/toml';

// 変更後
import yaml from 'js-yaml';
```

```javascript
// 変更前 (行8)
let projectConfigPath = path.join(process.cwd(), 'scripts', 'project.toml');

// 変更後
let projectConfigPath = path.join(process.cwd(), 'app', 'specs', 'shared', 'project-spec.yaml');
```

```javascript
// 変更前 (行27-36)
function loadProjectConfig() {
  try {
    const content = fs.readFileSync(projectConfigPath, 'utf8');
    return toml.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('プロジェクト設定ファイル (scripts/project.toml) が見つかりません');
    }
    throw error;
  }
}

// 変更後
function loadProjectConfig() {
  try {
    const content = fs.readFileSync(projectConfigPath, 'utf8');
    const parsed = yaml.load(content);

    // YAML構造をTOML互換形式に変換（既存コードとの互換性維持）
    return {
      project_name: parsed.project?.name || '',
      service_name: parsed.project?.service_name || '',
      concept: parsed.project?.concept || '',
      target: parsed.project?.target || '',
      value_proposition: parsed.project?.value_proposition || '',
      references: parsed.references || {},
      services: parsed.services || {}
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('プロジェクト設定ファイル (app/specs/shared/project-spec.yaml) が見つかりません');
    }
    throw error;
  }
}
```

### 3. パッケージ変更

**ファイル**: `package.json`

```json
// 削除
{
  "dependencies": {
    "@iarna/toml": "^2.2.5"  // 削除
  }
}
```

### 4. ディレクトリ構造の変更

```
変更前:
scripts/
├── project.toml          # 削除
└── project.example.toml  # 削除

変更後:
app/specs/shared/
├── project-spec.yaml          # 新規作成
└── project-spec.example.yaml  # 新規作成
```

---

## 影響範囲

### 直接影響

- **ファイル削除**: 2ファイル
  - `scripts/project.toml`
  - `scripts/project.example.toml`

- **ファイル作成**: 2ファイル
  - `app/specs/shared/project-spec.yaml`
  - `app/specs/shared/project-spec.example.yaml`

- **ファイル変更**: 2ファイル
  - `scripts/generate/scaffold-and-lint.js` (約30行変更)
  - `package.json` (1行削除)

### 間接影響

- **なし**: scaffold-and-lint.js の内部実装変更のみで、外部インターフェースは不変

---

## 移行手順

### ステップ1: 新規ファイル作成

```bash
# ディレクトリ作成
mkdir -p app/specs/shared

# TOMLをYAMLに変換して配置
# （手動またはスクリプト使用）
```

### ステップ2: スクリプト変更

```bash
# scaffold-and-lint.js を編集
# （上記「変更箇所」参照）
```

### ステップ3: パッケージ更新

```bash
# tomlパッケージ削除
npm uninstall @iarna/toml

# package-lock.json更新
npm install
```

### ステップ4: 動作確認

```bash
# コード生成テスト
npm run generate -- --type ui --ui-type component --service blog --section posts --name TestComponent

# 生成されたファイルを確認
# app/components/blog/posts/TestComponent.tsx が正しく生成されることを確認

# テスト実行
npm test scripts/generate/scaffold-and-lint.test.js
```

### ステップ5: 旧ファイル削除

```bash
# 動作確認後、旧ファイルを削除
rm scripts/project.toml
rm scripts/project.example.toml
```

---

## テスト計画

### 単体テスト

- **対象**: `scripts/generate/scaffold-and-lint.test.js`
- **追加テストケース**:
  1. YAML読み込みエラー処理
  2. YAML構造のバリデーション
  3. TOML互換形式への変換の正確性

### 統合テスト

- **対象**: `npm run generate` コマンド
- **テストケース**:
  1. 各カテゴリ（ui, lib, data-io, documents）でのファイル生成
  2. サービス/セクション検証の動作
  3. エラーメッセージの正確性

### 手動テスト

- **実施内容**:
  1. 新規コンポーネント生成
  2. 新規lib関数生成
  3. 新規ドキュメント生成
  4. エラーケース（無効なサービス名等）の確認

---

## ロールバック手順

### 緊急時（5分以内）

```bash
# Git revertで変更を取り消し
git revert HEAD

# パッケージ復元
npm install @iarna/toml@^2.2.5
```

### 計画的ロールバック

1. `app/specs/shared/project-spec.yaml` を `scripts/project.toml` に再変換
2. `scripts/generate/scaffold-and-lint.js` を旧バージョンに戻す
3. `@iarna/toml` を再インストール
4. テスト実行で確認

---

## リスクと対策

### リスク1: YAML構造の誤変換

**確率**: 中
**影響度**: 高

**対策**:
- 変換前後でデータの完全性をテストスクリプトで検証
- `scaffold-and-lint.test.js` で全パターンをカバー

### リスク2: 依存スクリプトの見落とし

**確率**: 低
**影響度**: 中

**対策**:
- `project.toml` への参照を事前にgrepで全検索
- CI/CDでの自動テスト実行

### リスク3: 開発者の混乱

**確率**: 中
**影響度**: 低

**対策**:
- CLAUDE.md にYAML移行の記載を追加
- README.md に変更点を明記
- チーム通知（該当する場合）

---

## 成功基準

1. **機能完全性**: 既存のコード生成機能がすべて動作する
2. **テストカバレッジ**: 単体テスト・統合テストが全て通過
3. **パッケージクリーン**: `@iarna/toml` が依存関係から完全に削除される
4. **ドキュメント更新**: CLAUDE.md、README.md が更新される

---

## 次のステップ

このRFC承認後、Phase 2（サービス横断spec基盤の構築）に進む。

- **Phase 2 RFC**: `RFC-002-shared-spec-foundation.md`
- **依存関係**: RFC-001の完了が前提条件
