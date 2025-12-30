# 【機能修正提案】フッターへの法的リンク追加（Stripe導入準備）

- **サービス**: `blog`
- **セクション**: `common`
- **関連ドキュメント**:
  - `develop/blog/common/func-spec.md`
  - `develop/blog/common/uiux-spec.md`
  - `develop/blog/common/file-list.md`
  - `develop/blog/GUIDING_PRINCIPLES.md`

---

## 1. 提案概要

Stripe決済導入に伴い法的要件を満たすため、ブログフッターに「利用規約」「プライバシーポリシー」「特定商取引法に基づく表記」の3つのリンクを追加します。**ハイブリッドアプローチ v2**を採用し、利用規約とプライバシーポリシーは**ブログ記事として実装**（既存の記事システムを活用）、特定商取引法のみ個人情報保護のためモーダル表示+noindex対応を行います。

## 2. 変更内容 (As-Is / To-Be)

### 現状 (As-Is)

- BlogFooterには「コピーライト表記」のみが表示されている
- 法的要件に関するページへのアクセス手段が存在しない
- Stripe決済を導入する際の法的要件を満たしていない

### 修正後 (To-Be)

- BlogFooterに以下の3つのリンクを追加:
  1. **利用規約** (`/blog/terms` + `/terms`リダイレクト) - **ブログ記事** | SEO: インデックス有効
  2. **プライバシーポリシー** (`/blog/privacy` + `/privacy`リダイレクト) - **ブログ記事** | SEO: インデックス有効
  3. **特定商取引法に基づく表記** - **モーダル表示** | SEO: noindex, nofollow

- **ハイブリッドアプローチ v2の実装詳細**:
  - **ブログ記事として実装（利用規約・プライバシーポリシー）**:
    - **実装**: `content/blog/posts/terms.md`, `privacy.md`を追加
    - **URL**: `/blog/terms`, `/blog/privacy`（既存のブログ記事システムを活用）
    - **外部連携**: `/terms`, `/privacy`から301リダイレクト設定（Stripe等の要件対応）
    - **記事一覧での扱い**:
      - カテゴリ: `起業`（技術記事ではないが許容範囲）
      - 日付: 最も古い日付（例: `2020-01-01`）を設定し、一覧の最後尾に配置
      - 記事一覧に表示されることは許容（新しい記事が優先表示されるため目立たない）
    - **メリット**:
      - 既存システムの活用で実装が極めてシンプル
      - Markdownで統一された編集フロー
      - SEOによる信頼性向上（Googleは法的ページのインデックスを推奨）
      - 業界標準（eBay、H&M、IKEA等）と同様のアプローチ
  - **モーダル（特定商取引法）**:
    - 個人情報（自宅住所・本名）の検索エンジン露出を防止
    - `noindex, nofollow`による検索エンジン対策
    - 比較的短文のため、モーダル表示で十分

- フッターレイアウト: コピーライト表記の上に、リンクを横並びで配置

## 3. 背景・目的

### 背景

Stripe決済を導入する際、日本の法律（特定商取引法、個人情報保護法）および各種プラットフォームのポリシーに準拠するため、以下のページの提供が義務付けられています：

1. **利用規約**: サービス利用時の契約条件を明示
2. **プライバシーポリシー**: 個人情報の取り扱いを明示
3. **特定商取引法に基づく表記**: 事業者情報（氏名、住所、連絡先等）を明示

**技術調査結果**（2025年業界標準）：

- **UX Best Practices**: モーダルは長文コンテンツに不適切。法的ページは専用ページが推奨（eBay、H&M、IKEA等が採用）
- **SEO推奨**: Googleは利用規約・プライバシーポリシーのインデックスで「サイトの信頼性が向上する」と推奨
- **Remix + Cloudflare Pagesのお作法**: 通常のルーティング規約に沿った専用ページ実装が標準
- **プライバシー保護**: 特定商取引法の個人情報（自宅住所・本名）は`noindex`が妥当

### 目的

- **目的1**: Stripe決済導入の法的要件を満たす
- **目的2**: ユーザーに対して透明性の高い情報提供を行い、信頼性を向上させる
- **目的3**: 特定商取引法ページの個人情報を検索エンジンから保護し、プライバシーリスクを最小化する

