# スタイリング憲章 (Styling Charter)

> このドキュメントは、AIとの共同作業における「見た目の修正」の前提を定義する**最上位の規範**です。

---

## 🎯 1. 設計思想と目的

### 核心的な課題

**「修正時に最も認知負荷が高い、親子関係のレイアウト問題」**

ここでは「複雑なレイアウトロジック」を「`flex`, `grid`, `gap`といった親子関係を伴うレイアウトロジック」と定義します。「複雑なレイアウトロジック」はこれら以外は含みません。
複雑なレイアウトロジックが、実装層（TSXファイル）に散在していると、修正時に「どの親要素が原因か」を特定するのが極めて困難になります。この「修正の沼」が、開発速度を低下させる最大の要因です。

### 解決策：構造の集約

これらの**複雑なレイアウトロジックを、`tailwind.config.ts`に「構造クラス」として集約**します。

これにより、レイアウトの問題が発生した際の調査・修正対象は`tailwind.config.ts`という単一ファイルに限定され、認知負荷が劇的に低下します。

### 禁止事項

- ❌ **カスタムクラスの直接使用禁止**: `globals.css`で定義されたカスタムクラス（例: `.my-custom-class`）を実装層（TSX）で直接使用することは禁止します。すべてのスタイルはTailwindクラスまたはTailwindプラグイン経由で提供されるべきです。
- ❌ **`!important` の使用禁止**: CSSの予測不能な挙動や保守性の低下を招くため、いかなるレイヤーにおいても `!important` の使用は禁止します。Tailwindのユーティリティクラスやプラグインの設計で対応できない場合は、アーキテクチャの再検討が必要です。

---


---

## 🏗️ 2. 5階層アーキテクチャ

このアーキテクチャは、**「フロー制御」**を厳格に分離し、以下のファイル構造で各レイヤーの責務を定義します。

~~~
tailwind.config.ts
app/
└── styles/
    ├── globals.css            # layer 1
    └── {service-name}/
         ├── Layer2.css
         ├── Layer3.ts
         └── Layer4.ts
~~~

## 📐 3. 各階層の詳細定義

### Layer 1: Application Tokens（アプリケーショントークン層）

**担当領域**: 見た目と大きさ | **定義場所**: `app/styles/globals.css`

**アプリケーションでの役割**:
- **アプリケーション全体（すべてのサービス）で共通使用される意味的な役割を持つトークンを定義**
- service-name、user-managementなど、どのサービスでも「どのような役割で使うか」を示すトークンを提供
- 各サービスは、この意味的なトークンを参照することで、アプリケーション全体の一貫性を保つ

**責務**:
- **サービスを横断して共通使用される、意味的な役割を持つトークンを定義**
- 「背景色」「テキスト色」「アクセント色」など、**どう使われるか**を示す命名
- アプリケーションの視覚的な一貫性とテーマを管理
- **完全なスケールを定義する必要はない**: 実際にアプリケーションで使用する値のみを定義

**命名規則**: `--{category}-{role}-{variant?}`

**命名パターンの構成**:
- `{category}`: カテゴリ（例: `color`, `spacing`, `font`, `layout`）
- `{role}`: **意味的な役割**（例: `background`, `text`, `interactive`, `status`）
- `{variant}`: バリアント（例: `primary`, `secondary`, `success`, `error`）※省略可

