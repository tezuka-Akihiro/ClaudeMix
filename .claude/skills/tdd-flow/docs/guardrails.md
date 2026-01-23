# ガードレール実行ルール

コード生成後、コミット前に以下のチェックを自律的に実行し、不合格の場合は自己修正してください。

## 📋 ガードレール一覧

| # | ガードレール項目 | 対応するスクリプト | 違反時の対処 | 実行タイミング |
| :--- | :--- | :--- | :--- | :--- |
| **I** | コーディング規律の強制 | `node scripts/lint-template/engine.js` | 行数制限（ファイル400行）や、デザイントークン以外のハードコードを検出。違反箇所を最小限の修正で是正。 | 各ファイル生成後 |
| **II** | スコープ逸脱の監視 | `node scripts/lint-template/engine.js` | 禁止ワード（例: プロジェクト範囲超過、不適切な外部サービス名）を提案または実装に含めていないかをチェック。違反箇所は直ちに削除し、MVPスコープを遵守。 | 設計書作成後 |
| **III** | スタイリング規律の強制 | `docs/CSS_structure/STYLING_CHARTER.md` | **実装者は常に「Tailwindクラス」のみを参照すること**。`globals.css`のカスタムクラスやトークンへの直接参照は禁止。階層飛越も禁止。 | CSS実装後 |
| **IV** | スタイリング規律の検証 | `npm run lint:css-arch` | `globals.css`の規約違反や、実装層でのTailwindユーティリティクラスの直接使用を検出。違反があった場合は、`tests/lint/css-arch-layer-report.md`の内容に従って修正。 | CSS実装後 |
| **V** | TypeScript検証 | `npm run typecheck` | 型エラーを検出。すべての型エラーを修正するまで次のステップに進まない。 | 実装後 |
| **VI** | ユニットテスト | `npm test` | 純粋ロジック層（lib）は100%カバレッジ必須。副作用層（data-io）は80%以上推奨。 | 実装後 |
| **VII** | E2Eテスト | `npm run test:e2e` | E2E Screen TestとE2E Section Testがすべて合格すること。 | Phase 5完了時 |

## 🔄 実行フロー

### Phase 1〜4（設計フェーズ）

各ドキュメント生成後に以下を実行：

```bash
# I. コーディング規律の強制
node scripts/lint-template/engine.js develop/{service}/{section}/{document}.md

# II. スコープ逸脱の監視（同じスクリプトで検出）
node scripts/lint-template/engine.js develop/{service}/{section}/{document}.md
```

### Phase 5（実装フェーズ）

#### CSS実装後

```bash
# III. スタイリング規律の強制（マニュアル確認）
# → docs/CSS_structure/STYLING_CHARTER.md を参照し、Layer 2, 3, 4の責務を遵守

# IV. スタイリング規律の検証
npm run lint:css-arch
```

#### 各ファイル実装後

```bash
# I. コーディング規律の強制
node scripts/lint-template/engine.js {file_path}

# V. TypeScript検証
npm run typecheck

# VI. ユニットテスト（該当ファイルのみ）
npm test {test_file_path}
```

#### Phase 5完了時（最終検証）

```bash
# すべてのガードレールを一括実行
node scripts/lint-template/engine.js  # I, II
npm run lint:css-arch                 # IV
npm run typecheck                      # V
npm test                               # VI
npm run test:e2e                       # VII
```

## 🚨 違反時の対処フロー

### 1. 違反の検出

ガードレールが違反を報告した場合、以下の順序で対処：

1. **エラーメッセージの分析**: 何が違反しているのかを特定
2. **原因の特定**: なぜ違反が発生したのかを理解
3. **修正方針の決定**: 最小限の修正で違反を解消する方法を決定
4. **修正の実行**: コードまたはドキュメントを修正
5. **再検証**: ガードレールを再実行し、合格を確認

### 2. 違反の種類別対処

#### I. コーディング規律違反（ファイル400行超過）

**対処**:

- ファイルを機能単位で分割
- 責務を明確にし、Single Responsibility Principleを適用

#### I. コーディング規律違反（ハードコード検出）

**対処**:

- ハードコードされた値を`*-spec.yaml`に移動
- `var(--token-name)`形式での参照に置換

#### II. スコープ逸脱（禁止ワード検出）

**対処**:

- 禁止ワードを削除
- MVPスコープに収まる代替案を検討

#### III/IV. スタイリング規律違反

**対処**:

- `STYLING_CHARTER.md`を再確認
- Layer 2, 3, 4の責務に従って修正
- マジックナンバーを`var(--*)`に置換

#### V. TypeScript型エラー

**対処**:

- 型定義を`app/specs/{service}/types.ts`に追加
- `any`型の使用を避け、適切な型を定義

#### VI. ユニットテスト失敗

**対処**:

- テストが失敗している原因を特定
- 実装を修正（テストが正しい場合）
- テストを修正（実装が正しい場合）
- 純粋ロジック層は100%カバレッジを達成するまで修正

#### VII. E2Eテスト失敗

**対処**:

- ブラウザテストのスクリーンショットを確認
- DOM構造やデータフローを検証
- UIコンポーネントやRouteの実装を修正

## 🎯 合格基準

すべてのガードレールが以下の状態になったときのみ、次のステップに進むことができます：

- ✅ **I, II**: `node scripts/lint-template/engine.js` が違反0件を報告
- ✅ **III**: `STYLING_CHARTER.md`の規約に準拠していることを確認
- ✅ **IV**: `npm run lint:css-arch` がエラー0件を報告
- ✅ **V**: `npm run typecheck` がエラー0件を報告
- ✅ **VI**: `npm test` がすべてのテストに合格
- ✅ **VII**: `npm run test:e2e` がすべてのE2Eテストに合格

## 📚 参照ドキュメント

- `docs/CSS_structure/STYLING_CHARTER.md`: スタイリング憲章
- `docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO2.md`: 3大層アーキテクチャの詳細
- `docs/boilerplate_architecture/ユニットテストの最低基準.md`: ユニットテストの基準
- `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md`: E2Eテストの基準
- `scripts/lint-template/README.md`: リントツールの使用方法
