# 導入部一括更新 作業計画書

## 対象: 3カテゴリ 38記事（1記事は修正済のため除外）

---

## 適用ルール（02-introduction.md より）

| ルール | 内容 |
|--------|------|
| **箇条書き統一** | 選定・恐怖・希望パートは `- テキスト` のマークダウン箇条書き。☠/✅等の絵文字装飾は出力に含めない |
| **恐怖見出し** | 「危険です」「危ない」「危険」を使わず、現象で間接的に表現 |
| **恐怖本文** | 「怖い」「危険」「危ない」を避け、起こる事象の描写で恐怖を伝える |
| **メタ説明禁止** | 「（リスクの兆候）」等のカッコ書き構造説明を含めない |
| **5パート構成** | Before → 選定 → 恐怖 → 希望 → Bridge の順序厳守 |

---

## Batch 1: 絵文字・ダッシュ修正（3記事）

最も機械的な修正。`☠ ` / `✅ ` で始まる行を `- ` に変換 + 恐怖見出し修正。

| # | ファイル | 修正内容 |
|---|---------|---------|
| 1 | `auth-foundation-web-standards.md` | `☠ `→`- `, `✅ `→`- `, 選定パートに`- `追加, 恐怖見出し「AIの暴走と部分最適化は危険です」→間接表現に変更 |
| 2 | `claude-md-refactoring.md` | `☠ `→`- `, `✅ `→`- `, 恐怖バレット間の空行削除, 恐怖見出し→間接表現 |
| 3 | `thumbnail-repository-decoupling.md` | `✅ `→`- `, 恐怖パート段落→箇条書き化 |

---

## Batch 2a: Lighthouse シリーズ（6記事）

恐怖見出し修正 + 段落→箇条書き変換。同テーマなので一括処理。

| # | ファイル | 主な修正 |
|---|---------|---------|
| 4 | `lighthouse-99-not-100-optimization-strategy.md` | 恐怖見出し→間接表現（既に箇条書きの可能性あり、要確認） |
| 5 | `lighthouse-auth-impact-results.md` | 恐怖見出し + 恐怖/希望段落→箇条書き |
| 6 | `lighthouse-css-optimization-route-splitting.md` | 同上 |
| 7 | `lighthouse-impact-assessment-after-auth.md` | 同上 |
| 8 | `lighthouse-javascript-optimization-challenges.md` | 同上 |
| 9 | `lighthouse-mobile-optimization-perfect-score.md` | 同上 |

---

## Batch 2b: Remix/Cloudflare シリーズ（5記事）

| # | ファイル | 主な修正 |
|---|---------|---------|
| 10 | `cloudflare-pages-deployment-challenge.md` | 恐怖見出し + 恐怖/希望段落→箇条書き |
| 11 | `cloudflare-workers-shiki-build-time-html.md` | 同上 |
| 12 | `cloudflare-pages-custom-domain-migration.md` | 導入部が非標準の場合は5パート構成で新規作成 |
| 13 | `remix-cloudflare-workers-ogp-generation.md` | 恐怖見出し + 段落→箇条書き |
| 14 | `remix-resource-route-ogp-wasm-issue.md` | 同上 |

---

## Batch 2c: テスト/AI シリーズ（4記事）

| # | ファイル | 主な修正 |
|---|---------|---------|
| 15 | `ai-remix-react-history-ssr.md` | 恐怖見出し「AIの「正しいコード」を信じると危険です」→間接表現, 恐怖/希望段落→箇条書き |
| 16 | `e2e-test-wait-for-timeout-banned.md` | 恐怖見出し「「1秒待機」を放置すると危険です」→間接表現, 段落→箇条書き |
| 17 | `e2e-test-wrangler-windows-token-waste.md` | 恐怖見出し + 段落→箇条書き |
| 18 | `remix-vite-import-meta-glob-debug.md` | 同上 |

---

## Batch 2d: その他の記録・考察（5記事）

| # | ファイル | 主な修正 |
|---|---------|---------|
| 19 | `stripe-agent-runaway-incident.md` | 恐怖/希望段落→箇条書き（恐怖見出しはOK） |
| 20 | `stripe-payment-review-survival-strategy.md` | 恐怖見出し + 選定/恐怖/希望の箇条書き化 |
| 21 | `remix-css-loading-issue.md` | 恐怖見出し + 段落→箇条書き |
| 22 | `blog-metadata-lint-system.md` | 恐怖見出し + 段落→箇条書き |
| 23 | `jamstack-prebuild-architecture.md` | 恐怖見出し「このままでは危険です」→間接表現, 段落→箇条書き |

