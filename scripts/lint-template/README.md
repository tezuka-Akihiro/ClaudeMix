# Content Linter - AIガードレール品質チェックシステム

## 概要

Content Linterは、プロジェクト固有の制約とボイラープレートの範囲を守るためのAIガードレール機能を持つLintシステムです。AIが提案・実装する内容がプロジェクトの適切な範囲内に収まるよう監視します。

### 基本的な使用方法

```bash
# すべてのLintチェックを実行
node scripts/lint-template/engine.js <ファイルパスまたはディレクトリ>
```

### チェック対象

#### 📋 共通ルール（全ファイル対象）

1. **禁止ワードチェック** (`banned-words`) - AIガードレール機能
   - **プロジェクト範囲超過**: `MVP`, `将来`, `フェーズ2`, `フェーズ１`, `phase`, `ロードマップ`
     - 理由: このボイラープレートはMVP専用のため、将来拡張の提案は範囲外
   - **品質管理範囲超過**: `CI/CD`, `deploy`, `デプロイ`, `パイプライン`, `ビルド`
     - 理由: 品質管理はCI/CD以前の段階で扱うため、これらの言及は適切でない
   - **不適切な仮定**: `本格運用`, `プロダクション`, `スケーラビリティ`, `パフォーマンス最適化`
     - 理由: ボイラープレート段階での過度な最適化は不要
   - **外部サービス名**: `AWS`, `Firebase`, `Stripe`, `MongoDB`, `React`, `Next.js` など
     - 理由: 外部サービスは変更を前提とするため、汎用的な名前を使用すべき
   - **プロジェクト固有名**: プロジェクト名やサービス名など（今後追加予定）
     - 理由: サービス名は変更を前提とするため、汎用的な命名を推奨

2. **行数制限チェック** (`line-limit`)
   - ファイル: 400行まで（デフォルト）
   - ファイル分割の提案を自動生成

3. **デザイントークンチェック** (`design-tokens`)
   - ハードコードされた色値: `#ffffff`, `rgb(255,255,255)`
   - ハードコードされたサイズ: `16px`, `24px`
   - デザイントークン使用を強制

#### 🎨 スタイリング憲章ルール

`engine.js` に統合された、CSSアーキテクチャ（スタイリング憲章）を強制するためのガードレールです。すべてのルールは `config.json` で設定・管理されます。

- **責務**: スタイリング憲章（Layer 1, 2, 5）の規約が遵守されているかを検証します。
- **主な検証項目**:
  - **Layer 1 (`globals.css`)**:
    - `skin-layer1-atomic-values`: CSS変数が他の変数を参照せず、原子値のみを定義していることを保証します。
  - **Layer 2 (`layer2-*.css`)**:
    - `skin-layer2-alias-only`: CSS変数がLayer 1の`--foundation-*`トークンのみを参照していることを保証します。
  - **Layer 3/4 (`layer3.ts`, `layer4.ts`)**:
    - `structure-no-skin-properties`: `color`や`backgroundColor`などのスキン関連プロパティの使用を禁止し、構造定義に専念させます。
    - `structure-no-magic-numbers`: `#fff`や`16px`といったマジックナンバーの使用を禁止します。
  - **Layer 5 (`.tsx`, `.jsx`)**:
    - `tailwind-direct-usage`: Tailwindのユーティリティクラスの直接使用を禁止し、コンポーネントクラスの使用を強制します。

#### 🎯 テンプレート固有ルール

**作業手順書**（`workflow-structure`）:

- 7つの必須フロー存在確認
- TDD順序チェック（テストクラス実装 → 実装）
- `template-generate.js` コマンド存在確認
- ファイルパス構造の妥当性チェック

### 設定ファイル

#### `lint-config.json` - メインのLint設定

```json
{
  "version": "1.0.0",
  "commonRules": {
    "banned-words": {
      "enabled": true,
      "severity": "error",
      "words": ["MVP", "将来", "フェーズ2", "CI/CD", "deploy", "デプロイ"]
    },
    "line-limit": {
      "enabled": true,
      "maxLines": 400
    },
    "design-tokens": {
      "enabled": true,
      "severity": "error"
    }
  }
}
```

#### `template-config.json` - テンプレート設定

既存のテンプレート定義と連携。新しいテンプレート追加時は自動的に対応。

### 出力形式

#### コンソール出力

```text
📄 develop/sample手順書.md
  ❌ 必須フロー「機能設計書作成」が見つかりません [workflow-structure]
  ⚠️ 禁止ワード「フェーズ2」が使用されています [banned-words:プロジェクト範囲外]
  ⚠️ 禁止ワード「AWS」が使用されています [banned-words:外部サービス名]
  ⚠️ ファイルの行数が制限を超えています（450行 > 400行） [line-limit]

📊 Summary:
  Files: 10
  Errors: 2
  Warnings: 3
```

