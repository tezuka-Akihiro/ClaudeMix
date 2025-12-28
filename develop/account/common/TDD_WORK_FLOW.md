# TDD作業手順書: Common Components (共通コンポーネント)

## 1. 概要

**開発名**: Common Components (共通コンポーネント) の実装
**目的**: アカウントサービス全体で統一されたレイアウト、セッション管理、認証保護、UIコンポーネントを提供し、セキュアで一貫性のあるユーザー体験を実現する

**実装優先度**: **CRITICAL** - 他のセクション（authentication、profile、subscription）が依存するため、**最優先**で実装

## 2. 開発方針

- **Outside-In TDD (外側から内側へのTDD)**: ユーザーの振る舞いを定義するE2Eテスト（外側）から開発を始め、それをパスさせるために必要な各層の機能（内側）をユニットTDDで実装します。これは **受け入れテスト駆動開発 (ATDD)** の一種です。
- **段階的E2Eテスト戦略**:
    1. **E2Eファースト**: 最初に主要な成功シナリオ（Happy Path）のE2Eテストを1つだけ作成し、開発の最終ゴールを定義します。
    2. **Double-Loop TDD**: E2Eテスト（Outer Loop）をパスさせるために、各層（UI, Logic, Data-IO）でユニットテスト（Inner Loop）のTDDサイクルを回して実装を進めます。
    3. **E2E拡張**: 最初のE2Eテストが成功した後、エラーケースや境界値などの詳細なE2Eテストを追加し、品質を盤石にします。

---

## 3. 作業手順 (WBS)

### Phase 1: E2Eファースト (Happy Pathの定義) 🔴未着手

- **1. E2Eテストの準備**:
  - テストファイル `tests/e2e/account/common.spec.ts` を**新規作成**します。
    - **依頼例**: `@GeneratorOperator "account サービス common のE2Eテストを作成して"`
  - **テストシナリオ**（Happy Path）:
    - 認証済みユーザーが `/account` にアクセス
    - AccountLayout が正しくレンダリングされる
    - AccountNav に3つのナビゲーション項目（マイページ、設定、サブスクリプション）が表示される
    - 現在のページ（マイページ）がハイライトされる
    - 未認証ユーザーが `/account` にアクセス → `/login?redirect-url=/account` へリダイレクト
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、開発のゴールを定義します。
- **2. テストの失敗を確認**: `npm run test:e2e` を実行し、実装がまだ存在しないため、このテストが失敗すること（RED）を確認します。
  - この失敗したテストが、Phase 2で実装すべき機能の明確なゴールとなります。

### Phase 2: CSS実装（Layer 2/3/4） 🔴未着手

**目的**: `uiux-spec.md` で設計した内容を、実際のCSSファイルとして実装します。

**実装対象**:

1. **Layer 2**: `app/styles/account/layer2-common.css`
2. **Layer 3**: `app/styles/account/layer3.ts`
3. **Layer 4**: `app/styles/account/layer4.ts`（必要な場合のみ）

**段階的更新の運用**:

- `uiux-spec.md` で該当セクションのコンポーネント設計を行い、このフェーズで既存のCSS実装ファイルに追記します
- **共通化の検討**: 既存セクションに類似コンポーネントがある場合、必ず共通化を検討してください
- **整合性の確認**: 追加時は、既存実装との整合性（命名規則、トークン使用等）を確認してください

**手順**:

1. **Layer 2 実装**:
   - `uiux-spec.md` で定義したコンポーネントを元に `layer2-common.css` を実装
   - コンポーネントセレクタ (`.{component}-{variant?}`) で定義
   - 共通コンポーネント: `.btn-{variant}`, `.form-field`, `.error-message-{variant}`, `.flash-message-{variant}`, `.modal`, `.badge-{variant}`, `.account-nav`, `.account-layout`
   - すべての値は `var(--*)` でLayer 1トークンを参照

2. **Layer 3 実装**:
   - `uiux-spec.md` の「認定済み並列配置」セクションを元に `layer3.ts` を実装
   - Tailwind plugin形式（`addComponents`）でレイアウトを定義
   - レイアウトクラス: `.nav-horizontal`, `.form-field-group`, `.modal-container`, `.button-group`
   - gap のみ `var(--spacing-*)` を直接参照可能

