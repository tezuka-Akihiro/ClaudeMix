# Phase 4: コミット & push & 再測定

あなたは **Deployer** です。

Phase 3 の修正をコミット・pushし、デプロイ後に PSI 再測定を行う。

## 🎯 目的

修正をリモートに push し、デプロイ完了後に PSI 自動再測定でスコアを確認する。

## 📋 成果物

- コミット & push 完了
- PSI 再測定結果レポート

## ⚙️ 実行手順

### ステップ 1: 品質チェック & コミット & push

1. 品質チェックを実行（全て通過必須）:
   - `npm run typecheck` - TypeScript型検証
   - `npm test -- --run` - ユニットテスト
   - `npm run lint:all` - 全リンター（Markdown, Blog Metadata, CSS Architecture, Template）
2. 全チェック通過後、変更をコミット
3. リモートに push
4. オペレータに push 完了を通知

### ステップ 2: デプロイ完了確認

オペレータにデプロイ完了を確認する。

### ステップ 3: 再測定の実行

デプロイ完了後、まず Performance のみクイック確認を行い、改善傾向を確認する。

#### ステップ 3a: クイック確認（Performance のみ）

```bash
node scripts/psi-perf-only.mjs
```

- 1行/ページで Performance スコアと5指標を表示（JSON保存なし）
- 明らかに基準未達の場合、フル測定を省略して Phase 1 に戻ることも可能

#### ステップ 3b: フル再測定

クイック確認で改善傾向が見られたら、全4カテゴリのフル測定を実行:

```bash
node scripts/psi-measure.mjs
```

フル測定後、診断サマリーも取得しておく（基準未達時の Phase 2 入力用）:

```bash
node scripts/psi-summary.mjs --latest
```

### ステップ 4: 結果の報告

以下のフォーマットで報告する：

```
## 再測定結果

| ページ | Performance | Accessibility | Best Practices | SEO | 判定 |
|--------|-------------|---------------|----------------|-----|------|
| /blog | 97 ✅ | 100 ✅ | 100 ✅ | 100 ✅ | PASS |

**結果**: X/Y ページが全基準をクリア
```

## ✅ 完了条件

- [ ] 品質チェック通過（typecheck, test, lint:all）
- [ ] コミット & push 完了
- [ ] デプロイ完了確認後の PSI 自動測定が完了

## 🔗 次フェーズ

- 自動測定結果が基準未達 → Phase 1 に戻る
- 全基準達成 → 完了

## ⚠️ ループ制御

- 改善ループ（Phase 1→2→3→4→再測定→Phase 1...）は**最大3回**まで
- 3回ループしても基準未達の場合:
  - 達成できなかった項目をレポート
  - 追加の手動対応が必要な旨をオペレータに報告
  - スキルを終了
