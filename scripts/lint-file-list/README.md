# File List Linter (`lint-file-list`)

## 1. 概要

このスクリプトは、`file-list.md`に定義されたファイルと実際のファイルシステムの整合性を検証するためのLintツールです。

- **目的**: 設計書（file-list.md）と実装の乖離を自動検出し、設計と実装の一貫性を維持します。
- **対象**: 各セクションの`file-list.md`で定義されたファイルパス
- **基本的な使い方**: `node scripts/lint-file-list/check-diff.js <develop-section-path>`

## 2. インストール

このスクリプトはプロジェクトに同梱されており、追加のインストールは不要です。

## 3. 検証内容

### 検出される違反

1. **未定義ファイル（Undefined Files）**
   - 実際に存在するが、`file-list.md`に定義されていないファイル
   - **重要度**: エラー（exit code 1）
   - **対処方法**:
     - 不要なファイルの場合 → 削除
     - 必要なファイルの場合 → `file-list.md`に追加

2. **不足ファイル（Missing Files）**
   - `file-list.md`に定義されているが、実際には存在しないファイル
   - **重要度**: 情報（exit code 0）
   - **対処方法**: 実装の進捗状況として確認

### 検証対象

- **ディレクトリ**: `app/` 配下のすべてのファイル
- **拡張子**: `.ts`, `.tsx`, `.js`, `.jsx`
- **除外パターン**:
  - `node_modules/`
  - `.git/`
  - `build/`, `dist/`
  - `public/build/`
  - `tests/`（`file-list.md`のパース時も除外）

## 4. 使用方法

### Lintの実行

ターミナルで以下のコマンドを実行します。引数には`file-list.md`が存在するディレクトリのパスを指定します。

```bash
node scripts/lint-file-list/check-diff.js <develop-section-path>
```

**例**:
```bash
# implementation-flowセクションを検証
node scripts/lint-file-list/check-diff.js develop/flow-auditor/implementation-flow/

# design-flowセクションを検証
node scripts/lint-file-list/check-diff.js develop/flow-auditor/design-flow/

# commonセクションを検証
node scripts/lint-file-list/check-diff.js develop/flow-auditor/common/
```

### コマンドライン引数

- `<develop-section-path>`: (必須) 検証対象セクションのパスを指定します。
  - このパス配下の`file-list.md`が読み込まれます。

### 結果の解釈

#### 差分なしの場合（成功）

```
✅ file-list.mdと実装ファイルの整合性が確認されました
   定義ファイル数: 17
   実装ファイル数: 17
```

- **Exit Code**: 0
- **意味**: すべてのファイルが`file-list.md`に正しく定義されています。

#### 未定義ファイルが検出された場合（エラー）

```
❌ file-list.mdに未定義のファイルが3件検出されました:

  📄 app/components/flow-auditor/implementation-flow/UnexpectedComponent.tsx
  📄 app/lib/flow-auditor/implementation-flow/unexpectedLogic.ts
  📄 app/data-io/flow-auditor/implementation-flow/unexpectedApi.server.ts

対処方法:
  1. 不要なファイルの場合 → 削除してください
  2. 必要なファイルの場合 → file-list.mdに追加してください

file-list.md: develop/flow-auditor/implementation-flow/file-list.md
```

- **Exit Code**: 1
- **意味**: 設計書に記載されていないファイルが実装されています。
- **対処**: 上記メッセージに従って、ファイルを削除するか`file-list.md`に追加してください。

#### 不足ファイルがある場合（情報）

```
ℹ️  file-list.mdに定義されているが実在しないファイルが2件あります:

  📄 app/components/flow-auditor/implementation-flow/PlannedComponent.tsx
  📄 app/lib/flow-auditor/implementation-flow/plannedLogic.ts
```

- **Exit Code**: 0（未定義ファイルがない場合）
- **意味**: まだ実装されていないファイルがあります。
- **対処**: 実装の進捗状況として確認してください。

## 5. file-list.mdのフォーマット

このツールは、以下のフォーマットのマークダウンテーブルを解析します。

```markdown
## セクション名

| ファイル名 | パス | 説明 |
|:---|:---|:---|
| Component.tsx | app/components/Component.tsx | コンポーネント |
| Logic.ts | app/lib/logic.ts | ロジック |
```

### 解析ルール

