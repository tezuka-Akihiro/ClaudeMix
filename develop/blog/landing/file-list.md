# file-list.md - landing Section

## 目的

landingセクションの実装に必要な全ファイルを3大層分離アーキテクチャに基づきリストアップ

---

## 1. E2Eテスト（Phase 1）

### 1.1 セクションレベルE2E

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| landing.spec.ts | tests/e2e/section/blog/landing.spec.ts | landingセクション単独のE2Eテスト。LP表示、ターゲットパラメータ検証、スクロールアニメーション動作、CTA導線確認 |

---

## 2. Route層（Phase 2.4）

| ファイル名 | パス | URL | 説明 |
| :--- | :--- | :--- | :--- |
| blog.landing.$target.tsx | app/routes/blog.landing.$target.tsx | /blog/landing/:target | ランディングページのRoute。loaderでターゲットパラメータ取得・検証、コンテンツYAML読み込み、漫画アセットパス取得。HeroSection, ScrollSection, MangaPanelGrid, CTASection, LandingFooterをレンダリング。ErrorBoundaryでターゲット不正時のフォールバック表示 |

**注**: Flat Routes規則により、`blog.landing.$target.tsx`で動的ルート（/blog/landing/:target）を表現します。

---

## 3. UI層（Phase 2.3）

### 3.1 Components (landing固有)

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| HeroSection.tsx | app/components/blog/landing/HeroSection.tsx | ファーストビュー表示。漫画パネル1-2枚、キャッチコピーを配置。Above-the-fold領域（Critical CSS対象） |
| HeroSection.test.tsx | app/components/blog/landing/HeroSection.test.tsx | ユニットテスト |
| MangaPanel.tsx | app/components/blog/landing/MangaPanel.tsx | 漫画パネル単体コンポーネント。`<img loading="lazy">`属性使用、WebP形式画像、レスポンシブ対応 |
| MangaPanel.test.tsx | app/components/blog/landing/MangaPanel.test.tsx | ユニットテスト（画像読み込み、遅延ロードテスト） |
| ScrollSection.tsx | app/components/blog/landing/ScrollSection.tsx | スクロールアニメーション領域。AnimatedBlock × N を配置。Intersection Observer連携、スクロール位置に応じたアニメーション制御 |
| ScrollSection.test.tsx | app/components/blog/landing/ScrollSection.test.tsx | ユニットテスト（スクロールアニメーション領域の構造テスト） |
| AnimatedBlock.tsx | app/components/blog/landing/AnimatedBlock.tsx | 個別アニメーション要素。`data-animation`属性でアニメーションタイプ指定、`data-testid`属性付与、Intersection Observer連携 |
| AnimatedBlock.test.tsx | app/components/blog/landing/AnimatedBlock.test.tsx | ユニットテスト（個別アニメーション要素の表示・非表示テスト） |
| CTASection.tsx | app/components/blog/landing/CTASection.tsx | CTAボタン群。ドキュメント、GitHub、デモへのリンク。レスポンシブ配置、アクセシビリティ対応 |
| CTASection.test.tsx | app/components/blog/landing/CTASection.test.tsx | ユニットテスト（CTAボタン群のリンク検証テスト） |
| LandingFooter.tsx | app/components/blog/landing/LandingFooter.tsx | LPフッター。法務リンク（プライバシーポリシー等）、シンプルな構成 |
| LandingFooter.test.tsx | app/components/blog/landing/LandingFooter.test.tsx | ユニットテスト（フッター法務リンクテスト） |

---

## 4. 純粋ロジック層（lib層、Phase 2.2）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| scrollAnimation.ts | app/lib/blog/landing/scrollAnimation.ts | スクロール位置計算、ビューポート閾値判定（70%）、アニメーション発火ロジック（純粋関数） |
| scrollAnimation.test.ts | app/lib/blog/landing/scrollAnimation.test.ts | ユニットテスト（スクロール位置計算、アニメーション発火判定） |
| targetValidation.ts | app/lib/blog/landing/targetValidation.ts | ターゲットパラメータ検証（`engineer`等の許可リスト照合）、デフォルト値フォールバック（純粋関数） |
| targetValidation.test.ts | app/lib/blog/landing/targetValidation.test.ts | ユニットテスト（ターゲットパラメータ検証：正常値、不正値、デフォルト値） |

