# Lighthouse 基準値定義

## スコア基準

| カテゴリ | 基準値 | 判定ルール |
|----------|--------|------------|
| Performance | ≥ 95 | 未満で要改善 |
| Accessibility | = 100 | 未満で要改善 |
| Best Practices | = 100 | 未満で要改善 |
| SEO | = 100 | 未満で要改善 |

## 追加指標（参考値）

| 指標 | 許容範囲 | 説明 |
|------|----------|------|
| 未使用JavaScript増加量 | ≤ +5 KiB | 前回測定比 |
| 未使用CSS増加量 | ≤ +2 KiB | 前回測定比 |
| FCP悪化 | ≤ +0.5s | 前回測定比 |
| LCP悪化 | ≤ +0.5s | 前回測定比 |

## 合否判定

- **全合格**: 全ページ × 全カテゴリが基準値を満たす → Phase 1 で完了
- **基準未達あり**: 1つでも基準値を下回るページがある → Phase 2 へ進む

## スコアレポートフォーマット

```
=== Lighthouse Score Report ===
Page: /blog (mobile)
  Performance: 92 (threshold: 95) FAIL
  Accessibility: 100 (threshold: 100) PASS
  Best Practices: 100 (threshold: 100) PASS
  SEO: 100 (threshold: 100) PASS

=== Summary ===
PASS: 6/8 pages meet all thresholds
FAIL: 2/8 pages below threshold
```
