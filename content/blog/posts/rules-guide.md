---
slug: "rules-guide"
title: "claude rules 公式まとめ"
author: "ClaudeMix Team"
publishedAt: "2026-01-21"
category: "Claude Best Practices"
description: "Claude Codeの「Rules」機能の公式ガイド。プロジェクトの規律を自動適用する憲法のような仕組みについて、ディレクトリ構造による管理、パスベースの適用範囲設定、そしてAIの判断基準を最適化する運用のベストプラクティスを解説します。"
tags: ["rules"]

---

Claude Codeにおいて、開発効率とコード品質を劇的に向上させる機能が **Rules（ルール）** です。
これまでの `CLAUDE.md` による一括管理から、`.claude/rules/` ディレクトリを活用した「モジュール化された規律の強制」へと進化しました。

## 1. Rules とは：プロジェクトの「自動適用される憲法」

Rulesは、Claudeが特定のファイルやディレクトリを操作する際、**常に遵守しなければならない制約**を定義する仕組みです。

* **モジュール化**: 巨大な指示ファイルを分割し、トピックごとに管理できます。
* **自動ロード**: 起動時に `.claude/rules/` 内の全Markdownファイルが自動的にコンテキストへ読み込まれます。
* **パスベースの適用**: 「特定のディレクトリだけに適用するルール」を精密に設定できます。

## 2. Rules の階層構造と優先順位

ルールは以下の順序でロードされ、より具体的な（プロジェクトに近い）場所にあるファイルが優先されます。

1. **User Rules** (`~/.claude/rules/`): 自分のPC上の全プロジェクトに一律で適用したい個人設定。
2. **Project Rules** (`./.claude/rules/`): リポジトリに含め、チーム全員で共有するプロジェクト固有の規約。

## 3. 実践：特定のパスにルールを限定する

YAML Frontmatterの `paths` フィールドを使用することで、ルールを適用する範囲を限定（スコープ）できます。

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "lib/database/**/*"
---

# API & DB 開発ルール
- すべてのエンドポイントに Zod によるバリデーションを必須とする。
- 直接的な SQL クエリは禁止し、必ず Prisma クライアントを使用すること。
- エラーレスポンスはプロジェクト標準の `APIResponse` 型を継承させること。

```

### サポートされるパターン

| パターン | 一致するファイル |
| --- | --- |
| `**/*.ts` | プロジェクト内の全てのTypeScriptファイル |
| `src/components/*.tsx` | 特定ディレクトリ直下のReactコンポーネント |
| `src/**/*.{ts,tsx}` | `src` 配下の `.ts` および `.tsx` ファイル（ブレース展開） |

## 4. ルールの組織化：ディレクトリによる構造化

プロジェクトが大規模な場合は、`.claude/rules/` 内にサブディレクトリを作成して整理できます。これらは再帰的にすべて探索・ロードされます。

* `.claude/rules/frontend/react.md`
* `.claude/rules/backend/api.md`
* `.claude/rules/security/guidelines.md`

また、**シンボリックリンク**もサポートされているため、社内標準のルールセットを複数のリポジトリで共有することも可能です。

## 5. Rules 運用のベストプラクティス

* **関心の分離**: `testing.md`, `style.md` のように、一つのファイルには一つのトピックだけを記述すると、AIの理解精度が向上します。
* **具体性の確保**: 「読みやすいコード」といった曖昧な表現ではなく、「2スペースインデント」「早期リターンを優先」など、定量的・具体的な指示を記述します。
* **定期的なメンテナンス**: プロジェクトのフェーズや技術選定の変化に合わせて `/memory` コマンドで内容を更新し、常にClaudeの判断基準を最適化してください。

---

**Tips**:
現在どのルールが適用されているかを確認するには、Claude Code内で `/memory` コマンドを実行してください。適用中のファイル一覧と、適用範囲（パス）を一目で把握できます。

---

## 6. SsoT（Single Source of Truth）推進のためのSpec Loader ルール

### 背景：なぜSsoTが必要なのか

プロジェクトの寿命は開発サイクルの高速化によって延びます。この関係は以下のように連鎖しています。

```text
プロジェクトの寿命
    ↑
開発サイクルの高速化
    ↑
自動テストの信頼性
    ↑
ドキュメントの鮮度
    ↑
実装 = テスト = ドキュメント の整合性
```

この整合性を保つための解決策が **Spec Loader システム** です。

### Spec Loader の原則

`app/specs/` 配下の `*-spec.yaml` ファイルを**唯一の値の源泉**とし、実装とテストはこのファイルをロードして使用します。

```typescript
// 実装側（サーバー）
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';

const postsSpec = loadSpec<BlogPostsSpec>('blog/posts');
const projectSpec = loadSharedSpec<ProjectSpec>('project');
```

```typescript
// テスト側
import { loadSpec, loadSharedSpec } from 'tests/utils/loadSpec';