✅ **定義する値の例（意味的な役割を持つトークン）**:
```css
/* アプリ全体の主要な背景色 */
--color-background-primary: #111111;

/* アプリ全体のセカンダリ背景色 */
--color-background-secondary: #1a1a1a;

/* アプリ全体の主要なテキスト色 */
--color-text-primary: #ffffff;

/* アプリ全体のサブテキスト色 */
--color-text-secondary: #999999;

/* アプリ全体のアクセント色 */
--color-accent-gold: #BFA978;

/* アプリ全体のインタラクティブ要素の色 */
--color-interactive-primary: #22d3ee;
--color-interactive-primary-bg: rgb(34 211 238 / 0.3);

/* アプリ全体のステータス色 */
--color-status-success: #4ade80;
--color-status-error: #ef4444;

/* アプリ全体の標準的な間隔 */
--spacing-3: 16px;
--spacing-4: 24px;

/* アプリ全体のページ構造 */
--layout-page-container-width: 800px;
--layout-page-container-padding: 32px;

/* アプリ全体のヘッダー/フッター */
--layout-header-height: 80px;
--layout-footer-height: 80px;

/* アプリ全体のセクション（「1サービスは複数セクションの縦連結」に対応） */
--layout-section-width: 800px;
--layout-section-spacing-vertical: 32px;
--layout-section-padding: 32px;

/* アプリ全体のカードアイテム */
--layout-card-width: 176px;
--layout-card-min-height: 32px;

/* アプリ全体のボタン */
--layout-button-width-default: 100px;
```

❌ **定義しない値の例**:
```css
/* サービス固有の意味的トークン → Layer 2で定義 */
--color-flow-checkpoint-active: #xxx;
--color-user-card-background: #xxx;

/* 具体的な色名のみのトークン（ファンデーショントークン的） */
--color-gray-900: #111111;  /* 意味的な役割を持たせること */
--color-blue-400: #60a5fa;  /* 例: --color-interactive-primary など */

/* 抽象的なスケールトークン（意味的な役割を持たせること） */
--layout-width-lg: 800px;  /* 非推奨: --layout-page-container-width, --layout-section-width など意味的なトークンを使用 */
```

**Layer 1とLayer 2の関係**:
- **Layer 1（globals.css）**: サービス全体の意味的トークン
  - 例: `--color-background-primary`, `--color-text-primary`, `--layout-section-width`, `--layout-header-height`
- **Layer 2（{service-name}/layer2.css）**: サービス固有のコンポーネントスタイル
  - 例: `.page-container { max-width: var(--layout-page-container-width); padding: var(--layout-page-container-padding); }`
  - 例: `.checkpoint { background: var(--color-background-primary); color: var(--color-text-primary); }`

**制約**:
- ❌ **変数参照の禁止**: Layer 1では他のCSS変数を参照してはならない（`color: var(--other-token)`は不可）
- ❌ **直接参照禁止**: 実装（TSX）やLayer 3/4から直接参照してはならない
- ✅ **具体値のみ許可**: HEXコード（`#111111`）、px値（`16px`）、rgb値（`rgb(0 0 0 / 0.5)`）など
- ✅ **参照可能対象**: Layer 2のみが参照可能

---

### Layer 2: Component Styles（コンポーネントスタイル層）

**担当領域**: 見た目と大きさ | **定義場所**: `app/styles/{service-name}/layer2.css`

**責務**:
- **コンポーネント単位でCSSセレクタを定義**し、Layer 1のApplication Tokenを組み合わせて「見た目」と「サイズ」を定義する。
- このレイヤーでコンポーネントのスタイルを**99%完成**させる。Layer 3では複雑なレイアウトロジック（flex, grid, gap）のみを追加する。

**命名規則（CSSセレクタ）**:
- **フォーマット**: `.{component}-{variant?}` または `.{category}-{component}-{variant?}`
- **例**: `.checkpoint`, `.button-primary`, `.page-header`, `.select-input`
- **構成要素**:
  - `{category}`: カテゴリ (例: `page`, `select`, `flow`) ※必要に応じて使用
  - `{component}`: コンポーネント名 (例: `checkpoint`, `button`, `header`, `input`)
  - `{variant}`: バリエーション (例: `primary`, `secondary`) ※省略可

**カテゴリベースの命名パターン**:
コンポーネントの役割や用途が明確な場合、カテゴリプレフィックスを使用してより具体的な命名を行います。

- **ページレベルコンポーネント** (`.page-*`):
  - 例: `.page-header`, `.page-footer`, `.page-container`
  - 用途: ページ全体に関わるコンポーネント

- **フォーム要素** (`.select-*`, `.input-*`, `.form-*`):
  - 例: `.select-input`, `.select-container`, `.select-label`
  - 用途: フォームやインタラクティブな入力要素