3. **Layer 4 実装**（必要な場合のみ）:
   - `uiux-spec.md` で定義した例外的な構造を元に `layer4.ts` を実装
   - 例外的な構造のみを定義

4. **検証**:

   ```bash
   npm run lint:css-arch
   ```

   - 違反が検出された場合は `tests/lint/css-arch-layer-report.md` の内容に従って修正

5. **確認事項**:
   - ✅ Layer 2で色・サイズ・タイポグラフィが定義されている
   - ✅ Layer 3でフレックス・グリッドレイアウトのみが定義されている
   - ✅ margin が使用されていない（gap統一の原則）
   - ✅ `!important` が使用されていない
   - ✅ リント検証に合格している

### Phase 3: 層別TDD (ユニット/コンポーネント実装) 🔴未着手

#### 3.1. 副作用層の実装（Phase 2.1）

**実装順序**: 副作用層 → 純粋ロジック層 → UI層 の順で実装（依存関係の逆順）

##### 3.1.1. セッション管理の実装

- **1. getSession.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、getSession.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: `getSession.server.test.ts` に以下のテストを記述:
    - Cookieにセッションが存在する場合、KVからSessionDataを取得
    - Cookieが存在しない場合、nullを返却
    - KVにデータが存在しない場合、nullを返却
  - **実装 (GREEN)**: Cloudflare Workers KVからセッションを取得する実装
  - **リファクタリング**: エラーハンドリングを改善

- **2. saveSession.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、saveSession.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: TTL設定、Cookie生成のテスト
  - **実装 (GREEN)**: Cloudflare Workers KVにセッションを保存
  - **リファクタリング**: Cookie生成ロジックを整理

- **3. destroySession.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、destroySession.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: KV削除、Cookie無効化のテスト
  - **実装 (GREEN)**: セッション削除とCookie無効化
  - **リファクタリング**: リソース管理を改善

- **4. getUserById.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、getUserById.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: ユーザー情報取得、存在しない場合nullのテスト
  - **実装 (GREEN)**: D1またはKVからユーザー情報を取得
  - **リファクタリング**: キャッシュ戦略を検討

- **5. deleteAllUserSessions.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、deleteAllUserSessions.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: ユーザーの全セッション削除のテスト
  - **実装 (GREEN)**: KVから該当ユーザーの全セッションを削除
  - **リファクタリング**: バッチ処理の効率化

#### 3.2. 純粋ロジック層の実装（Phase 2.2）

##### 3.2.1. セッション検証ロジック

- **1. validateSession.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、validateSession という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: `validateSession.test.ts` に以下のテストを記述:
    - 有効なセッション → true
    - 期限切れセッション → false
    - 改ざんされたセッション → false
    - nullセッション → false
  - **実装 (GREEN)**: セッション有効性検証ロジック
  - **リファクタリング**: 検証ロジックを効率化

- **2. isSessionExpired.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、isSessionExpired という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: 現在時刻との比較テスト
  - **実装 (GREEN)**: 期限切れチェック
  - **リファクタリング**: 日付処理を改善

- **3. createSessionData.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、createSessionData という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: SessionData生成、有効期限計算のテスト
  - **実装 (GREEN)**: sessionId生成、expiresAt計算
  - **リファクタリング**: ID生成ロジックを強化

##### 3.2.2. ナビゲーションロジック

- **4. getActiveNavItem.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、getActiveNavItem という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: 現在パスからアクティブ項目判定のテスト
  - **実装 (GREEN)**: パス一致判定ロジック
  - **リファクタリング**: パス正規化処理を追加

#### 3.3. UI層（Routes）の実装（Phase 3.3）

##### 3.3.1. ルート定義

- **1. account.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、account.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - loader: セッション検証、ユーザー情報取得
    - 認証失敗時: `/login?redirect-url=/account` へリダイレクト
    - 認証成功時: AccountLayoutDataを返却
  - **テスト実装**: loader/actionのテスト（Remix Testing Libraryを使用）
  - **リファクタリング**: エラーハンドリングを強化