const spec = await loadSpec('blog', 'posts');
const sharedSpec = await loadSharedSpec('project');
```

**重要**: テストデータは spec ファイルに含めません。

---

## 7. SsoT チェック項目

### 7.1 設計ドキュメント

| チェック項目 | ✅ 推奨 | ❌ 禁止 |
| ----------- | ------ | ------ |
| 数値・具体値の記述 | 「複数の記事」「一定期間」 | 「6件の記事」「30日間」 |
| spec参照の注意書き | 記述しない | 「詳細はspec.yamlを参照」 |
| 抽象的表現 | 「リスト形式で表示」 | 「ul/li タグで表示」 |

**理由**: specファイルを変更しても、設計ドキュメントを更新する必要がない状態を維持するため。

### 7.2 テスト

| チェック項目 | ✅ 推奨 | ❌ 禁止 |
| ----------- | ------ | ------ |
| テストデータ | 原則使用しない | テストデータのハードコード |
| spec loader | `tests/utils/loadSpec.ts` を使用 | 直接YAMLをパース |
| 記事テストデータ | `test-e2e-*.md` のみ使用 | 本番記事をテストデータに |
| CSSアサート | 禁止 | `expect(element).toHaveStyle()` |
| データ検証 | specの存在・構造を確認 | 具体的な値をアサート |

```typescript
// ✅ 推奨: specの存在を確認
const spec = await loadSpec('blog', 'posts');
expect(spec.categories).toBeDefined();
expect(spec.categories.length).toBeGreaterThan(0);

// ❌ 禁止: 具体的な値をアサート
expect(spec.categories[0].name).toBe('Claude Best Practices');
```

**テストデータが必要な場合**: オペレータの許可を得てハードコードしてください。

### 7.3 実装

| チェック項目 | ✅ 推奨 | ❌ 禁止 |
| ----------- | ------ | ------ |
| リテラル値 | spec loaderから取得 | ハードコード |
| UIテキスト | `spec.messages.error.xxx` | `"エラーが発生しました"` |
| セレクタ | `spec.ui_selectors.xxx` | `"[data-testid='xxx']"` |
| ビジネスルール | `spec.business_rules.xxx` | マジックナンバー |

```typescript
// ✅ 推奨
const spec = loadSpec<BlogPostsSpec>('blog/posts');
const perPage = spec.business_rules.load_more.posts_per_load;

// ❌ 禁止
const perPage = 6;
```

**例外**: コードが著しく複雑になる場合はオペレータに相談してください。

### 7.4 Spec ファイル

| チェック項目 | ✅ 推奨 | ❌ 禁止 |
| ----------- | ------ | ------ |
| サービス共通設定 | `common-spec.yaml` に集約 | 各セクションで重複定義 |
| 値の組み合わせ | anchor/alias で表現 | 同じ値を複数箇所に記述 |
| CSS | CSSアーキテクチャで管理 | spec ファイルに記述 |
| anchor命名 | `_` プレフィックス | 短い名前（`&x`） |

```yaml
# ✅ 推奨: anchor/alias で再利用
_templates:
  _field_base: &field_base
    required: true
    disabled: false

forms:
  email:
    <<: *field_base
    type: "email"

# ❌ 禁止: CSS記述
ui_styles:
  button:
    background: "#007bff"  # CSSアーキテクチャで管理すべき
```

**参考**: YAML参照機能の詳細は `docs/boilerplate_architecture/YAML_REFERENCE_GUIDE.md` を参照。

---

## 8. Spec Loader の使い分け

### サーバー側（実装）

```typescript
// app/spec-loader/specLoader.server.ts
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';

// 機能固有のspec
const postsSpec = loadSpec<BlogPostsSpec>('blog/posts');

// 共通spec
const projectSpec = loadSharedSpec<ProjectSpec>('project');
```

### テスト側

```typescript
// tests/utils/loadSpec.ts
import { loadSpec, loadSharedSpec, loadTestArticles } from 'tests/utils/loadSpec';

// 機能固有のspec（非同期）
const spec = await loadSpec('blog', 'posts');

// 共通spec（非同期）
const sharedSpec = await loadSharedSpec('project');

// テスト専用記事
const testArticles = await loadTestArticles();
```

---

## 9. SsoT 違反の検出と修正

### よくある違反パターン

1. **ハードコードされたメッセージ**
   ```typescript
   // ❌ 違反
   return json({ error: "記事の取得に失敗しました" });

   // ✅ 修正
   const spec = loadSpec<BlogPostsSpec>('blog/posts');
   return json({ error: spec.messages.error.fetch_failed });
   ```

2. **マジックナンバー**
   ```typescript
   // ❌ 違反
   const items = posts.slice(0, 6);

   // ✅ 修正
   const spec = loadSpec<BlogPostsSpec>('blog/posts');
   const items = posts.slice(0, spec.business_rules.load_more.initial_load);
   ```

3. **テストでの具体値アサート**
   ```typescript
   // ❌ 違反
   expect(categories).toContain('Claude Best Practices');

   // ✅ 修正
   const spec = await loadSpec('blog', 'posts');
   expect(categories).toContain(spec.categories[0].name);
   ```

### 修正の優先順位

1. 実装のハードコード → 即座に修正
2. テストの具体値 → specへの参照に変更
3. 設計ドキュメントの具体値 → 抽象表現に修正
