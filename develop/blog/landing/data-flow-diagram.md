# data-flow-diagram.md - landing Section

## 目的

landingセクションのコンポーネント間の依存関係とデータフローをMermaid図で可視化し、設計レビューを容易にする。

---

## データフロー図

```mermaid
graph TD
    subgraph "外部リソース"
        ContentYAML["content/blog/landing/{target}/content.yaml"]
        MangaAssets["content/blog/landing/{target}/manga/*.webp"]
        Spec["app/specs/blog/landing-spec.yaml"]
    end

    subgraph "Route層"
        Route["blog.landing.$target.tsx<br/>(Route)"]
    end

    subgraph "UI層 - landingセクション"
        HeroSection["HeroSection<br/>(ファーストビュー)"]
        ScrollSection["ScrollSection<br/>(スクロール領域)"]
        AnimatedBlock["AnimatedBlock<br/>(アニメーション要素)"]
        MangaPanelGrid["MangaPanelGrid<br/>(漫画パネル配列)"]
        MangaPanel["MangaPanel<br/>(漫画パネル単体)"]
        CTASection["CTASection<br/>(CTAボタン群)"]
        LandingFooter["LandingFooter<br/>(フッター)"]
    end

    subgraph "純粋ロジック層 (lib)"
        TargetValidation["targetValidation<br/>(ターゲット検証)"]
        ScrollAnimation["scrollAnimation<br/>(スクロールアニメーション)"]
    end

    subgraph "副作用層 (data-io)"
        GetLandingContent["getLandingContent.server<br/>(コンテンツYAML読み込み)"]
        GetMangaAssets["getMangaAssets.server<br/>(漫画アセット取得)"]
    end

    %% データフロー
    ContentYAML -->|YAML読み込み| GetLandingContent
    MangaAssets -->|ファイルパス取得| GetMangaAssets
    Spec -->|設定参照| GetLandingContent

    GetLandingContent -->|LandingContent型| Route
    GetMangaAssets -->|MangaAsset[]| Route
    Route -->|target param| TargetValidation
    TargetValidation -->|validated target| GetLandingContent
    TargetValidation -->|validated target| GetMangaAssets

    Route -->|content data| HeroSection
    Route -->|content data| ScrollSection
    Route -->|content data| MangaPanelGrid
    Route -->|CTA settings| CTASection
    Route -->|footer settings| LandingFooter

    HeroSection -->|manga assets| MangaPanel
    ScrollSection -->|animation config| AnimatedBlock
    AnimatedBlock -->|scroll position| ScrollAnimation
    ScrollAnimation -->|trigger animation| AnimatedBlock
    MangaPanelGrid -->|manga assets| MangaPanel

    %% スタイル
    classDef routeStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef uiStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef libStyle fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef dataIOStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef externalStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class Route routeStyle
    class HeroSection,ScrollSection,AnimatedBlock,MangaPanelGrid,MangaPanel,CTASection,LandingFooter uiStyle
    class TargetValidation,ScrollAnimation libStyle
    class GetLandingContent,GetMangaAssets dataIOStyle
    class ContentYAML,MangaAssets,Spec externalStyle
```

---

## データフローの詳細説明

### 1. リクエスト受信フェーズ

```
ユーザー --> /blog/landing/:target --> Route
```

- ユーザーがターゲット別LP（例: `/blog/landing/engineer`）にアクセス
- RouteのloaderがURLパラメータからターゲットを取得

### 2. ターゲット検証フェーズ

```
Route --> targetValidation(target) --> validated target
```

- lib層の`targetValidation`でターゲットパラメータを検証
- 許可リスト（`engineer`, `designer`, `manager`等）と照合
- 不正値の場合、デフォルト値（`engineer`）にフォールバック

### 3. コンテンツ取得フェーズ

```
validated target --> getLandingContent.server --> LandingContent型
validated target --> getMangaAssets.server --> MangaAsset[]
```

- data-io層の`getLandingContent.server`がコンテンツYAMLを読み込み
- data-io層の`getMangaAssets.server`が漫画画像パスを取得
- spec.yamlの設定を参照（カラー、アニメーション設定等）

### 4. UIレンダリングフェーズ

```
Route --> HeroSection (Above-the-fold)
Route --> ScrollSection (スクロールアニメーション)
Route --> MangaPanelGrid (漫画パネル配列)
Route --> CTASection (CTAボタン群)
Route --> LandingFooter (フッター)
```

- Routeがloaderデータを各UIコンポーネントに渡す
- 各コンポーネントが責務に応じてレンダリング

### 5. スクロールアニメーションフェーズ

```
ユーザースクロール --> AnimatedBlock (Intersection Observer) --> scrollAnimation.ts --> アニメーション発火
```

- ユーザーがスクロールすると、Intersection Observerが発火
- lib層の`scrollAnimation.ts`がスクロール位置を計算
- ビューポート閾値（70%）に到達すると、アニメーション発火
- AnimatedBlockが`animate-*`クラスを付与され、アニメーション実行

---

## コンポーネント間の依存関係

### 依存関係の方向

```
Route (親)
├── HeroSection (子)
│   └── MangaPanel (孫)
├── ScrollSection (子)
│   └── AnimatedBlock (孫)
│       └── scrollAnimation.ts (ロジック)
├── MangaPanelGrid (子)
│   └── MangaPanel (孫)
├── CTASection (子)
└── LandingFooter (子)
```

### データの流れ

- **下向き（親→子）**: loaderデータの Props として渡す
- **上向き（子→親）**: イベントハンドラー（スクロールアニメーションの状態更新等）

---

## 主要なデータ型

### LandingContent型

```typescript
interface LandingContent {
  targetSlug: string;
  catchCopy: string;
  description: string;
  ctaButtonText: string;
  ctaLinks: CTALink[];
  mangaPanelCount: number;
}
```

### MangaAsset型

```typescript
interface MangaAsset {
  fileName: string;
  path: string;
  order: number;
}
```

### CTALink型

```typescript
interface CTALink {
  label: string;
  url: string;
}
```

> **注意**: 実際の型定義は`app/specs/blog/types.ts`を参照してください。

---

## エラーハンドリングフロー

### ターゲット不正時

```
不正なターゲット --> targetValidation --> デフォルト値 (engineer) --> 正常処理
```

### コンテンツファイル不在時

```
ファイル不在 --> getLandingContent.server --> Error throw --> ErrorBoundary --> フォールバック表示
```

### 漫画画像不在時

```
画像不在 --> getMangaAssets.server --> 空配列 [] --> UI側でプレースホルダー表示
```

---

## 性能最適化のデータフロー

### Critical CSSのインライン化

```
HeroSection (Above-the-fold) --> <style>タグ --> インラインCSS --> 初回ロード最適化
```

### 画像遅延ロード

```
MangaPanel (Below-the-fold) --> <img loading="lazy"> --> ビューポート接近時ロード
```

### スクロールアニメーションの最適化

```
Intersection Observer --> 閾値判定 --> RAF (RequestAnimationFrame) --> 60fps維持
```

---

## 将来の拡張性

### ターゲット追加時

```
新ターゲット追加 --> content/blog/landing/{new_target}/ 作成 --> targetValidation 更新 --> 完了
```

### アニメーションタイプ追加時

```
新アニメーション追加 --> layer4-landing.ts に @keyframes 追加 --> AnimatedBlock で使用
```

### CTA追加時

```
新CTA追加 --> landing-spec.yaml 更新 --> CTASection 自動反映
```