1. **ヘッダー行の検出**: 「ファイル名」と「パス」の両方を含む行をテーブルのヘッダーとして認識
2. **パス列の抽出**: 「パス」列（通常は2列目）の値を抽出
3. **除外**: `tests/` で始まるパスは自動的に除外
4. **重複削除**: 同じパスが複数回定義されている場合は、1つにまとめられます

## 6. AIガードレールとしての位置づけ

このツールは、`CLAUDE.md`で定義された **第5のガードレール** として機能します。

| ガードレール項目 | 対応するスクリプト | 違反時の対処 |
|:---|:---|:---|
| **V. ファイルリスト整合性の検証** | `node scripts/lint-file-list/check-diff.js <develop-section-path>` | file-list.mdに未定義のファイルを検出。設計書への追加または不要ファイルの削除を実施。 |

### AI開発フローへの統合

1. **コミット前チェック**: ファイル実装後、コミット前にこのツールを実行
2. **設計と実装の同期**: 新しいファイルを追加する際は、`file-list.md`の更新を忘れずに
3. **レビューの効率化**: 未定義ファイルの検出により、設計書の更新漏れを防止

## 7. ディレクトリ構造

```
scripts/lint-file-list/
├── check-diff.js                      # CLIエントリーポイント
├── lib/
│   ├── parseFileListMarkdown.js       # file-list.mdパーサー（純粋関数）
│   ├── calculateFileDiff.js           # 差分計算ロジック（純粋関数）
│   └── scanDirectory.js               # ファイルスキャン（Node.js fs使用）
├── tests/
│   ├── parseFileListMarkdown.test.js  # パーサーのテスト
│   ├── calculateFileDiff.test.js      # 差分計算のテスト
│   └── scanDirectory.test.js          # ファイルスキャンのテスト
├── vitest.config.js                   # テスト設定
└── README.md                          # このファイル
```

## 8. テストの実行

ユニットテストは以下のコマンドで実行できます。

```bash
npx vitest run scripts/lint-file-list/tests/ --config scripts/lint-file-list/vitest.config.js
```

- **テストファイル数**: 3ファイル
- **テストケース数**: 22テスト
- **カバレッジ**: すべてのコア機能をカバー

## 9. トラブルシューティング

### 「file-list.mdが見つかりません」エラー

```bash
❌ エラー: file-list.mdが見つかりません: develop/example/file-list.md
```

**原因**: 指定されたパス配下に`file-list.md`が存在しない場合に表示されます。

**対処法**:
1. パスが正しいか確認してください
2. `file-list.md`が存在するか確認してください
   ```bash
   ls develop/flow-auditor/implementation-flow/file-list.md
   ```

### 「app/ディレクトリが見つかりません」エラー

```bash
❌ エラー: app/ディレクトリが見つかりません
```

**原因**: プロジェクトルートから実行されていない可能性があります。

**対処法**: プロジェクトルートディレクトリで実行してください。
```bash
cd /path/to/Remix-boilerplate
node scripts/lint-file-list/check-diff.js develop/flow-auditor/implementation-flow/
```

### パス正規化の問題（Windows環境）

Windowsのパス区切り文字（`\`）は自動的にスラッシュ（`/`）に正規化されます。特別な対処は不要です。

### 大量の未定義ファイルが検出される

**原因**: プロジェクト全体のファイルが検出されている可能性があります。

**対処法**: これは正常な動作です。`file-list.md`は特定のセクションに関連するファイルのみを定義します。プロジェクト全体のファイルが検出される場合は、以下のいずれかの対処を行ってください。

1. **共通ファイルを別のfile-list.mdに分離**: `develop/flow-auditor/common/file-list.md`を作成し、共通ファイルを定義
2. **スコープの明確化**: 各セクションの`file-list.md`で管理するファイルのスコープを明確にする

## 10. 今後の拡張予定

### Phase 2: UI統合

運用開始後、以下の条件が確認された場合、UI統合（flow-auditorへの統合）を検討します。

- lintコマンドの実行忘れが頻発
- flow-auditorのUIで一元管理したいという強い要望
- リアルタイム可視化の必要性が確認される

UI統合時は、`scripts/lint-file-list/lib/*.js`を`app/lib/flow-auditor/`へ移植し、Remixの`loader`から呼び出す形で実装します。

---

## 11. 関連ドキュメント

- [CLAUDE.md](../../CLAUDE.md) - AIガードレール機構の定義
- [開発計画書](../../develop/lint-file-list実装計画書.md) - 実装の詳細設計
- [既存lintツール](../lint-template/README.md) - 他のガードレールツール