- **ドメイン固有のコンポーネント** (`.flow-*`, `.audit-*`, etc.):
  - 例: `.flow-branch`, `.flow-connector`
  - 用途: 特定のドメインロジックに紐づくコンポーネント

**禁止される命名パターン**:
- ❌ **サービス名プレフィックス**: `.service-name-*`, `.user-management-*` などのサービス名をプレフィックスとして使用することは禁止
- ❌ **過度に汎用的な名前**: `.container`, `.wrapper`, `.box` などの単独使用は避け、より具体的な名前を使用すること

**定義内容**:
- 色（color, background-color, border-colorなど）
- サイズ（width, height, paddingなど）
- **コンポーネント自体の外側余白**（`margin`）。**注意**: Flex/Gridアイテム間の余白はLayer 3の`gap`で定義します。
- タイポグラフィ（font-family, font-size, font-weightなど）
- その他の見た目（box-shadow, border-radius, transitionなど）
- 位置（position, top, right, bottom, left, z-index）
- オーバーフロー（overflow, overflow-x, overflow-y）
- 状態別スタイル（`:hover`, `.completed`, `.pending`など）

**制約**:
- ❌ **Layer 5からの直接参照禁止**: 実装（TSX）から`.checkpoint`を直接使用してはならない。Layer 3経由で使用すること。
- ❌ **CSS変数（トークン）の定義禁止**: Layer 2では新しいCSS変数（例: `--blog-font-2xl`, `--custom-size`）を定義してはなりません。すべてのCSS変数はLayer 1で定義されます。
- ❌ **マジックナンバーの禁止**: 以下のような具体的な値を直接定義してはなりません。**必ずLayer 1のApplication Tokensを `var()` で参照してください。**
  - 色の直接指定: `#FFF`, `rgb(255, 255, 255)`, `rgba(0, 0, 0, 0.5)`
  - サイズの直接指定: `40px`, `2rem`, `1.5em`
  - 単位なし数値: `400` (font-weight), `0.5` (opacity), `10` (z-index)
  - **例外1**: bool値として`0`と`1`（単位なし）のみ許可されます
    - ✅ 許可: `opacity: 0;`, `opacity: 1;`, `flex: 1;`, `z-index: 0;`
  - **例外2**: ショートハンドプロパティ（複数値）における単位付きの`0`は許可されます
    - ✅ 許可: `margin: 0px 10px;`, `padding: 0 var(--spacing-4);`, `border-width: 0 1px;`
    - ❌ 禁止: `margin: 0px;`（単一値の場合、単位なし`0`を使用すること）
    - ❌ 禁止: `margin: 0 10px;`（`10px`はマジックナンバー、`var(--spacing-*)`を使用すること）
  - **例外3**: 普遍的な全幅/全高を示す`100%`のみ許可されます
    - ✅ 許可: `width: 100%;`, `height: 100%;`, `max-width: 100%;`
    - 理由: `100%`はWeb標準として普遍的な「全幅/全高」の意味を持ち、トークン化しても意味的価値が増えないため
- ❌ **フレックス・グリッドの禁止**: `flex`, `grid`, `gap`, `display: flex` などのFlexbox/Gridレイアウトは定義しない（Layer 3の責務）。
- ✅ **参照元**: Layer 3, Layer 4からのみ参照可能。

---

### Layer 3: Flexbox and Grid Layout（フレックスとグリッドレイアウト層）

**担当領域**: フレックスとグリッド構造 | **定義場所**: `app/styles/{service-name}/layer3.ts`

**責務**:
- Layer 2で定義されたコンポーネントセレクタに、**フレックスとグリッドに関するレイアウトロジック**のみを追加する。
- `addComponents` を使ってTailwind pluginとして登録し、Layer 2のCSSと統合する。
- **gap統一の原則**: Flexbox/Gridの**アイテム間の余白**は`margin`を使用せず、必ず`gap`で統一する。

