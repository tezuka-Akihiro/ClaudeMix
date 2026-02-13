# 修正ガードレール

## CSSガードレール（承認不要で禁止）

以下の修正は**いかなる場合も禁止**。ユーザー承認があっても実施しない。

| 禁止事項 | 理由 | 参照ルール |
|----------|------|------------|
| インラインCSS（`style={{ }}` や `<style>` タグ）の導入 | CSS5層アーキテクチャ破壊 | `.claude/rules/styling/layer5-implementation.md` |
| CSS5層の責務境界を破る変更 | アーキテクチャ破壊 | `.claude/rules/styling/layer1〜5` |
| `!important` の新規追加 | 優先度の管理不能化 | `.claude/rules/styling/layer1-tokens.md` |
| Tailwindユーティリティクラスの直接使用 | Layer 5ルール違反 | `.claude/rules/styling/layer5-implementation.md` |

### CSS5層アーキテクチャの構造

| Layer | ファイル | 責務 |
|-------|----------|------|
| Layer 1 | `app/styles/globals.css` | デザイントークン（CSS変数） |
| Layer 2 | `app/styles/{service}/layer2-*.css` | コンポーネントの見た目（色・サイズ） |
| Layer 3 | `app/styles/{service}/layer3.ts` | コンポーネントの構造（flexbox, grid） |
| Layer 4 | `app/styles/{service}/layer4.ts` | 例外（アニメーション） |
| Layer 5 | `app/components/**/*.tsx` | 実装（定義済みクラスの使用のみ） |

## Viteガードレール（変更にはユーザー承認が必要）

以下の変更は `AskUserQuestion` でユーザーの明示的な承認を得てから実施する。

| 変更対象 | 承認が必要な理由 |
|----------|------------------|
| `vite.config.ts` の `build.manualChunks` ロジック変更 | キャッシュ戦略に影響 |
| `build.target` の変更（現在: es2020） | ブラウザ互換性に影響 |
| `build.cssCodeSplit` の無効化 | CSS分割戦略に影響 |
| `build.minify` 戦略の変更（現在: esbuild） | ビルドパフォーマンスに影響 |
| 新規Viteプラグインの追加 | 依存関係の増加 |
| `rollupOptions` の構造変更 | バンドル戦略全体に影響 |

## 承認フロー判定ルール

```
修正方針の検討
  │
  ├─ ガードレール非抵触の修正案がある
  │   → 承認不要、自動で Phase 3 へ
  │
  └─ ガードレール抵触する修正案のみ
      │
      ├─ CSSガードレール抵触
      │   → 代替案を検討（必ず存在するはず）
      │   → 代替案がない場合はスキップしてレポート
      │
      └─ Viteガードレール抵触
          → AskUserQuestion で承認を取得
          → 承認あり → Phase 3 へ
          → 承認なし → スキップしてレポート
```