- **2. account._index.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、account._index.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - マイページトップの最小限実装
    - AccountLayoutを使用した基本的なページ構成
  - **テスト実装**: ページレンダリングのテスト
  - **リファクタリング**: コンテンツを整理

#### 3.4. UI層（Components）の実装（Phase 3.4）

##### 3.4.1. レイアウトコンポーネント

- **1. AccountLayout.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、AccountLayout という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: `AccountLayout.test.tsx` に以下のテストを記述:
    - AuthGuardを含むレイアウトが正しくレンダリングされる
    - AccountNavが表示される
    - 子コンポーネントが表示される
  - **実装 (GREEN)**: レイアウトコンテナの実装
  - **スタイリング制約**:
    - ❌ フロー制御クラスの直接使用禁止
    - ✅ Layer 3の `.account-layout` クラスを使用
    - ✅ Layer 2の `.account-layout` スタイルを適用
  - **リファクタリング**: コンポーネント構造を最適化

- **2. AuthGuard.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、AuthGuard という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: 認証保護、リダイレクトのテスト
  - **実装 (GREEN)**: セッション検証とリダイレクトロジック
  - **リファクタリング**: ローディング状態管理を改善

- **3. AccountNav.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、AccountNav という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: ナビゲーション項目表示、アクティブ状態のテスト
  - **実装 (GREEN)**: ナビゲーションコンポーネント
  - **スタイリング制約**: Layer 3の `.nav-horizontal`、Layer 2の `.account-nav` を使用
  - **リファクタリング**: アクセシビリティを強化

##### 3.4.2. 共通UIコンポーネント

- **4. FormField.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、FormField という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: ラベル、入力欄、エラー表示のテスト
  - **実装 (GREEN)**: フォームフィールドコンポーネント
  - **スタイリング制約**: Layer 2の `.form-field` を使用
  - **リファクタリング**: バリデーションフィードバックを改善

- **5. Button.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、Button という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: variant、ローディング状態のテスト
  - **実装 (GREEN)**: ボタンコンポーネント（primary/secondary/danger）
  - **スタイリング制約**: Layer 2の `.btn-{variant}` を使用
  - **リファクタリング**: disabled状態の処理を改善

- **6. ErrorMessage.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、ErrorMessage という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: エラー/警告/情報表示、自動閉じのテスト
  - **実装 (GREEN)**: エラーメッセージコンポーネント
  - **スタイリング制約**: Layer 2の `.error-message-{variant}` を使用
  - **リファクタリング**: アニメーション処理を最適化

- **7. FlashMessage.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、FlashMessage という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: URLパラメータ/Cookie読み取り、一度きり表示のテスト
  - **実装 (GREEN)**: FlashMessageコンポーネント
  - **重要**: URLパラメータ方式（セッション消失時）とCookie Flash方式（通常時）の両対応
  - **リファクタリング**: 表示/非表示ロジックを改善

- **8. Modal.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、Modal という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: オーバーレイ、フォーカストラップ、Escape対応のテスト
  - **実装 (GREEN)**: モーダルコンポーネント
  - **スタイリング制約**: Layer 2の `.modal`、Layer 3の `.modal-container` を使用
  - **アクセシビリティ**: role="dialog"、aria-modal="true"、フォーカストラップ
  - **リファクタリング**: フォーカス管理を強化

- **9. Badge.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの common セクションに、Badge という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: variant表示のテスト
  - **実装 (GREEN)**: バッジコンポーネント（success/warning/danger/info）
  - **スタイリング制約**: Layer 2の `.badge-{variant}` を使用
  - **リファクタリング**: variant処理を整理

##### 3.4.3. 型定義

- **10. types.ts の実装**:
  - **ファイル**: `app/specs/account/types.ts`
  - **実装内容**: アカウントサービス全体の共有型定義
    - User, SessionData, FormFieldProps, ButtonProps, ErrorMessageProps, FlashMessageProps, ModalProps, BadgeProps等
  - **参照元**: `func-spec.md` のインターフェース定義

