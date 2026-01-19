---
name: lp-manga
description: LP漫画の企画から品質検証までを一貫して行う製造ライン。要件定義→基本設計→詳細設計→画像生成→品質検証の5フェーズで構成。Geminiでの画像生成を前提とした設計。
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# LP漫画制作スキル

LP（ランディングページ）用漫画の企画・設計・制作を一貫して行うスキルです。

## When to Use

- LP漫画を新規作成したい時
- 「/lp-manga」と指示された時
- 「LP漫画」「ランディングページの漫画」を作りたいと言われた時

## 実行フロー概要

```text
Phase 1: 要件定義 → prompts/01-requirements.md
    ↓
Phase 2: 基本設計 → prompts/02-concept.md
    ↓
Phase 3: 詳細設計 → prompts/03-design.md
    ↓
Phase 4: 画像生成 → prompts/04-generate.md
    ↓
Phase 5: 品質検証 → prompts/05-qa.md
    ↓
完成
```

## 途中再開

「Phase 3から再開」のように指定可能。その場合、前フェーズの成果物が存在することを確認してから開始する。

---

## Phase 1: 要件定義

**参照**: `prompts/01-requirements.md`

1. AskUserQuestionでヒアリング（サービス/ターゲット/ゴール/制約）
2. プロンプト実行 → ペルソナ・ゴール定義書を作成
3. ユーザー確認 → 承認を得てから次へ

---

## Phase 2: 基本設計

**参照**: `prompts/02-concept.md`

1. プロンプト実行 → プロット・トンマナ・デリバリー仕様を作成
2. ユーザー確認 → 承認を得てから次へ

---

## Phase 3: 詳細設計

**参照**: `prompts/03-design.md`

1. キャラクターシート作成（特徴タグ含む）
2. Geminiで三面図を生成
3. 絵コンテ作成（全コマの生成指示）
4. ユーザー確認 → 承認を得てから次へ

---

## Phase 4: 画像生成（Gemini連携）

**参照**: `prompts/04-generate.md`

1. 三面図＋特徴タグを準備
2. 絵コンテの生成指示を順にGeminiへ依頼
3. OK/NG判定 → NGならプロンプト調整して再生成
4. 生成ログをアセット管理表に記録（prompts/04-generate.md参照）

---

## Phase 5: 品質検証

**参照**: `prompts/05-qa.md`

1. チェックリスト実行（構造・コンプライアンス・ストーリー）
2. NG項目があればPhase 4に戻る
3. 全項目クリアで完成

---

## 成果物

| フェーズ | 成果物 |
| :--- | :--- |
| Phase 1 | ターゲット定義書、ゴール定義書 |
| Phase 2 | ストーリープロット、トンマナ定義、デリバリー仕様 |
| Phase 3 | キャラクターシート、三面図、絵コンテ |
| Phase 4 | 画像素材、生成ログ |
| Phase 5 | 検品済み最終素材 |

---

## 参照ドキュメント

| ファイル | 役割 |
| :--- | :--- |
| `prompts/*.md` | AIへの指示（金型） |
| `docs/flow-overview.md` | 全体アーキテクチャの解説 |
| `docs/past-errors.md` | 失敗パターン集 |

---

## 注意事項

- **各フェーズでのユーザー確認は必須** - 確認なしに次へ進まない
- **Geminiの特性** - 三面図＋特徴タグの二重制約でキャラ一貫性を維持
- **失敗パターンの蓄積** - 生成失敗は `docs/past-errors.md` に追記
