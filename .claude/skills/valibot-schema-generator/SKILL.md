---
name: valibot-schema-generator
description: Generate type-safe Valibot validation schemas from YAML spec files when user requests schema generation, form validation setup, or after section-spec.yaml creation. Automatically creates .server.ts files with InferOutput types for Remix forms.
allowed-tools: Read, Write, Bash
---

# Valibot Schema Generator

Generates type-safe Valibot validation schemas from ClaudeMix YAML spec files.

## When to Use

This skill automatically activates when:

- User says: "Generate schema for authentication"
- User says: "Create Valibot schema from spec"
- User says: "Setup form validation for {section}"
- User mentions: "I need schemas for forms"
- After completing `section-spec.yaml` in development flow

## 実行フロー概要

```text
Phase 1: Schema Generation → prompts/01-generate.md
    ↓
完成
```

## Phase 1: Schema Generation

**参照**: `prompts/01-generate.md`

1. Read spec files (section-spec.yaml, validation-spec.yaml)
2. Extract form definitions and validation rules
3. Generate schema file using template
4. Verify output and export types

**自動実行**: このスキルはフェーズ1のみで完結し、ユーザー介入なしで実行されます。

## 成果物

- `app/specs/{service}/{section}-schema.server.ts` - 型安全なValibotスキーマ
- Console log: "✅ Schema generated: {path}"

## 参照ドキュメント

| ファイル | 役割 |
|---------|------|
| `prompts/01-generate.md` | スキーマ生成の実行可能プロンプト |
| `scripts/generate-schema.js` | スキーマ生成の自動化スクリプト |
| `docs/schema-structure.md` | スキーマ構造の詳細仕様 |
| `docs/troubleshooting.md` | トラブルシューティングガイド |
| `docs/examples.md` | 実装例と良い例/悪い例 |
| `templates/schema.server.ts.template` | スキーマテンプレート |

## 注意事項

- 必ず `.server.ts` 拡張子を使用（クライアントバンドル除外）
- エラーメッセージはSpec YAMLから取得（ハードコーディング禁止）
- 生成後は必ず `InferOutput` で型をエクスポート

## Integration with Development Flow

```
📋️ section-spec.yaml
  ↓
🔐 [THIS SKILL] Generate Schema
  ↓
🗂️ file_list.md & 🧬 data-flow-diagram.md
  ↓
🪨 Route implementation with Conform
```

## 関連ドキュメント

- [Migration Guide](../../../docs/boilerplate_architecture/VALIBOT_CONFORM_MIGRATION_GUIDE.md)
- [Skills Guide](../../../content/blog/posts/skills-guide.md)

**Note**: Valibot/Conform の詳細ルールは `.claude/rules/validation/valibot-conform-flow.md` で自動的に適用されます。
