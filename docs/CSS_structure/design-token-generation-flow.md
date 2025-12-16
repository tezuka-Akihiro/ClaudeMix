# Layer 1 Application Token 生成プロトコル

このドキュメントは、オペレーターが指定した既存プロダクトの「世界観」という抽象的な概念から、**Layer 1 Application Tokens** を体系的に生成するためのプロトコルを定義します。

**このフローの最終成果物は、`app/styles/globals.css` 内の `/* LINT-LAYER: 1 */` セクションです。**

## ファイル管理ポリシー

- **中間生成物の保存**: このフローで生成される `concept.md`、`style-guide.md`、`tokens-studio.json` は、デザイン決定の経緯を記録する重要なドキュメントとして `docs/CSS_structure/design-token/` ディレクトリに保存します。
- **共通言語としての役割**: これらのファイルは、AIと人間がデザインについて議論する際の「共通言語」として機能します。
- **Figma連携の媒介**: `tokens-studio.json` は、Tokens Studio for Figmaプラグインを介してFigmaと双方向同期し、視覚的な調整を経て `globals.css` のLayer 1を生成するための重要な中間フォーマットです。
- **唯一の真実の情報源 (SSoT)**: デザインの**実装**に関する唯一の真実の情報源は、最終成果物である `globals.css` と `tailwind.config.ts` です。AIはコード生成時に、常にこれらの最終成果物を参照してください。

---

## Layer 1 生成ワークフロー

~~~mermaid
graph TD
    A["project.toml の世界観URL"] -- "インスピレーション" --> B{"Step 1: 世界観解析"};
    B --> C["成果物: concept.md"];
    C -- "コンセプト" --> D{"Step 2: スタイルガイド作成"};
    D --> E["成果物: style-guide.md"];
    E -- "プリミティブ値" --> F{"Step 3: トークンJSON生成"};
    F --> G["成果物: tokens-studio.json"];
    G --> H["Step 3.1: Figmaインポート"];
    H --> I{オペレーター: Figmaで色調整};
    I -->|調整あり| J["Figmaからエクスポート"];
    I -->|調整なし| K{"Step 3.2: CSS実装"};
    J --> K;
    K --> L["成果物: globals.css (Layer 1部分)"];
    L --> M{"Step 3.5: ガードレール検証"};
    M -->|FAIL| D;
    M -->|PASS| N{"Step 4: ビジュアルレビュー"};
    N --> O["成果物: design-token-preview.html"];
    O --> P{オペレーター: 最終承認};
    P -->|修正要| I;
    P -->|承認| Q["完了"];
~~~

---

## Step 1: 世界観解析 (コンセプト定義)

**目的**: 抽象的な「世界観」から、デザインの方向性を言語化・視覚化する。
**実行者**: AIエージェント
**入力**:

- `project.toml` の **world_view_url**（世界観の参考URL）
- `app\styles\service-name\ワイヤーフレーム.png`（Figmaで作成したレイアウト設計図）
**出力**: `docs/CSS_structure/design-token/{サービス名}-concept.md`（例: `service-name-concept.md`）

**内容**:

- **キーワード抽出**: 世界観を表現する感情的なキーワード（例: "Cyberpunk", "Terminal", "Hologram"）
- **ムードボード**: 参考URLや画像から、デザインの雰囲気を伝えるビジュアル集
- **レイアウト構造分析**: Figmaワイヤーフレームから、以下の**構造のみ**を抽出
  - **3層構造の役割分離**:
    - **ヘッダー**: サービスセレクタ、セクションセレクタ、タイムスタンプ（ナビゲーション・選択）
    - **メインコンテンツ**: design flow（複数セクション、可変）、implementation-flow（情報表示）
    - **フッター**: 更新ボタン、リトライボタン（アクション・操作、固定表示）
  - **セクション配置**: design flow（複数セクション、可変）、implementation-flow（単一セクション）
  - **コンポーネント配置**: グリッド（横並び）vs 縦並び
  - **operationセクション廃止**: 操作ボタンをフッターに移動したため、operationセクションは不要