### ディレクトリ構造

```text
scripts/
└── lint/
    ├── engine.js       # メインのLintエンジン
    ├── config.json          # Lint設定
    ├── core.js              # ルール実行エンジン
    └── rules/               # ルールライブラリ (skin.js, structure.js, etc.)
```

## 🛠️ カスタマイズ・拡張方法

### 新しい共通ルールの追加

1. `scripts/lint-rules/common/` に新しいルールファイルを作成:

```javascript
// scripts/lint-rules/common/my-rule.js
const myRule = {
  name: 'my-rule',
  description: '私のカスタムルール',
  severity: 'warning',

  async check(content, filePath, config) {
    const violations = [];
    // チェックロジックを実装
    return violations;
  }
};

module.exports = myRule;
```

2. `scripts/lint-rules/common/index.js` に追加:

```javascript
const myRule = require('./my-rule');

const commonRules = {
  'my-rule': myRule,
  // ... 他のルール
};
```

3. `lint-config.json` で有効化:

```json
{
  "commonRules": {
    "my-rule": {
      "enabled": true,
      "severity": "warning"
    }
  }
}
```

### 新しいテンプレート固有ルールの追加

1. `scripts/lint-rules/template-specific/` に新しいルールファイルを作成
2. `lint-config.json` の `templateRules` セクションに追加
3. 自動的にシステムに統合されます

### 設定のカスタマイズ

#### 禁止ワードのカスタマイズ（AIガードレール）

```json
{
  "commonRules": {
    "banned-words": {
      "enabled": true,
      "words": [
        "MVP", "将来", "フェーズ2", "phase", "ロードマップ",
        "CI/CD", "deploy", "デプロイ", "パイプライン", "ビルド",
        "本格運用", "プロダクション", "スケーラビリティ"
      ],
      "externalServiceNames": [
        "AWS", "Firebase", "Stripe", "MongoDB", "React", "Next.js",
        "追加予定: プロジェクトで使用する外部サービス名"
      ],
      "projectSpecificNames": [
        "追加予定: プロジェクト固有の名前やサービス名"
      ],
      "allowInComments": false,
      "allowInStrings": true
    }
  }
}
```

#### 行数制限のカスタマイズ

```json
{
  "commonRules": {
    "line-limit": {
      "enabled": true,
      "maxLines": 500,
      "maxFunctionLines": 75,
      "excludeEmptyLines": true,
      "exceptions": {
        "filePatterns": ["*.config.js", "*.test.js"]
      }
    }
  }
}
```

#### デザイントークンのカスタマイズ

```json
{
  "commonRules": {
    "design-tokens": {
      "enabled": true,
      "patterns": {
        "prohibited": ["#[0-9a-fA-F]{6}", "\\d+px"],
        "allowed": ["var\\(--[a-z-]+\\)", "colors\\.[a-z.]+"]
      },
      "fileTypes": [".css", ".tsx", ".jsx"]
    }
  }
}
```

## 🚀 パフォーマンス

- **並列処理**: 複数ファイルを同時にチェック
- **早期終了**: エラー検出時に即座に停止
- **キャッシュ機能**: 設定で有効化可能（将来実装予定）
- **進捗表示**: 大量ファイル処理時の進捗確認

## 📊 レポート機能

### レポート出力

- **ファイル別グループ化**: 問題をファイルごとに整理
- **重要度別色分け**: エラー（赤）、警告（黄）、情報（青）
- **AIガードレール警告**: プロジェクト範囲外の提案を検出
- **修正提案**: 具体的な改善案を自動生成
- **統計情報**: チェック対象ファイル数、適用ルール数、問題数

## 🐛 トラブルシューティング

### よくある問題

1. **「設定ファイルが見つかりません」エラー**

   ```bash
   # lint-config.json が存在するか確認
   ls scripts/lint-config.json
   ```

2. **「ルールの読み込みに失敗」警告**

   ```bash
   # DEBUG モードで詳細を確認
   DEBUG=1 node scripts/lint-template/engine.js
   ```

3. **パフォーマンスが遅い**

   ```json
   // lint-config.json で並列数を調整
   {
     "lintEngine": {
       "maxConcurrency": 5,
       "earlyExit": true
     }
   }
   ```

### ログレベル

- **通常**: 結果のみ表示
- **詳細**: `DEBUG=1` で実行情報を表示
- **静寂**: 将来実装予定（`--quiet` オプション）

---
