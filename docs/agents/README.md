# サブエージェント利用ガイド

**開発支援専門サブエージェント群**

**バージョン**: 4.0（Claude Code Skills準拠）
**最終更新**: 2025-11-17

---

## 📋 概要

このドキュメントは、Remixボイラープレート開発を支援する**5つの専門サブエージェント**の利用ガイドです。

**実体ファイル**: `.claude/skills/` 配下に Claude Code Skills フォーマットで配置されています。

### サブエージェント構成

~~~
                  ┌─────────────────┐
                  │ メインエージェント  │
                  └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│Generator     │   │Code          │   │Debugger      │   │Architecture  │
│Operator      │◄─►│Reviewer      │◄─►│              │◄─►│Guardian      │
│(ファイル生成)  │   │(品質保証)     │   │(問題解決)     │   │(設計守護)     │
└──────┬───────┘   └──────────────┘   └──────────────┘   └──────────────┘
       │
       ▼
┌──────────────┐
│Generator     │
│Maintainer    │
│(テンプレート管理)│
└──────────────┘
       │
       ▼
┌────────────────────────────────────────┐
│      scripts/generate/ (既存ツール)      │
└────────────────────────────────────────┘
~~~

---

## 🎯 各エージェントの役割

### 1. GeneratorOperator（ファイル生成専門家）

**コアミッション**: ファイル生成依頼を確実に実行し、エラー時には即座に対応する。

**責務**:

- ✅ **【使用】** ユーザーの「〜を作成して」に対応
- ✅ **【運用】** エラー診断と修正提案

**得意なこと**:

- コマンド構築と実行
- エラーログ分析
- ユーザー支援

**詳細**: [.claude/skills/generator-operator.md](../../.claude/skills/generator-operator.md)

---

### 2. GeneratorMaintainer（テンプレート保守専門家）

**コアミッション**: テンプレートとconfig.jsonを管理し、3大層アーキテクチャの整合性を守護する。

**責務**:

- ✅ **【保守】** テンプレート追加/編集/削除
- ✅ **【保守】** 整合性監査と違反検出

**得意なこと**:

- テンプレート設計
- config.json管理
- 3大層アーキテクチャ準拠チェック

**詳細**: [.claude/skills/generator-maintainer.md](../../.claude/skills/generator-maintainer.md)

---

### 3. CodeReviewer（品質保証専門家）

**コアミッション**: 3大層アーキテクチャ、TDD原則、コーディング規約への準拠をチェックし、品質を保証する。

**責務**:

- ✅ **アーキテクチャ準拠チェック**: 3大層分離の検証
- ✅ **TDD準拠チェック**: テストファースト、カバレッジ確認
- ✅ **コーディング品質チェック**: TypeScript、命名規則、構造

**得意なこと**:

- レイヤー別違反検出
- スコアリング（100点満点）
- 改善提案の生成

**詳細**: [.claude/skills/code-reviewer.md](../../.claude/skills/code-reviewer.md)

---

### 4. Debugger（問題解決専門家）

**コアミッション**: バグや実行時エラーの根本原因を特定し、最適な修正方法を提案する。

**責務**:

- ✅ **エラー診断**: 実行時エラー、テスト失敗の分析
- ✅ **根本原因分析**: 5 Whys法による深掘り
- ✅ **修正案提示**: 複数アプローチ（Pros/Cons付き）

**得意なこと**:

- スタックトレース分析
- レイヤー別デバッグ戦略
- 再発防止策の提案

**詳細**: [.claude/skills/debugger.md](../../.claude/skills/debugger.md)

---

### 5. ArchitectureGuardian（設計思想守護専門家）

**コアミッション**: 設計提案から自動監査まで、開発ライフサイクル全体でプロジェクト固有のアーキテクチャ規約を保護・推進する。

**責務**:

- ✅ **設計提案**: 新機能開発の設計段階で3大層アーキテクチャに準拠した設計を提案
- ✅ **違反検出**: アーキテクチャ規約違反を手動・自動で検証
- ✅ **開発者教育**: プロジェクトの設計思想を教育し理解度を向上

**得意なこと**:

- Outside-In TDDフローの設計提案
- 3大層アーキテクチャ違反の検出
- デザイントークンシステムの遵守チェック
- Remixアーキテクチャへの適合検証

**詳細**: [.claude/skills/architecture-guardian.md](../../.claude/skills/architecture-guardian.md)

---

## 🚀 利用方法

### 基本的な流れ

#### 1. ファイル生成依頼（GeneratorOperator）

