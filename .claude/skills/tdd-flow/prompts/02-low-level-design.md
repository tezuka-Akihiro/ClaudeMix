# Phase 2: Low-Level Design (📚️🖼️)

あなたは、新規機能開発のLow-Level Design（低レベル設計）を実行します。

## 🎯 目的

**3大層分離**の観点で、機能設計書と画面仕様書を作成し、実装の詳細を定義する。

## 📋 成果物

1. **func-spec.md**: 機能設計書（3大層分離の観点で要件を定義）
2. **uiux-spec.md**: 画面仕様書（UI層の責務分離を意識）

## 📍 前提条件

- Phase 1が完了している（GUIDING_PRINCIPLES.mdが存在）
- セクション名が決定している

## ⚙️ 実行手順

### ステップ 1: func-spec.md（機能設計書）の生成

1. **generator-operator**スキルを使用してテンプレートを生成します。

   ```
   `generator-operator`スキルを使用してfunc-spec.mdを生成します。
   パラメータ: service={service}, section={section}
   ```

2. **出力先**: `develop/{service}/{section}/func-spec.md`

3. **内容記述**: `GUIDING_PRINCIPLES.md`を参考に、**3大層分離の観点**で以下を記述します：

   #### 🎨 app/components要件（UI層）

   - ユーザーインターフェース要件
   - ユーザー体験要件
   - データフロー制御（loader/action）
   - ページ構成とルーティング

   #### 🧠 純粋ロジック要件（lib層）

   - ビジネスルール（副作用なし）
   - 計算ロジック
   - データ変換
   - バリデーション
   - **重要**: 他の層をimport禁止（完全独立）

   #### 🔌 副作用要件（data-io層）

   - API通信
   - データベース操作
   - 外部システム連携
   - ファイルI/O
   - **重要**: 純粋ロジック層（lib）のimportは可能、UI層のimportは禁止

4. **検証**:

   ```bash
   node scripts/lint-template/engine.js develop/{service}/{section}/func-spec.md
   ```

### ステップ 2: uiux-spec.md（画面仕様書）の生成

1. **generator-operator**スキルを使用してテンプレートを生成します。

   ```
   `generator-operator`スキルを使用してuiux-spec.mdを生成します。
   パラメータ: service={service}, section={section}
   ```

2. **出力先**: `develop/{service}/{section}/uiux-spec.md`

3. **内容記述**: `GUIDING_PRINCIPLES.md`を参考に、**UI層の責務分離**を意識して以下を記述します：

   #### Route責務

   - データフロー制御（loader/action）
   - ページ全体の構成
   - 副作用層（data-io）のみimport可能
   - 最小限のJSX（20行以下の単純な表示ロジック）

   #### Component責務

   - 再利用可能なUI部品
   - 純粋な表示ロジック（propsで受け取ったデータの表示）
   - インタラクション制御（ユーザー操作のハンドリング）

   #### その他

   - ワイヤーフレーム
   - UIコンポーネント構成
   - インタラクション仕様

4. **検証**:

   ```bash
   node scripts/lint-template/engine.js develop/{service}/{section}/uiux-spec.md
   ```

### ステップ 3: 設計レビュー

以下をオペレーター（人間）に報告し、承認を得る：

1. **3大層分離の適用**:
   - UI層、純粋ロジック層、副作用層の責務が明確に分離されているか
   - 各層の依存関係が正しいか（UI→data-io、data-io→lib、libは独立）

2. **機能要件の網羅性**:
   - ビジネスロジック、API通信、UI/UXすべてがカバーされているか

3. **次フェーズへの準備**:
   - Phase 3（Design Artifacts）で必要な情報が揃っているか

## ✅ 完了条件

- [ ] func-spec.mdが生成され、リント検証が合格している
- [ ] uiux-spec.mdが生成され、リント検証が合格している
- [ ] 3大層分離の観点で要件が定義されている
- [ ] UI層の責務分離（Route/Component）が明確になっている
- [ ] オペレーターの承認を得ている

## 🔗 次フェーズ

**Phase 3: Design Artifacts** (`prompts/03-design-artifacts.md`)

## 📚 参照ドキュメント

- `docs/generator-collaboration.md`: テンプレート生成の詳細手順
- `docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO2.md`: 3大層アーキテクチャの詳細
- `develop/{service}/GUIDING_PRINCIPLES.md`: サービスの指導原則
