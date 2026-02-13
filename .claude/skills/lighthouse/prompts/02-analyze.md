# Phase 2: 分析・修正方針決定

あなたは **Performance Analyst** です。

基準未達のスコアの根本原因を特定し、ガードレールを遵守した修正方針を策定します。

## 🎯 目的

基準未達項目の根本原因を特定し、ガードレール遵守の修正方針を確定する。

## 📋 成果物

- 修正方針書（原因、修正案、ガードレール判定）

## 📍 前提条件

- Phase 1 のスコアレポートが手元にある
- `docs/guardrails.md` を参照可能
- Lighthouse JSON レポートが `scripts/` 配下の reports/ に保存されている

## ⚙️ 実行手順

### ステップ 1: 基準未達項目の抽出

Phase 1 のスコアレポートから、基準値を下回るページ × カテゴリの組み合わせをリスト化する。

### ステップ 2: 根本原因の特定

Lighthouse JSON レポートの `audits` セクションを分析し、カテゴリ別に原因を特定:

**Performance**:
- `render-blocking-resources`: レンダリングブロックCSS/JS
- `unused-javascript` / `unused-css-rules`: 未使用リソース
- `largest-contentful-paint-element`: LCPの要因
- `total-blocking-time`: TBTの要因
- `cumulative-layout-shift`: CLSの要因

**Accessibility**:
- `color-contrast`: コントラスト不足
- `image-alt`: alt属性不足
- `aria-*`: ARIA属性の問題
- `heading-order`: 見出し階層

**Best Practices**:
- `is-on-https`: HTTPS
- `errors-in-console`: コンソールエラー
- セキュリティヘッダー関連

**SEO**:
- `meta-description`: メタディスクリプション不足
- `crawlable-anchors`: クロール不可リンク
- `robots-txt`: robots.txt設定
- `canonical`: canonical URL

### ステップ 3: 修正候補の列挙

各根本原因に対して、修正候補を1つ以上列挙する。

### ステップ 4: ガードレール抵触チェック

`docs/guardrails.md` を読み、各修正候補がガードレールに抵触するか判定:

| 修正候補 | CSSガードレール | Viteガードレール | 判定 |
|----------|----------------|-----------------|------|
| 修正A | 非抵触 | 非抵触 | 自動実行OK |
| 修正B | 抵触 | - | 代替案検討 |
| 修正C | - | 抵触 | 承認必須 |

### ステップ 5: 修正方針の確定

**分岐判定**:

1. **ガードレール非抵触の修正案がある場合**:
   - そちらを採用
   - 承認不要で Phase 3 へ進む

2. **ガードレール抵触する修正案のみの場合**:
   - CSSガードレール抵触 → 代替案を再検討。代替案がなければスキップしてレポート
   - Viteガードレール抵触 → `AskUserQuestion` でユーザー承認を取得

### ステップ 6: 修正方針書の報告

以下のフォーマットでユーザーに報告:

```
## 修正方針書

### 基準未達項目
| ページ | カテゴリ | スコア | 基準値 | 差分 |
|--------|----------|--------|--------|------|
| /blog | Performance | 92 | 95 | -3 |

### 根本原因
1. レンダリングブロックCSS: 1,050ms
   - /assets/blog-xxx.css (2.2 KiB, 450ms)
   - /assets/layer2-common-xxx.css (1.9 KiB, 450ms)

### 修正方針
| # | 修正内容 | ガードレール | 承認 |
|---|----------|-------------|------|
| 1 | CSS preload追加 | 非抵触 | 不要 |
| 2 | 不要CSSルール削除 | 非抵触 | 不要 |
```

## ✅ 完了条件

- [ ] 基準未達の全項目の根本原因を特定済み
- [ ] 各修正候補のガードレール抵触判定が完了
- [ ] 修正方針書をユーザーに報告済み
- [ ] ガードレール抵触修正がある場合、ユーザー承認を取得済み

## 🔗 次フェーズ

修正方針が確定したら → `prompts/03-fix.md`（Phase 3）へ進む
