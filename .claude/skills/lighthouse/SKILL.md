---
name: lighthouse
description: Lighthouseスコア測定と改善を実行する。スコアが基準値（Performance≥95, Accessibility=100, Best Practices=100, SEO=100）を下回った場合、ガードレールを遵守しながら自動修正する。Use when Lighthouse scores need checking or performance optimization is needed.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion
---

# Lighthouse改善スキル

Lighthouseスコアの測定、基準値との比較、基準未達時の自動修正、品質チェックを一貫して実行するスキル。

## When to Use

- `/lighthouse` で明示的に呼び出された時
- Lighthouseスコアの測定・改善が必要な時
- 機能追加後のパフォーマンス品質確認時
- Performance、Accessibility、Best Practices、SEO の改善依頼時

## コアミッション

- **基準値の維持**: 95, 100, 100, 100 を全ページで達成・維持する
- **最小限の修正**: スコア改善に必要最小限の変更のみ実施する
- **ガードレール遵守**: CSSアーキテクチャとVite設定のガードレールを厳守する
- **自律的ループ**: 測定→分析→修正→検証のサイクルを基準達成まで繰り返す

## 実行フロー

```
┌─────────────┐    全合格    ┌──────────┐
│ Phase 1     │───────────→│  完了     │
│ 測定        │             │  レポート  │
└──────┬──────┘             └──────────┘
       │ 基準未達                ↑
       ▼                        │
┌─────────────┐                 │
│ Phase 2     │                 │
│ 分析・方針  │                 │
└──────┬──────┘                 │
       │                        │
       ▼                        │
┌─────────────┐                 │
│ Phase 3     │                 │
│ 修正実施    │                 │
└──────┬──────┘                 │
       │                        │
       ▼                        │
┌─────────────┐                 │
│ Phase 4     │─── OK ─────────┘
│ 品質チェック │
└──────┬──────┘
       │ NG
       ▼
    Phase 1へ戻る
```

## フェーズ概要

| Phase | 名前 | 役割 | 成果物 | プロンプト |
|-------|------|------|--------|------------|
| 1 | 測定 | Lighthouse Measurer | スコアレポート | `prompts/01-measure.md` |
| 2 | 分析・方針 | Performance Analyst | 修正方針書 | `prompts/02-analyze.md` |
| 3 | 修正実施 | Performance Optimizer | 修正済みファイル | `prompts/03-fix.md` |
| 4 | 品質チェック | Quality Gate | 品質チェック結果 | `prompts/04-verify.md` |

## ガードレール

修正時に遵守すべき制約。詳細は `docs/guardrails.md` を参照。

- **CSS**: インラインCSS禁止、CSS5層アーキテクチャの構造変更禁止
- **Vite**: `vite.config.ts` のビルド設定変更はユーザー承認必須

### 承認フロー

```
ガードレール非抵触の修正案がある → 承認不要、自動実行
ガードレール抵触する修正案のみ  → AskUserQuestion で承認必須
```

## 参照ドキュメント

| ファイル | 役割 |
|----------|------|
| `prompts/01-measure.md` | Phase 1: 測定実行プロンプト |
| `prompts/02-analyze.md` | Phase 2: 分析・修正方針プロンプト |
| `prompts/03-fix.md` | Phase 3: 修正実施プロンプト |
| `prompts/04-verify.md` | Phase 4: 品質チェックプロンプト |
| `docs/thresholds.md` | 基準値・合格ライン定義 |
| `docs/guardrails.md` | 修正ガードレール（CSS/Vite） |
| `docs/paths.md` | 測定対象パスリスト |
| `scripts/measure.ts` | 自動測定スクリプト |

## 注意事項

1. **devサーバー前提**: 測定には `npm run dev:wrangler`（port 3000）が起動済みであること
2. **ループ上限**: 改善ループは最大3回まで。3回で基準未達の場合はレポートして終了
3. **修正範囲**: Lighthouseスコア改善に直接関係する修正のみ実施。無関係なリファクタリングは行わない
4. **レポート必須**: 各Phaseの結果は必ずユーザーに報告する