~~~
ユーザー: ProgressSummaryコンポーネントを作成して

↓（メインエージェントが振り分け）

GeneratorOperator起動:
1. 意図解析（category: ui, name: ProgressSummary）
2. 情報収集（service, section）
3. コマンド実行
4. 結果報告
~~~

**呼び出し方（メインエージェント向け）**:

~~~markdown
@GeneratorOperator

ユーザー依頼:
「ProgressSummaryコンポーネントを作成して」

対応をお願いします。
~~~

---

#### 2. エラー対応（GeneratorOperator）

~~~
ユーザー: generate実行したらエラーが出た
[エラーログ貼り付け]

↓

GeneratorOperator起動:
1. エラー分類
2. 責任範囲判定
3-a. 対応可能 → 修正提案
3-b. テンプレート問題 → GeneratorMaintainerへエスカレーション
~~~

---

#### 3. テンプレート追加（GeneratorMaintainer）

~~~
ユーザー: 新しいドキュメントタイプ「デプロイメント手順書」を追加したい

↓

GeneratorMaintainer起動:
1. ヒアリング（パスパターン、内容）
2. 整合性検証（パス衝突、3大層準拠）
3. 実装（config更新、テンプレート作成）
4. 動作確認
5. GeneratorOperatorへ通知
~~~

**呼び出し方（メインエージェント向け）**:

~~~markdown
@GeneratorMaintainer

ユーザー依頼:
「デプロイメント手順書のテンプレートを追加したい」

対応をお願いします。
~~~

---

#### 4. エスカレーション（Operator → Maintainer）

~~~
GeneratorOperatorがテンプレート欠落を検知

↓

GeneratorMaintainer起動（エスカレーション受理）:
1. エスカレーション内容確認
2. ユーザーとヒアリング
3. テンプレート作成
4. GeneratorOperatorへ通知

↓

GeneratorOperator: ユーザーへ再実行を促す
~~~

---

## 📊 依頼振り分けガイド（メインエージェント向け）

| ユーザーの依頼キーワード | 振り分け先 | 理由 |
|:---|:---|:---|
| 「〜を作成」「generate実行」 | GeneratorOperator | ファイル生成実行 |
| 「generate エラー」「generate 失敗」 | GeneratorOperator | ファイル生成エラー対応 |
| 「テンプレート追加」「新しいタイプ」 | GeneratorMaintainer | テンプレート管理 |
| 「config確認」「整合性チェック」 | GeneratorMaintainer | 保守作業 |
| 「コードレビュー」「品質チェック」 | CodeReviewer | コード品質保証 |
| 「〜を確認して」「違反チェック」 | CodeReviewer | アーキテクチャ準拠確認 |
| 「エラーが出た」「テスト失敗」 | Debugger | 実行時エラー・テスト失敗 |
| 「バグ調査」「動かない」 | Debugger | 問題解決 |
| 「遅い」「パフォーマンス」 | Debugger | パフォーマンス問題 |
| 「設計提案」「アーキテクチャ設計」 | ArchitectureGuardian | 設計段階での支援 |
| 「アーキテクチャ違反」「規約チェック」 | ArchitectureGuardian | アーキテクチャ監査 |

---

## 🔗 エージェント間連携プロトコル

### 連携パターン1: GeneratorOperator → Maintainer

**シーン**: テンプレート欠落エスカレーション

~~~markdown
@GeneratorMaintainer

【エスカレーション】

タイプ: template-missing
エラー: Template file 'xxx.template.md' not found

【ユーザー依頼】
API仕様書を作成したい

【診断結果】
- config.jsonに定義あり
- テンプレートファイルが存在しない

【推奨対応】
xxx.template.md の作成
~~~

### 連携パターン2: Maintainer → Operator

**シーン**: テンプレート追加完了通知

~~~markdown
@GeneratorOperator

【テンプレート追加完了】

タイプ: template-added
対象: api-spec
Breaking: false

詳細:
- API仕様書テンプレートを追加
- カテゴリ: documents
- 利用方法: --category documents --document-type api-spec

ユーザーのリクエストを再実行可能です。
~~~

### 連携パターン3: メインエージェント → CodeReviewer → Debugger

**シーン**: コード実装後の品質保証とバグ修正

~~~
1. メインエージェント: コード実装完了
   ↓
2. @CodeReviewer: レビュー実行 → テスト失敗を発見
   ↓
3. @Debugger へエスカレーション
   ↓
4. Debugger: 根本原因分析 + 修正案提示
   ↓
5. メインエージェント: 修正実施
   ↓