### Phase 4: E2E拡張と統合確認 🔴未着手

- **1. Happy Pathの成功確認**: `npm run test:e2e` を実行し、Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）を確認します。
- **2. 詳細E2Eテスト実装**: E2Eテストファイルに、エラーケース、境界値、他機能との連携など、より詳細なシナリオのテストケースを追記します。
  - **追加テストシナリオ**:
    - セッション期限切れ時のリダイレクト
    - FlashMessageの表示と自動消去
    - ナビゲーション項目のクリックとページ遷移
    - Modalの開閉とフォーカストラップ
    - Badgeのvariant表示
    - FormFieldのバリデーションエラー表示
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、品質を盤石にします。
    - **セクションレベル**: 主要アクションのエラーハンドリング。
    - **コンポーネントレベル**: バリデーション、インタラクション、アクセシビリティの検証。
- **3. E2Eテストのオールグリーンを確認**: `npm run test:e2e` を実行し、追加したものを含め、すべてのE2Eテストが成功することを確認します。
- **4. スタイリング規律確認**: `npm run lint:css-arch` を実行し、`globals.css` 内に配置プロパティ（width, height, margin, padding, display, flex, grid など）が含まれていないことを確認します。
  - **違反が検出された場合**: `tests/lint/css-arch-layer-report.md` の内容に従って修正してください。
  - **原則**: 「描き方（色・フォント）」はデザイントークン（CSS変数）、「配置（位置・サイズ・間隔）」はTailwindクラス
  - **詳細**: `docs/CSS_structure/STYLING_CHARTER.md`
- **5. 表示確認&承認**: `npm run dev` でアプリケーションを起動し、実際のブラウザで全ての機能が仕様通りに動作することを最終確認します。
  - `/account` へのアクセス（認証済み/未認証）
  - AccountNavの動作
  - 共通コンポーネント（Button, FormField, ErrorMessage, FlashMessage, Modal, Badge）の表示
- **6. (任意) モデルベーステストの検討**: 状態が複雑に変化するコンポーネントに対して、`E2E_TEST_CRITERIA.md` のモデルベーステスト(MCP)の導入を検討し、UIの堅牢性をさらに高めます。

---

## 4. 不具合発見時のフィードバックループ

開発中に予期せぬ不具合が発見された場合、それはテストの抜け漏れを意味します。以下の手順でテストスイートを強化し、同じ不具合の再発を恒久的に防ぎます。

1. **再現テストの作成 (E2E or ユニット)**: まず、発見された不具合を再現する**失敗するテスト**を記述します。これは多くの場合、E2Eテストか、特定のコンポーネントの統合テストになります。
2. **原因特定とユニットテストの強化**:
    - デバッグを行い、不具合の根本原因となっている純粋ロジック（lib）やコンポーネントを特定します。
    - その原因を最小単位で再現する**失敗するユニットテスト**を追加します。
3. **実装の修正 (GREEN)**: 追加したユニットテストがパスするように、原因となったコードを修正します。
4. **再現テストの成功確認 (GREEN)**: 最初に作成した再現テスト（E2E/統合テスト）を実行し、こちらもパスすることを確認します。
5. **知見の共有**: この経験を「学んだこと・気づき」セクションに記録し、チームの知識として蓄積します。

---

## 5. 進捗ログ

| 日付 | 作業内容 | 完了項目 | 次回予定 |
|------|----------|----------|----------|
|      |          |          |          |

## 6. 学んだこと・気づき

- セッション管理における Cookie と KV の役割分担
- 共通化徹底型設計における Modal/Badge の設計判断
- FlashMessage における URLパラメータ方式と Cookie Flash方式の使い分け
- アクセシビリティ対応（Modal のフォーカストラップ、ARIA属性）
- CSS 4層アーキテクチャにおける責務分離の重要性

## 7. さらなる改善提案

- セッションのリフレッシュ機能（自動延長）の検討
- ダークモード対応の検討（Layer 1 トークンの拡張）
- 共通コンポーネントのStorybookドキュメント作成
- E2Eテストのビジュアルリグレッションテスト導入
