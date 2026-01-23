# Phase 1: High-Level Design (▶️🗾)

あなたは、新規機能開発のHigh-Level Design（高レベル設計）を実行します。

## 🎯 目的

プロジェクト全体の設計方針を定義し、サービス・セクションの**指導原則**を確立する。

## 📋 成果物

1. **REQUIREMENTS_ANALYSIS_PIPE.md**: 設計フローの手順書（テンプレート使用）
2. **GUIDING_PRINCIPLES.md**: サービスの指導原則

## 📍 前提条件

- `app/specs/shared/project-spec.yaml`が存在し、プロジェクト情報が定義されている
- サービス名（例: `blog`, `account`）が決定している
- セクション名（例: `posts`, `authentication`）が決定している

## ⚙️ 実行手順

### ステップ 1: GUIDING_PRINCIPLES.mdの生成

1. **generator-operator**スキルを使用してテンプレートを生成します。

   ```
   `generator-operator`スキルを使用してGUIDING_PRINCIPLES.mdを生成します。
   パラメータ: service={service}
   ```

2. **出力先**: `develop/{service}/GUIDING_PRINCIPLES.md`

3. **内容記述**:
   - `app/specs/shared/project-spec.yaml`を参考に以下を記載します：
     - サービスの目的（Purpose）
     - ターゲットユーザー（Target）
     - 提供価値（Value Proposition）
     - アーキテクチャ原則（3大層分離の適用方針）

4. **検証**:

   ```bash
   node scripts/lint-template/engine.js develop/{service}/GUIDING_PRINCIPLES.md
   ```

### ステップ 2: プロジェクト全体の確認

1. `app/specs/shared/project-spec.yaml`を読み込み、以下を確認：
   - プロジェクト名、コンセプト、ターゲット
   - 各サービスの定義と責務
   - 各セクションの`abstract_purpose`と`specific_purpose`

2. **commonセクションの確認**:
   - `common`セクションは、サービス全体で共有される共通コンポーネント（ヘッダー、フッターなど）を扱う架空のセクションです
   - **実装順序**: `common`セクションは、他のセクション（posts, authenticationなど）よりも**先に実装**してください
   - **コンポーネント配置**: `app/components/{service}/common/`配下に配置します
   - **設計書の作成**: `develop/{service}/common/`配下に設計書を作成します

### ステップ 3: 次フェーズへの準備

GUIDING_PRINCIPLES.mdの内容を確認し、以下をオペレーター（人間）に報告：

1. サービスの目的と責務が明確に定義されているか
2. 3大層分離の適用方針が記述されているか
3. 次フェーズ（Low-Level Design）で必要な情報が揃っているか

## ✅ 完了条件

- [ ] GUIDING_PRINCIPLES.mdが生成され、リント検証が合格している
- [ ] サービスの目的と責務が明確に定義されている
- [ ] 3大層分離の適用方針が記述されている
- [ ] commonセクションの実装順序を理解している

## 🔗 次フェーズ

**Phase 2: Low-Level Design** (`prompts/02-low-level-design.md`)

## 📚 参照ドキュメント

- `docs/generator-collaboration.md`: REQUIREMENTS_ANALYSIS_PIPEの詳細手順
- `app/specs/shared/project-spec.yaml`: プロジェクト全体の定義
- `docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO2.md`: 3大層アーキテクチャの詳細