6. @CodeReviewer: 再レビュー → 承認
~~~

### 連携パターン4: GeneratorOperator → CodeReviewer

**シーン**: ファイル生成後の品質チェック

~~~
1. @GeneratorOperator: ファイル生成完了
   ↓
2. （オプション）@CodeReviewer: 生成コードのレビュー
   ↓
3-a. 問題なし → 完了
3-b. アーキテクチャ違反 → @GeneratorMaintainer（テンプレート修正）
3-c. ロジックエラー → @Debugger（修正案提示）
~~~

---

## 📚 実装状況

### Phase 1: プロンプトテンプレート作成 ✅

- [x] generator-operator.md
- [x] generator-maintainer.md
- [x] code-reviewer.md
- [x] debugger.md
- [x] architecture-guardian.md
- [x] README.md（本ファイル）
- [x] Claude Code Skills準拠（.claude/skills/配下に配置）

### Phase 2: 統合テスト（予定）

- [ ] generator-operator単体テスト
- [ ] generator-maintainer単体テスト
- [ ] code-reviewer単体テスト
- [ ] debugger単体テスト
- [ ] architecture-guardian単体テスト
- [ ] エスカレーションフロー統合テスト

### Phase 3: ドキュメント整備（完了）

- [ ] ユーザーガイド作成
- [ ] トラブルシューティングガイド
- [x] README.md更新（5エージェント対応、Skills準拠）
- [x] Claude Code Skills準拠化（v4.0）
- [ ] CLAUDE.md更新

---

## 🎯 設計原則

### 1. 単一責任原則

各エージェントは1つの明確な責務を持つ:

- **Operator**: 実行とエラー対応
- **Maintainer**: 設計と整合性維持

### 2. 疎結合

エージェント間は明確なインターフェース（エスカレーション/通知）で連携。

### 3. 3大層アーキテクチャとの整合

両エージェントは、ボイラープレートの核心思想である「3大層分離」を守護する。

特にMaintainerは、新規テンプレート追加時に以下をチェック:

- lib層: 純粋関数のみ、他層import禁止
- data-io層: 副作用OK、lib活用、UIコードimport禁止
- UI層: loader/action、data-ioのみimport、JSX簡潔

---

## 🔍 トラブルシューティング

### Q1: どちらのエージェントを呼ぶべきかわからない

**A**: 以下の基準で判断:

| 質問 | Yes → | No → |
|:---|:---|:---|
| ファイルを生成したい？ | GeneratorOperator | 次へ |
| エラーが発生した？ | GeneratorOperator | 次へ |
| テンプレートを追加/編集したい？ | GeneratorMaintainer | 次へ |
| 設定を確認したい？ | GeneratorMaintainer | - |

### Q2: GeneratorOperatorがエラーを解決できない

**A**: GeneratorOperatorが自動的にGeneratorMaintainerへエスカレーションします。待機してください。

### Q3: テンプレート追加後、GeneratorOperatorが認識しない

**A**: GeneratorMaintainerからの通知を確認してください。通知がない場合、Maintainerに「整合性チェック」を依頼してください。

---

## 📖 参考ドキュメント

### アーキテクチャ

- [ARCHITECTURE_MANIFESTO2.md](../../ARCHITECTURE_MANIFESTO2.md) - 3大層アーキテクチャの定義
- [サブエージェント詳細仕様書](../サブエージェント詳細仕様書_2エージェント分割版.md) - 完全な技術仕様

### ツール

- [scripts/generate/README.md](../../../scripts/generate/README.md) - `npm run generate` コマンドの説明
- [scripts/generate/config.json](../../../scripts/generate/config.json) - テンプレート定義

---

## 🎉 成功指標

| 指標 | 目標値 |
|:---|:---|
| ファイル生成成功率 | 95%以上 |
| エラー解決時間 | 平均5分以内 |
| テンプレート追加リードタイム | 30分以内 |
| 整合性違反検出率 | 100% |

---

## 📝 変更履歴

| バージョン | 日付 | 変更内容 |
|:---|:---|:---|
| 4.0 | 2025-11-17 | Claude Code Skills準拠化（.claude/skills/に移動、5エージェント構成） |
| 3.0 | 2025-10-02 | 4エージェント構成（CodeReviewer, Debugger追加） |
| 2.0 | 2025-10-01 | 2エージェント分割版リリース |
| 1.0 | 2025-09-XX | 初版（1エージェント版、廃止） |

---

**策定者**: Claude Code
**承認者**: 開発チーム
**次のアクション**: CLAUDE.md更新、統合テスト実施
