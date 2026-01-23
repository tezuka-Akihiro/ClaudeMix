# 参照ドキュメント一覧

コードレビュー時に参照すべきプロジェクトドキュメントの一覧です。

## プロジェクトルール

### 1. アーキテクチャ定義

| ドキュメント | パス | 内容 |
|:---|:---|:---|
| アーキテクチャマニフェスト | `docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO.md` | 3大層アーキテクチャの定義 |
| YAML参照ガイド | `docs/boilerplate_architecture/YAML_REFERENCE_GUIDE.md` | spec.yamlの使用方法 |

**確認事項**:
- 3大層（ui/lib/data-io）の責務
- レイヤー間の依存方向
- Single Source of Truth (SSoT) の原則

### 2. TDDワークフロー

| ドキュメント | パス | 内容 |
|:---|:---|:---|
| TDDワークフロー | `develop/*/TDD_WORK_FLOW.md` | 機能ごとのTDD手順 |
| E2Eテスト基準 | `docs/boilerplate_architecture/E2E_TEST_CRITERIA.md` | E2Eテストの作成基準 |
| ユニットテスト基準 | `docs/boilerplate_architecture/ユニットテストの最低基準.md` | ユニットテストの最低基準 |

**確認事項**:
- Red-Green-Refactorサイクル
- E2Eテストのカバレッジ
- ユニットテストの命名規則

### 3. デザイン・UI

| ドキュメント | パス | 内容 |
|:---|:---|:---|
| デザイントークン仕様 | `docs/boilerplate_architecture/design-token-specification.md` | Tailwind CSSのトークン定義 |

**確認事項**:
- デザイントークンの使用
- カスタムクラスの回避
- レスポンシブ対応

## プロジェクト仕様

### 4. プロジェクト定義

| ドキュメント | パス | 内容 |
|:---|:---|:---|
| プロジェクト仕様 | `app/specs/shared/project-spec.yaml` | プロジェクト全体の設定 |
| サービス仕様 | `app/specs/services/*/spec.yaml` | 各サービスの仕様 |

**確認事項**:
- サービス定義との整合性
- spec.yamlの参照
- 設定値のハードコーディング回避

## コーディング規約

### 5. TypeScript規約

| 規約 | 内容 |
|:---|:---|
| 型定義 | interface/type を明示的に定義 |
| anyの使用 | 原則禁止（正当な理由がある場合のみ） |
| 型アサーション | as の乱用を避ける |
| null/undefined | オプショナル型（?）を適切に使用 |

### 6. 命名規則

| 対象 | 規則 | 例 |
|:---|:---|:---|
| ファイル名 | kebab-case | `progress-calculator.ts` |
| 関数名 | camelCase | `calculateProgress` |
| 型名 | PascalCase | `ProgressData` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| コンポーネント | PascalCase | `ProgressDisplay` |

### 7. ファイル構造

| レイヤー | パス | 内容 |
|:---|:---|:---|
| ui | `app/routes/` | Remixルート（loader/action含む） |
| ui | `app/components/` | UIコンポーネント |
| lib | `app/lib/[service]/` | 純粋関数（ビジネスロジック） |
| data-io | `app/data-io/` | DB操作、API通信等 |
| specs | `app/specs/` | spec.yamlファイル |
| tests | `tests/e2e/` | E2Eテスト（Playwright） |
| tests | `app/**/*.test.ts` | ユニットテスト（Vitest） |

## フレームワーク・ライブラリ

### 8. Remix

| ドキュメント | URL | 内容 |
|:---|:---|:---|
| Remix公式ドキュメント | https://remix.run/docs | Remixの公式ドキュメント |
| Cloudflare Pages | https://developers.cloudflare.com/pages | Cloudflare Pagesのドキュメント |

**確認事項**:
- loader/actionのデータフロー
- Form/useActionDataの使用
- SSR/CSRの理解

### 9. Cloudflare

| ドキュメント | URL | 内容 |
|:---|:---|:---|
| Cloudflare Workers | https://developers.cloudflare.com/workers | Workers APIのドキュメント |
| D1 Database | https://developers.cloudflare.com/d1 | D1（SQLite）のドキュメント |
| KV Storage | https://developers.cloudflare.com/kv | KVストレージのドキュメント |

**確認事項**:
- Workers APIの制約
- D1のクエリパフォーマンス
- KVのデータモデル

### 10. テストフレームワーク

| ツール | URL | 内容 |
|:---|:---|:---|
| Vitest | https://vitest.dev | ユニットテストフレームワーク |
| Playwright | https://playwright.dev | E2Eテストフレームワーク |

**確認事項**:
- Vitestのテスト記法
- Playwrightのセレクタ
- テストのモック

## レビュー時の参照順序

コードレビュー時は、以下の順序で参照してください：

1. **アーキテクチャマニフェスト**: レイヤー判定と責務確認
2. **TDDワークフロー**: テストの存在確認
3. **命名規則**: ファイル名・関数名の確認
4. **プロジェクト仕様**: spec.yamlとの整合性確認
5. **フレームワークドキュメント**: Remix/Cloudflareのベストプラクティス確認

## よくある参照ケース

### ケース1: lib層のレビュー

参照すべきドキュメント：
1. アーキテクチャマニフェスト（lib層の責務）
2. ユニットテスト基準（テストカバレッジ）
3. TypeScript規約（型定義）

### ケース2: ui層のレビュー

参照すべきドキュメント：
1. アーキテクチャマニフェスト（ui層の責務）
2. デザイントークン仕様（Tailwind CSS）
3. Remix公式ドキュメント（loader/action）
4. E2Eテスト基準

### ケース3: data-io層のレビュー

参照すべきドキュメント：
1. アーキテクチャマニフェスト（data-io層の責務）
2. Cloudflare D1/KVドキュメント
3. エラーハンドリング規約

---

このドキュメントは、レビュー時の参照用です。実際のレビュー手順は `prompts/01-review.md` を参照してください。