- **デザイントーン分析**: world_view_urlから、以下の**世界観に基づく要素**を決定
  - **カラートーン**: 世界観に合わせた色選定（ワイヤーフレームの色は無視）
  - **タイポグラフィ**: 世界観に合わせたフォント選定（ワイヤーフレームのフォントは無視）
  - **ボーダー・背景**: 世界観に合わせたボーダースタイル・背景色（ワイヤーフレームは無視）
  - **ボタンラベル**: 世界観に合わせたテキスト（例: 「更新」→「RELOAD」、「リトライ」→「RETRY」）

**重要な注意事項**:

- ワイヤーフレームは**レイアウト構造のみ**を示します。色・フォント・ボーダー・背景色はワイヤーフレームから抽出しないでください。
- `template-name` は実際のコンポーネント名（例: CheckpointNode）に置き換えられます。
- design flowの分岐数（ワイヤーフレームでは3つ）は例示であり、実際のセクション数は可変です（1〜N個）。

---

## Step 2: スタイルガイド作成 (プリミティブ値の決定)

**目的**: デザインコンセプトに基づき、具体的なデザインの基本要素（プリミティブ値）を決定する。これが **Application Tokens** の元になります。
**入力**: `docs/CSS_structure/design-token/concept.md`
**出力**: `docs/CSS_structure/design-token/style-guide.md`
**内容**:

- **カラーパレット**: 主要色、アクセント色、ステータス色などの具体的なHEXコードを定義
- **タイポグラフィ**: 見出し用・本文用フォント、フォントサイズとウェイトのスケールを定義
- **スペーシング**: 余白の基本単位とスケール（例: 8px, 16px, 24px...）を定義

---

## Step 3: デザイントークンJSON生成 (Tokens Studio形式)

**目的**: スタイルガイドで定義した基本要素を、Tokens Studio for Figmaで読み込み可能なJSON形式に変換する。
**実行者**: AIエージェント
**入力**: `docs/CSS_structure/design-token/style-guide.md`
**出力**: `docs/CSS_structure/design-token/tokens-studio.json`

**JSON構造**:

~~~json
{
  "$metadata": {
    "tokenSetOrder": ["foundation", "application", "service-{サービス名}"]
  },
  "foundation": {
    "color": { /* HEX値 */ },
    "spacing": { /* px値 */ },
    "fontSize": { /* px値 */ },
    "fontWeight": { /* 数値 */ },
    "fontFamily": { /* フォントスタック */ }
  },
  "application": {
    "bg": { "primary": { "value": "{foundation.color.neutral.900}", "type": "color" } }
  },
  "service-service-name": {
    "checkpoint": { "completed": { "border": { "value": "{foundation.color.green.400}", "type": "color" } } }
  }
}
~~~

**注意事項**:

- トークン名は、CSS変数名から自動変換（`--foundation-color-cyan-400` → `foundation.color.cyan.400`）
- 参照は `{トークンパス}` 形式で記述（例: `{foundation.color.cyan.400}`）
- 3層アーキテクチャを維持（Foundation → Application → Service の依存方向を厳守）

---

## Step 3.1: Figmaへのインポート（オペレーター操作）

**目的**: 生成されたデザイントークンをFigmaに取り込み、視覚的に確認・調整可能な状態にする。
**実行者**: オペレーター（人間）
**入力**: `docs/CSS_structure/design-token/tokens-studio.json`
**出力**: Figma上でトークンが利用可能な状態

**手順**:

1. **Figmaを開く**
   - 対象プロジェクトの「Design System」ページを開く

2. **Tokens Studio for Figmaプラグインを起動**
   - 右クリック → Plugins → Tokens Studio for Figma

3. **JSONをインポート**
   - Settings (⚙️) → Sync → Load from file
   - `docs/CSS_structure/design-token/tokens-studio.json` を選択

4. **トークンセットを確認**
   - 左サイドバーに `foundation`, `application`, `service-*` が表示されることを確認
   - 各トークンをクリックして、色や値が正しくインポートされているか確認