## 4. 変更の妥当性 (Pros / Cons)

`@ArchitectureGuardian` の視点に基づき、この変更がプロジェクトの設計思想に合致するかを評価します。

Pros (利点):

- **圧倒的な実装の簡潔性**: Markdownファイル追加 + リダイレクト設定のみ。新規ルートの本格実装不要
- **既存システムの完全活用**: ブログ記事システムを再利用。ゼロから実装する必要なし
- **アーキテクチャ原則の完全遵守**: 「1サービス=1ページ」ルールに準拠。blogサービス内で完結
- **保守性の向上**: Markdown編集のみで法的文書を更新可能。統一された編集フロー
- **法的コンプライアンスとSEOの両立**: Stripe導入要件を満たしつつ、SEOによる信頼性向上を実現
- **プライバシー保護の最大化**: 特商法の個人情報を検索エンジンから完全に保護
- **業界標準UXの採用**: 大手サイト（eBay、H&M、IKEA等）と同様の実装パターン
- **外部サービス連携**: リダイレクト設定で`/terms`, `/privacy`への直リンクに対応（Stripe等の要件対応）
- **スケーラビリティ**: 将来的な法的ページ追加も同様にMarkdownファイル追加のみ

Cons (懸念点):

- **記事一覧への表示**: 法的文書が記事一覧に表示される（ただし、古い日付設定で最後尾に配置し影響を最小化）
- **カテゴリの妥協**: 「起業」カテゴリに分類（技術記事ではないが許容範囲）
- **モーダル実装**: 特商法用のモーダルコンポーネントは別途実装が必要
- **テストの増加**: リダイレクト動作、モーダル開閉、noindexメタタグの検証が必要

**総合評価**:

Consは存在するものの、**ハイブリッドアプローチ v2（ブログ記事活用方式）**は技術調査結果とビジネス要件の両方を満たす最適解であり、この変更は**非常に妥当性が高い**と判断します。特に以下の点で評価できます：

1. **ビジネス要件の達成**: Stripe決済導入という重要なマイルストーンを実現
2. **実装コストの最小化**: 既存システムの活用により、開発工数を大幅に削減
3. **アーキテクチャ原則の完全遵守**: 「1サービス=1ページ」ルールに準拠し、要件肥大化を防止
4. **業界標準の採用**: 2025年時点のUX・SEOベストプラクティスに準拠
5. **プライバシー保護とSEOの両立**: ブログ記事でSEO最適化、モーダルで個人情報保護を実現
6. **保守性の向上**: Markdown編集のみで法的文書を更新。将来のメンテナンスが容易
7. **スケーラビリティ**: 今後の法的ページ追加も同様にMarkdownファイル追加のみ

