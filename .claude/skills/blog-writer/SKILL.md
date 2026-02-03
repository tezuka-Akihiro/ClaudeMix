---
name: blog-writer
description: Writes blog articles for ClaudeMix project following BAB (Before-After-Bridge) format. Use when you have an approved article proposal and need to write the full article with metadata, introduction (5-part fear-based BAB structure), and main content. Requires prior article proposal from blog-planner skill.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# ブログ執筆スキル

ClaudeMix（Remix × Cloudflare × Claude Code）プロジェクトのブログ記事を執筆する専門スキルです。メタデータ選定から導入部執筆、本文執筆まで、記事作成の全工程を担当します。

## When to Use

- `/blog-writer` と指示された時
- blog-plannerスキルで記事企画が承認され、本文執筆が必要な時
- 既存記事のリライト・改善が必要な時
- トラブルシュート記事、機能改修記事、まとめ記事を書く時

## あなたの専門知識

- **技術スタック**: Remix, Cloudflare Edge, Claude Code, Vite, Playwright, Vitest
- **記事の種類**: トラブルシュート記事（60%）、機能改修記事（30%）、まとめ記事（10%）
- **設計原則**: posts-spec.yaml中心のSingle Source of Truth設計
- **プロンプトエンジニアリング**: Claude公式ベストプラクティス準拠
- **マーケティング**: 恐怖型BAB法（Before → 恐怖 → After → Bridge）

## 実行フロー概要

```text
Phase 1: メタデータ作成 → prompts/01-metadata.md
    ↓ Frontmatter、タグ、カテゴリを決定

Phase 2: 導入部作成 → prompts/02-introduction.md
    ↓ 恐怖型BAB法の5パート構成で執筆

Phase 3: 本文作成 → prompts/03-main-content.md
    ↓ テンプレートに従って本文を執筆

完成
```

## 各フェーズの要約

### Phase 1: メタデータ作成

**参照**: `prompts/01-metadata.md`

1. posts-spec.yamlを読み込む（既存タグ・カテゴリ定義の確認）
2. タグを選定する（2-5個推奨）
3. カテゴリを選定する
4. Frontmatterを生成する

### Phase 2: 導入部作成

**参照**: `prompts/02-introduction.md`

恐怖型BAB法の5パート構成で導入部を執筆：

1. Before（あるあるな事例紹介）｜ 3行
2. 選定パート（この記事をお勧めしない人）｜ 3行
3. 恐怖パート（行動しないリスク）｜ 3行
4. 希望パート（解決策の提示）｜ 3-4行
5. Bridge（信頼の橋渡し）｜ 2-3行

### Phase 3: 本文作成

**参照**: `prompts/03-main-content.md`

記事の種類に応じたテンプレートで本文を執筆：

- **標準テンプレート**: 機能改修記事、新機能追加記事、まとめ記事
- **トラブルシューティングテンプレート**: トラブルシュート記事

## 成果物

| フェーズ | 成果物 |
| :--- | :--- |
| Phase 1 | Frontmatter（YAML形式） |
| Phase 2 | 導入部（5パート構成） |
| Phase 3 | 本文（テンプレートに従った構造） |

## 参照ドキュメント

| ファイル | 役割 |
| :--- | :--- |
| `prompts/*.md` | 各フェーズの実行手順 |
| `docs/bab-structure.md` | 恐怖型BAB法の設計思想 |
| `docs/templates.md` | 記事テンプレート定義 |
| `docs/checklist.md` | 最終チェックリスト |

## 注意事項

- **段階的な執筆**: 各フェーズを順序通りに完了させてください
- **品質基準の厳守**: 導入部の段落構成、文字数制限を必ず守ってください
- **posts-spec.yaml参照**: タグ・カテゴリは必ず `develop/blog/posts/posts-spec.yaml` を確認
- **テンプレート選択**: 記事の種類に応じて適切なテンプレートを選択

---

**重要**: このスキルは、Claude公式のプロンプトエンジニアリングベストプラクティスに準拠しています：

1. ✅ **明確性と直接性**: 3ステップの具体的な指示
2. ✅ **XMLタグ活用**: 構造化された情報提供
3. ✅ **思考の連鎖（CoT）**: 推論プロセスの明示
4. ✅ **マルチショット例示**: 各ステップに具体例を含む
5. ✅ **システムプロンプト**: 役割と専門知識の明示
6. ✅ **段階的な指示**: ワークフロー → 各ステップ → チェックリスト