---

## Batch 3: リファクタリングシリーズ（7記事）

同一テーマの連作。一括で統一的に修正。

| # | ファイル | 主な修正 |
|---|---------|---------|
| 24 | `refactoring-typescript-types-with-ai.md` | 恐怖見出し「このままでは危険です」→間接表現, 段落→箇条書き |
| 25 | `refactoring-typescript-types-domain-knowledge.md` | 同上 |
| 26 | `refactoring-typescript-types-separation-of-concerns.md` | 同上 |
| 27 | `refactoring-typescript-types-single-source-of-truth.md` | 同上 |
| 28 | `refactoring-typescript-types-final-touches.md` | 同上 |
| 29 | `refactoring-typescript-types-summary.md` | 同上 |
| 30 | `refactoring-single-source-of-truth.md` | 同上 |
| 31 | `react-hooks-cloudflare-workers-challenge.md` | 恐怖見出し + 段落→箇条書き |

---

## Batch 4: ガイド記事 新規導入部作成（7記事）

導入部が存在しないため、5パートBAB構成を新規作成。`freeContentHeading` も追加。

| # | ファイル | 作業内容 |
|---|---------|---------|
| 32 | `CLAUDEmd-guide.md` | 5パートBAB導入部を新規作成, freeContentHeading追加 |
| 33 | `best-practices.md` | 同上 |
| 34 | `mcp-guide.md` | 同上 |
| 35 | `prompts-guide.md` | 同上 |
| 36 | `rules-guide.md` | 同上 |
| 37 | `skills-guide.md` | 同上 |
| 38 | `subagent-guide.md` | 同上 |

---

## 修正パターンの具体例

### パターンA: 恐怖見出し修正

```diff
- ### このままでは危険です
+ ### 蓄積される「見えないパフォーマンス負債」
```

### パターンB: 段落→箇条書き（恐怖パート）

```diff
- 古いアーキテクチャを使い続けることで、あなたのサイトには「技術的負債」が蓄積されます。
- やがて、GoogleのCore Web Vitals更新をきっかけに検索順位が急落するでしょう。
- ついに、ユーザーはサイトの遅さに耐えきれず離脱し、"デジタル廃墟"と化すかもしれません。
+ - 古いアーキテクチャを使い続けると、サイトには「技術的負債」が静かに蓄積されていく。
+ - GoogleのCore Web Vitals更新をきっかけに検索順位が急落し、これまであったアクセスが激減する。
+ - ユーザーはサイトの遅さに耐えきれず離脱し、サイトは誰にも見向きもされなくなる。
```

### パターンC: 絵文字削除 + ダッシュ追加

```diff
- ☠ AIは「目の前のエラー解消」に忠実だが、設計の歪みを無視する
- ✅ この記事を読めば、ライブラリ依存を捨てる明るい未来があります
+ - AIは「目の前のエラー解消」に忠実だが、設計の歪みを無視する
+ - この記事を読めば、ライブラリ依存を捨てる明るい未来があります
```

---

## 検証戦略

### 各バッチ完了後

```bash
npm run lint:all
```

### 全バッチ完了後

```bash
npm run lint:all && npm run typecheck && npm test
```

### 手動確認項目

- [ ] 恐怖見出しに「危険」「危ない」が残っていないこと
- [ ] 恐怖/希望/選定パートが `- ` で始まる箇条書きであること
- [ ] ☠/✅ が出力テキストに残っていないこと
- [ ] `freeContentHeading` が正しい見出しを指していること

---

## Git 戦略

現在のブランチ `stg0210` 上で作業。バッチごとにコミット。

```
fix(blog): batch1 - emoji/dash intro format fixes
fix(blog): batch2a - lighthouse series intro standardization
fix(blog): batch2b - remix/cloudflare series intro standardization
fix(blog): batch2c - testing/ai series intro standardization
fix(blog): batch2d - misc articles intro standardization
fix(blog): batch3 - refactoring series intro standardization
feat(blog): batch4 - add BAB introductions to guide articles
```

---

## 除外記事

- `hierarchical-spec-merge-ssot.md` — 本ブランチで既に修正済み（ゴールドスタンダード）