**命名規則**:
- **Layer 2と同じセレクタ名を使用**: `.{component}-{variant?}`
- **例**: `.checkpoint`, `.button-primary`（layer2.cssと同じ）

**定義内容（フレックス・グリッドレイアウトのみ）**:
- フロー制御（display: flex, display: grid）
- 配置（align-items, justify-content, flex-direction, grid-template-columns など）
- 間隔（**gap, row-gap, column-gap のみ**）
- フレックス・グリッド関連プロパティ（flex-grow, flex-shrink, grid-area など）

**禁止事項**:
- ❌ 色の定義（color, background-color, border-colorなど）← Layer 2の責務
- ❌ サイズの定義（width, height, padding など）← Layer 2の責務
- ❌ **アイテム間余白のための`margin`使用**（`margin-top` など）← `gap`で統一すること
- ❌ タイポグラフィ（font-family, font-size, font-weightなど）← Layer 2の責務
- ❌ 見た目（box-shadow, border-radius, transitionなど）← Layer 2の責務

**制約**:
- ❌ **Layer 1直接参照原則禁止**: 基本的に`var(--color-*)`、`var(--spacing-*)`などLayer 1トークンの直接参照は禁止。
- ✅ **gap例外**: **gap/row-gap/column-gapのみ**、Layer 1の`var(--spacing-*)`トークンを直接参照可能。これにより、Layer 2で中間変数を定義する必要がなくなる。
- ❌ **`!important` の使用禁止**: このレイヤーで `!important` を使用することは禁止します。

---

### Layer 4: Structure Exceptions（構造の例外）

**担当領域**: 構造（例外） | **定義場所**: `app/styles/{service-name}/layer4.ts`

**責務**:
- Layer 3のフロー制御ではカバーできない、より例外的な構造を定義する。

**対象パターン（例外のみ）**:
1. **疑似要素** (`::before`, `::after`)
3. **子孫セレクタ** (`.parent .child`)
4. **カスタムアニメーション** (`@keyframes` の定義と `animation` プロパティ)

**制約**:
- ✅ **Skin Tokens参照**: `--app-*`, `--{service}-*`を`var()`で参照可能
- ❌ **`!important` の使用禁止**: このレイヤーで `!important` を使用することは禁止します。

---

### Layer 5: 実装層 (TSX)

**定義場所**: `app/**/*.tsx`

**責務**:
- Layer 3, 4で定義・生成されたTailwindクラスのみを使用してUIを実装する。

**制約**:
- ❌ **フロー制御クラスの直接使用禁止**: `flex`, `grid`, `gap` は直接使用せず、Layer 3で定義された構造クラス（`.card-list-container`など）を使用する。
- ❌ **マジックナンバーの使用禁止**: `p-4`, `w-1/2` のようなマジックナンバー的なクラスは使用せず、Layer 2のトークンから生成されたクラス（`p-app-md`など）を使用する。

---

# 絶対にしてはいけない勘違い
## 不要な層と禁止パターン
以下の層および命名パターンはこれまで何回も生み出され、提案され、その度に廃止してきた根強い不要な層および有害なパターンである。

### 不要な層
・サービストークン層
・サポートトークン層
・tailwind theme層

これらはコメントや命名で宣言された瞬間、勘違いが発生し、すぐに層が増える。
絶対に使用、提案はしないこと。

### 禁止される命名パターン
・**サービス名プレフィックス** (例: `.service-name-*`, `.user-management-*`)
  - 理由: サービス名をクラス名に含めると、命名が冗長になり認知負荷が増加する。
  - コンポーネントの役割を示すカテゴリプレフィックス（`.page-*`, `.select-*`）を使用すること。

## スキンと構造の分離
この分離は本ボイラープレートに存在しない。よくレイヤー2がスキンでレイヤー3が構造と勘違いが起きるが、これらはコンポーネント単位で複雑なレイアウトを分離したに過ぎない。
この勘違いが起きると、cssアーキテクチャが崩壊し、修正ができなくなり、多大な損害が発生する。絶対に勘違いしないこと。スキンという言葉も構造という言葉も使用しないことを徹底する。