---

## 5. 副作用層（data-io層、Phase 2.1）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| getLandingContent.server.ts | app/data-io/blog/landing/getLandingContent.server.ts | `content/blog/landing/{target}/content.yaml`を読み込み、YAMLパース処理、LandingContent型で返却。エラーハンドリング対応 |
| getLandingContent.server.test.ts | app/data-io/blog/landing/getLandingContent.server.test.ts | ユニットテスト（コンテンツYAML読み込み、パース処理、ファイル存在確認、エラーハンドリング） |
| getMangaAssets.server.ts | app/data-io/blog/landing/getMangaAssets.server.ts | `content/blog/landing/{target}/manga/`配下の画像ファイル一覧を取得、ファイルパス配列で返却。ファイル存在確認、エラーハンドリング対応 |
| getMangaAssets.server.test.ts | app/data-io/blog/landing/getMangaAssets.server.test.ts | ユニットテスト（漫画画像パス取得、ファイル存在確認） |

---

## 6. CSS層（Phase 2.3）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| layer2-landing.css | app/styles/blog/layer2-landing.css | 漫画パネル、CTAボタン、フッターの見た目定義（既存のカラー変数を使用） |
| layer3-landing.ts | app/styles/blog/layer3-landing.ts | MangaPanelGrid（CSS Grid）、ScrollSection（Flexbox縦積み）、CTASection（Flexbox横並び）のレイアウトクラス生成 |
| layer4-landing.ts | app/styles/blog/layer4-landing.ts | スクロールアニメーション用`@keyframes`定義（fadeInUp, slideIn, scale等） |

---

## 7. Spec層（設定ファイル）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| landing-spec.yaml | app/specs/blog/landing-spec.yaml | LP設定の単一真実の源（SSoT）。ターゲット、カラー、アニメーション、CTA、性能設定を定義 |
| types.ts | app/specs/blog/types.ts | 既存の型定義ファイルに、LandingContent、MangaAsset等の型を追加 |

---

## 8. Content層（コンテンツデータ）

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| content.yaml | content/blog/landing/engineer/content.yaml | エンジニア向けコンテンツ（キャッチコピー、説明文、CTA文言） |
| panel-01.webp | content/blog/landing/engineer/manga/panel-01.webp | エンジニア向け漫画画像アセット1 |
| panel-02.webp | content/blog/landing/engineer/manga/panel-02.webp | エンジニア向け漫画画像アセット2 |
| ... | ... | ... |
| panel-08.webp | content/blog/landing/engineer/manga/panel-08.webp | エンジニア向け漫画画像アセット8 |

---

## 9. 設計ドキュメント層

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| func-spec.md | develop/blog/landing/func-spec.md | 機能設計書（このドキュメント） |
| uiux-spec.md | develop/blog/landing/uiux-spec.md | UI/UX設計書 |
| file-list.md | develop/blog/landing/file-list.md | ファイル一覧（このドキュメント） |
| data-flow-diagram.md | develop/blog/landing/data-flow-diagram.md | データフロー図 |
| TECHNICAL_DESIGN.md | develop/blog/landing/TECHNICAL_DESIGN.md | 技術設計書（Layer別の詳細設計、コンポーネント仕様、データフロー） |
| IMPLEMENTATION_PLAN.md | develop/blog/landing/IMPLEMENTATION_PLAN.md | 実装手順書（タスク分解、依存関係、検証ポイント） |

---

## 10. 思考記録層

| ファイル名 | パス | 説明 |
| :--- | :--- | :--- |
| landing-css-inline.md | docs/thinking/landing-css-inline.md | Critical CSSインライン化の判断経緯を記録（性能最適化の妥協点） |
| landing-scroll-implementation.md | docs/thinking/landing-scroll-implementation.md | Intersection Observer採用の判断経緯（Remix公式との比較） |

---

## 実装順序の推奨

1. **Phase 1**: E2Eテスト作成（`landing.spec.ts`）
2. **Phase 2.1**: 副作用層（data-io層）実装
3. **Phase 2.2**: 純粋ロジック層（lib層）実装
4. **Phase 2.3**: CSS層、UI層実装
5. **Phase 2.4**: Route層実装

この順序に従うことで、Outside-In TDDの原則を遵守し、テストファーストでの実装を実現します。
