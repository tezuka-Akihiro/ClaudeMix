# Lighthouse影響調査プロジェクト

ログイン機能導入後のLighthouseスコアへの影響を調査するためのプロジェクトです。

## 📋 プロジェクト概要

### 背景

- **2025-12-18**: ログイン導入前にLighthouse改善を実施
  - モバイルスコア全カテゴリ100点達成
  - CSS最適化で22 KiB削減
  - JavaScript 39 KiBは削減不可（Remix/Viteの設計制約）

- **現在**: ログイン機能を導入
  - ヘッダーにログインボタン追加
  - セッション管理機能の実装
  - 認証ページの追加

### 目的

ログイン機能の追加により、以下の影響を調査する：

1. **公開ページへの影響**（ログイン不要ページ）
   - パフォーマンススコアの維持（95点以上）
   - リソースサイズの増加量（JavaScript +5 KiB以内、CSS +2 KiB以内）

2. **認証ページのパフォーマンス**（ログイン必須ページ）
   - 認証処理のオーバーヘッド
   - ユーザー情報取得のAPIコール影響

3. **改善計画の立案**
   - 問題があれば具体的な改善策を検討
   - ブログ記事として知見を蓄積

## 📁 ファイル構成

```
tests/lighthouse/
├── README.md                    # このファイル（プロジェクト全体の説明）
├── MEASUREMENT_GUIDE.md         # 測定手順の詳細ガイド
├── measurement-checklist.md     # 測定時のチェックリスト
├── LIGHTHOUSE_RESULTS.md        # 測定結果の記録テンプレート
├── measure-lighthouse.ts        # 自動測定スクリプト（参考用）
└── reports/                     # 測定レポートの保存先
    └── (HTMLレポートをここに保存)
```

## 🚀 クイックスタート

### Step 1: 測定環境の選択

**オプションA: ローカル環境**

```bash
npm run dev:wrangler
```

開発サーバーが起動したら、`http://localhost:8788` で測定を実施します。

**オプションB: プレビュー環境（推奨）**

このブランチでpushすると、自動的に以下のURLにデプロイされます：

```
https://claude-lighthouse-impact-ass.claudemix.pages.dev/
```

**テストアカウント**:
- Email: `tizuhanpen8+preview@gmail.com`
- Password: `14801250At`

**推奨理由**: より本番に近い環境で測定でき、ビルド最適化が適用された状態での実測が可能です。

### Step 2: 測定ガイドを確認

[MEASUREMENT_GUIDE.md](./MEASUREMENT_GUIDE.md) を開いて、測定手順を確認してください。

### Step 3: チェックリストに従って測定

[measurement-checklist.md](./measurement-checklist.md) をチェックしながら測定を実施してください。

### Step 4: 結果を記録

[LIGHTHOUSE_RESULTS.md](./LIGHTHOUSE_RESULTS.md) に測定結果を記録してください。

## 📊 測定対象ページ

### 必須（⭐⭐⭐）

| ページ | URL | Device |
|--------|-----|--------|
| ブログ一覧 | http://localhost:8788/blog | Mobile |
| ブログ記事詳細 | http://localhost:8788/blog/welcome | Mobile |

### 推奨（⭐⭐）

| ページ | URL | Device |
|--------|-----|--------|
| ブログ一覧 | http://localhost:8788/blog | Desktop |
| ブログ記事詳細 | http://localhost:8788/blog/welcome | Desktop |
| プロフィール | http://localhost:8788/profile | Mobile |

### 任意（⭐）

| ページ | URL | Device |
|--------|-----|--------|
| トップページ | http://localhost:8788 | Mobile/Desktop |
| アカウント設定 | http://localhost:8788/account/settings | Mobile/Desktop |

## 📈 評価基準

### 合格ライン

- ✅ Performanceスコア ≥ 95点
- ✅ Accessibilityスコア = 100点
- ✅ Best Practicesスコア = 100点
- ✅ SEOスコア = 100点
- ✅ JavaScript増加 ≤ +5 KiB
- ✅ CSS増加 ≤ +2 KiB
- ✅ FCP/LCP悪化 ≤ +0.5s

### 要対応ライン

- ❌ Performanceスコア < 95点 → 原因調査と改善策の検討
- ❌ その他スコア < 100点 → 原因調査と改善策の検討
- ❌ JavaScript増加 > +5 KiB → バンドルサイズの最適化検討
- ❌ CSS増加 > +2 KiB → スタイリングの最適化検討

## 🎯 期待される成果

### 1. 測定レポート

- 各ページのLighthouseスコア
- パフォーマンス指標の詳細データ
- リソースサイズの変化量
- 基準値との比較分析

### 2. 影響評価

- ログイン機能追加による影響範囲の特定
- 許容範囲内かどうかの判定
- 改善が必要な項目のリストアップ

### 3. 改善計画（必要な場合）

- 優先順位付けされた改善項目
- 具体的な改善策の提案
- 実装スケジュールの検討

### 4. ブログ記事（推奨）

- 測定結果の共有
- ログイン導入による影響の分析
- 改善プロセスの記録

## 🔍 参考資料

### プロジェクト内の過去記事

- `content/blog/posts/lighthouse-mobile-optimization-perfect-score.md`
  - モバイルスコア100点達成の記録
- `content/blog/posts/lighthouse-css-optimization-route-splitting.md`
  - CSS最適化の実践記録
- `content/blog/posts/lighthouse-javascript-optimization-challenges.md`
  - JavaScript最適化の壁と学び

### 外部リンク

- [Lighthouse公式ドキュメント](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Lighthouse](https://developer.chrome.com/docs/devtools/lighthouse/)

## ❓ よくある質問

### Q1. 自動測定スクリプトは使えないの？

A: `measure-lighthouse.ts` は環境によってはブラウザクラッシュが発生するため、**手動測定を推奨**しています。より確実で正確な測定ができます。

### Q2. 測定は何回実施すべき？

A: 各ページ・各デバイスで**最低1回**、理想的には**3回測定して平均値**を取ることを推奨します。

### Q3. 認証ページの測定方法は？

A: ログイン後、DevToolsのLighthouseタブで「Clear storage」のチェックを**外してから**測定してください。詳細は `MEASUREMENT_GUIDE.md` を参照してください。

### Q4. スコアが基準値より悪化していたら？

A: まず、**複数回測定**して結果が安定しているか確認してください。安定して悪化している場合は、`LIGHTHOUSE_RESULTS.md` に詳細を記録し、原因調査と改善策の検討を行います。

## 📝 次のステップ

1. ✅ 測定環境の準備（完了）
2. ⬜ 公開ページでの測定実施
3. ⬜ 測定結果の記録と分析
4. ⬜ 認証ページでの測定実施（推奨）
5. ⬜ 影響評価レポートの作成
6. ⬜ 改善計画の立案（必要な場合）
7. ⬜ ブログ記事の作成（推奨）

---

**測定を開始する準備ができました！**

まずは [MEASUREMENT_GUIDE.md](./MEASUREMENT_GUIDE.md) を確認して、測定を開始してください。