5. **Figmaで色調整（オプション）**
   - 必要に応じて、Tokens Studioプラグイン内でトークンの値を調整
   - 例: `foundation.color.cyan.400` を `#22d3ee` → `#00ffff` に変更

6. **調整した場合はエクスポート**
   - プラグイン内で「Export」をクリック
   - JSONファイルをダウンロードし、`docs/CSS_structure/design-token/tokens-studio.json` を上書き

---

## Step 3.2: CSS実装 (Layer 1の生成)

**目的**: `tokens-studio.json` をCSS変数形式に変換し、`globals.css` のLayer 1セクションを生成する。
**実行者**: AIエージェント
**入力**: `docs/CSS_structure/design-token/tokens-studio.json`（Figmaで調整された可能性あり）
**出力**: `app/styles/globals.css` の `/* LINT-LAYER: 1 */` セクションの更新

**変換ルール**:
`tokens-studio.json` の `foundation` セットのみが、`globals.css` のLayer 1セクションに変換されます。

**内容**:

- **Application Tokens**: JSON の `foundation` セクションを、`globals.css` の `:root` 内、`/* LINT-LAYER: 1 */` コメントブロック配下のCSS変数として定義します。

**注意**: このステップでは `tailwind.config.ts` や `globals.css` のLayer 2セクションは変更しません。

---

## Step 3.5: デザイントークン検証（ガードレール）

**目的**: 実装されたデザイントークンがアーキテクチャ規約を遵守しているか自動検証
**実行者**: AIエージェント
**入力**: `globals.css`
**出力**: 検証レポート（PASS/FAIL）

**検証項目**:

1. **Layer 1の規約遵守**:
   - Application Tokensがプリミティブ値（HEX, pxなど）のみを定義し、`var()` を使用していないこと。

2. **命名規則の遵守**:
   - Foundation: `--foundation-{category}-{name}` の形式に従っていること。

3. **禁止事項の検出**:
   - `!important` が使用されていないこと。

**実行方法**:

~~~bash
npm run lint:css-arch
~~~

**違反時の対処**:
AIエージェントは自動的にStep 2（スタイルガイド）に戻り、修正を実施してください。

---

## Step 4: ビジュアルレビュー (人間介入)

**目的**: 実装されたデザイントークンが、意図した世界観と一致しているかを目視で確認・承認する。
**実行者**: オペレーター（人間）
**入力**: `docs/CSS_structure/design-token/design-token-preview.html`
**出力**: 人間オペレーターによる承認、またはStep 3.1へのフィードバック

**生成方法**:
AIエージェントが、実装されたLayer 1トークンを網羅したスタンドアロンHTMLファイル (`docs/CSS_structure/design-token/design-token-preview.html`) を自動生成します。

**プレビューHTML仕様**:

- **スタンドアロン形式**: globals.cssの内容を`<style>`タグ内に埋め込み、単体で動作
- **セクション構成**:
  1. **Application Tokens**: カラーパレット（色見本 + HEX + トークン名）
  2. **Typography**: フォントサイズ・ウェイト・ファミリーのサンプル
  3. **Spacing**: 余白スケールの視覚化
  4. **Review Checklist**: 以下の項目をチェックボックス形式で提供

**レビューチェックリスト**:

- [ ] 色のトーンがconcept.mdの世界観と一致している
- [ ] コントラスト比がWCAG AA基準を満たしている（特にStatus色）
- [ ] フォントサイズのスケールが視覚的に自然な階層を形成している

**フィードバック方法**:
修正が必要な場合、オペレーターは以下のいずれかを選択します：

1. **Figmaで調整** (推奨): Step 3.1に戻り、Tokens Studioプラグイン内でトークン値を調整 → エクスポート → Step 3.2（CSS実装）を再実行
2. **スタイルガイド修正**: `docs/CSS_structure/design-token/style-guide.md` を直接編集 → Step 3（JSON生成）から再実行

**承認**:
全てのチェックリスト項目が満たされた場合、デザイントークン生成フローは完了です。