**参考資料**:
- [Modal UX design: Patterns, examples, and best practices - LogRocket Blog](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/)
- [Should I Noindex, Nofollow my privacy policy, Terms & Condition page? - Google Search Central](https://support.google.com/webmasters/thread/11334735/)
- [7 Ways How Privacy Policy Helps SEO](https://www.enzuzo.com/blog/seo-privacy-policy)
- [Website Legal Pages Explained: Essential Guide for 2025](https://seo-analytic.com/website-legal-pages-explained/)

## 5 設計フロー

以下の設計ドキュメントを上から順に確認し、編集内容を追記して。

### 🗾GUIDING_PRINCIPLES.md

*編集不要*（commonセクションの責務に法的ページリンクの追加は既に含まれる範囲内）

### 📚️func-spec.md

- **Footer Components**セクションに以下を追記:
  - フッターリンクの追加（利用規約、プライバシーポリシー、特定商取引法）
  - 特定商取引法モーダルの仕様（開閉ロジック、noindex対応）
- **必要なデータ要件**セクションに以下を追記:
  - フッターリンクデータ（ラベル、リンク先、モーダルフラグ）

### 🖼️uiux-spec.md

- **レイアウトのコンポーネント構造規範**セクションに以下を追記:
  - BlogFooter内のフッターリンク配置（横並び、コピーライト表記の上）
  - 特定商取引法モーダルの構造（モーダルオーバーレイ、モーダルコンテンツ、閉じるボタン）
- **インタラクションと状態遷移の設計**セクションに以下を追記:
  - モーダルの開閉状態とトリガー（リンククリック、Escキー、外側クリック）
  - モーダル表示時のスクロール制御

### 📋️spec.yaml

*現時点では`content/blog/blog-spec.yaml`は存在しないため、スキップ*

### 🗂️file_list.md

- 新規ファイル追加:
  - `content/blog/posts/terms.md`: 利用規約（ブログ記事として実装）
  - `content/blog/posts/privacy.md`: プライバシーポリシー（ブログ記事として実装）
  - `app/routes/terms.tsx`: `/blog/terms`へのリダイレクト（数行のみ）
  - `app/routes/privacy.tsx`: `/blog/privacy`へのリダイレクト（数行のみ）
  - `app/components/blog/common/LegalModal.tsx`: 特定商取引法モーダルコンポーネント
  - `app/components/blog/common/LegalModal.test.tsx`: モーダルのテスト
- 既存ファイル更新:
  - `app/components/blog/common/BlogFooter.tsx`: フッターリンクの追加
  - `app/components/blog/common/BlogFooter.test.tsx`: テストの更新

### 🧬data-flow-diagram.md

- データフロー追加:
  - フッターリンクデータの取得フロー（loader → BlogFooter）
  - モーダル表示のクライアントサイド状態管理
  - ブログ記事としての利用規約・プライバシーポリシーの取得フロー（既存システムを活用）

## 6 TDD_WORK_FLOW.md 簡易版

以下の全項目に対して、実際のパスと編集内容を1行で記載して。
完全な計画ではなく、大枠がわかればよい。
特に、新規ファイルに関して把握したい。

### 📝コンテンツ作成（最優先）

- **新規**: `content/blog/posts/terms.md`: 利用規約のMarkdownファイル（Frontmatter: category: "起業", publishedAt: "2020-01-01"）
- **新規**: `content/blog/posts/privacy.md`: プライバシーポリシーのMarkdownファイル（Frontmatter: category: "起業", publishedAt: "2020-01-01"）

### 👁️e2e-screen-test

- `tests/e2e/screen/blog-footer-links.spec.ts`: フッターリンク表示・遷移・モーダル開閉・リダイレクトを検証

### 👁️e2e-section-test

- `tests/e2e/section/common.spec.ts`: 既存テストにフッターリンクの検証を追加

### 🎨CSS実装 (layer2.css, layer3.ts, layer4.ts)

- `app/styles/blog/layer3.ts`: `.blog-footer__links`クラスを追加（フッターリンクの横並び配置）
- `app/styles/blog/layer3.ts`: `.legal-modal`クラスを追加（モーダルのオーバーレイとコンテンツ構造）

### 🪨route

- **新規**: `app/routes/terms.tsx`: `/blog/terms`へのリダイレクト（数行のみ: `return redirect("/blog/terms", 301);`）
- **新規**: `app/routes/privacy.tsx`: `/blog/privacy`へのリダイレクト（数行のみ: `return redirect("/blog/privacy", 301);`）

### 🚧components.test

- `app/components/blog/common/BlogFooter.test.tsx`: フッターリンク表示のテストを追加
- **新規**: `app/components/blog/common/LegalModal.test.tsx`: モーダルの開閉、Escキー、外側クリックの検証

### 🪨components

- `app/components/blog/common/BlogFooter.tsx`: フッターリンクとモーダルトリガーを追加
- **新規**: `app/components/blog/common/LegalModal.tsx`: 特定商取引法モーダルコンポーネント

### 🚧logic.test

*該当なし*（フッターリンクとモーダルに複雑なビジネスロジックは不要）

### 🪨logic

*該当なし*

### 🚧data-io.test

*該当なし*（フッターリンクデータは静的定数として管理）

### 🪨data-io

*該当なし*

### その他

- `app/routes/blog.tsx`: フッターリンクデータをloaderで提供（既存のloadBlogConfigに追加）
- **重要**: ブログ記事システムがMarkdownファイル（`terms.md`, `privacy.md`）を自動的に認識し、`/blog/terms`, `/blog/privacy`でアクセス可能になることを確認
