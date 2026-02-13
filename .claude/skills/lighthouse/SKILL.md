---
name: lighthouse
description: Lighthouseスコア改善を実行する。PageSpeed Insights (PSI) APIを使用して自動でスコアを取得し、基準値（Performance≥95, Accessibility=100, Best Practices=100, SEO=100）を下回る場合にガードレールを遵守しながら修正する。Use when Lighthouse scores need improvement or performance optimization is needed.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion
---

# Lighthouse改善スキル

PSI APIを使用して自動でLighthouseスコアを取得し、基準未達時にガードレールを遵守しながらコード修正を行うスキル。

## When to Use

- `/lighthouse` で明示的に呼び出された時
- オペレータからLighthouseスコアの改善依頼があった時
- 機能追加後のパフォーマンス品質確認時

## コアミッション

- **基準値の維持**: 95, 100, 100, 100 を全ページで達成・維持する
- **最小限の修正**: スコア改善に必要最小限の変更のみ実施する
- **ガードレール遵守**: CSSアーキテクチャとVite設定のガードレールを厳守する
- **自動測定の優先**: PSI APIによる自動測定を優先し、オペレータの負担を軽減する

## 実行フロー

```
┌──────────────────┐    全合格    ┌──────────┐
│ Phase 1           │───────────→│  完了     │
│ スコア確認        │             │  レポート  │
│ (API自動取得)     │             └──────────┘
└──────┬───────────┘                  ↑
       │ 基準未達                     │
       ▼                            │
┌─────────────┐                     │
│ Phase 2     │                     │
│ 分析・方針  │                     │
└──────┬──────┘                     │
       │                            │
       ▼                            │
┌─────────────┐                     │
│ Phase 3     │                     │
│ 修正実施    │                     │
└──────┬──────┘                     │
       │                            │
       ▼                            │
┌──────────────────┐                │
│ Phase 4           │               │
│ 品質チェック      │               │
│ + push            │               │
└──────┬───────────┘                │
       │                            │
       ▼                            │
  オペレータに再測定依頼 ───────────┘
```

## フェーズ概要

| Phase | 名前 | 役割 | 成果物 | プロンプト |
|-------|------|------|--------|------------|
| 1 | スコア確認 | Automated Score Receiver | スコアレポート（合否判定） | `prompts/01-measure.md` |
| 2 | 分析・方針 | Performance Analyst | 修正方針書 | `prompts/02-analyze.md` |
| 3 | 修正実施 | Performance Optimizer | 修正済みファイル | `prompts/03-fix.md` |
| 4 | 品質チェック+push | Quality Gate | 品質チェック結果 + 自動再測定 | `prompts/04-verify.md` |

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
| `prompts/01-measure.md` | Phase 1: スコア確認プロンプト |
| `prompts/02-analyze.md` | Phase 2: 分析・修正方針プロンプト |
| `prompts/03-fix.md` | Phase 3: 修正実施プロンプト |
| `prompts/04-verify.md` | Phase 4: 品質チェック+pushプロンプト |
| `docs/thresholds.md` | 基準値・合格ライン定義 |
| `docs/guardrails.md` | 修正ガードレール（CSS/Vite） |
| `docs/paths.md` | 測定対象パスリスト（オペレータ向け） |

## 注意事項

1. **APIによる自動測定**: `scripts/psi-measure.mjs` を使用してPSI APIから自動でスコアを取得する。失敗した場合はオペレータに手動測定を依頼する。
2. **APIキーの確認**: `.dev.vars` または環境変数に `PAGESPEED_API_KEY` が設定されているか確認する。未設定でも動作するが、レート制限により待機時間が長くなる。
3. **デプロイ版が基準**: 本番/プレビュー環境のスコアが正式な判定対象
3. **ループ上限**: 改善ループは最大3回まで。3回で基準未達の場合はレポートして終了
4. **修正範囲**: Lighthouseスコア改善に直接関係する修正のみ実施。無関係なリファクタリングは行わない
5. **レポート必須**: 各Phaseの結果は必ずオペレータに報告する
