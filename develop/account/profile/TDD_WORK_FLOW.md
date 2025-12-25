# TDD作業手順書: Profile Management (プロフィール管理)

## 1. 概要

**開発名**: Profile Management (プロフィール管理) の実装
**目的**: ユーザーが自身のアカウント情報を安全に管理できる機能を提供し、メールアドレス変更、パスワード変更、アカウント削除を実現する

**実装優先度**: **MEDIUM** - `authentication`セクション完了後に実装（subscriptionは後回し可能）

**重要な依存関係**:
- アカウント削除機能は `subscription` セクションに依存（Stripe解約処理が必須）
- 実装時は subscription セクションの以下のファイルが必要:
  - `getSubscriptionByUserId.server.ts`
  - `cancelStripeSubscription.server.ts`
  - `deleteSubscription.server.ts`

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
  - テストファイル `tests/e2e/account/profile.spec.ts` を**新規作成**します。
    - **依頼例**: `@GeneratorOperator "account サービス profile のE2Eテストを作成して"`
  - **テストシナリオ**（Happy Path）:
    - **プロフィール表示**:
      - `/account/settings` にアクセス（認証済み）
      - メールアドレス、アカウント作成日、サブスクリプション状態が表示される
    - **メールアドレス変更**:
      - メールアドレス変更ボタンをクリック
      - 新しいメールアドレス、確認用メールアドレス、現在のパスワードを入力
      - 保存ボタンをクリック
      - 成功メッセージが表示され、新しいメールアドレスが反映される
    - **パスワード変更**:
      - パスワード変更ボタンをクリック
      - 現在のパスワード、新しいパスワード、確認用パスワードを入力
      - 保存ボタンをクリック
      - 成功メッセージが表示され、セッションが再生成される
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、開発のゴールを定義します。
- **2. テストの失敗を確認**: `npm run test:e2e` を実行し、実装がまだ存在しないため、このテストが失敗すること（RED）を確認します。
  - この失敗したテストが、Phase 2で実装すべき機能の明確なゴールとなります。

### Phase 2: CSS実装（Layer 2/3/4） 🔴未着手

**目的**: `uiux-spec.md` で設計した内容を、実際のCSSファイルとして実装します。

**実装対象**:

1. **Layer 2**: `app/styles/account/layer2-profile.css`
2. **Layer 3**: `app/styles/account/layer3.ts`（既存ファイルに追記）
3. **Layer 4**: `app/styles/account/layer4.ts`（必要な場合のみ）

**段階的更新の運用**:

- `uiux-spec.md` で該当セクションのコンポーネント設計を行い、このフェーズで既存のCSS実装ファイルに追記します
- **共通化の検討**: 既存セクションに類似コンポーネントがある場合、必ず共通化を検討してください
- **整合性の確認**: 追加時は、既存実装との整合性（命名規則、トークン使用等）を確認してください

**手順**:

1. **Layer 2 実装**:
   - `uiux-spec.md` で定義したコンポーネントを元に `layer2-profile.css` を実装
   - コンポーネントセレクタ (`.{component}-{variant?}`) で定義
   - プロフィール表示: `.profile-display`, `.profile-info`, `.profile-actions`
   - 変更フォーム: `.change-form`（authenticationの`.auth-form`を参考に統一性を確保）
   - すべての値は `var(--*)` でLayer 1トークンを参照

2. **Layer 3 実装**:
   - `uiux-spec.md` の「認定済み並列配置」セクションを元に `layer3.ts` を実装
   - Tailwind plugin形式（`addComponents`）でレイアウトを定義
   - レイアウトクラス: `.profile-container`, `.profile-info-group`, `.profile-actions-group`
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

##### 3.1.1. ユーザーデータ更新

- **1. updateUserEmail.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、updateUserEmail.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: `updateUserEmail.server.test.ts` に以下のテストを記述:
    - メールアドレス更新成功のテスト
    - 存在しないユーザーIDでのエラーテスト
    - DBエラー時のエラーハンドリングテスト
  - **実装 (GREEN)**: D1 Databaseでユーザーのメールアドレスを更新
  - **リファクタリング**: トランザクション処理を追加

- **2. updateUserPassword.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、updateUserPassword.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: パスワード更新、updated_atの更新確認のテスト
  - **実装 (GREEN)**: D1 Databaseでユーザーのパスワードを更新
  - **リファクタリング**: エラーハンドリングを改善

- **3. deleteUser.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、deleteUser.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: ユーザー削除、存在確認のテスト
  - **実装 (GREEN)**: D1 Databaseからユーザーを削除
  - **重要**: この関数を呼ぶ前に、必ず以下を実施:
    1. Stripeサブスクリプションの解約（`cancelStripeSubscription.server`）
    2. サブスクリプションレコードの削除（`deleteSubscription.server`）
    3. すべてのセッションの削除（`deleteAllUserSessions.server`）
  - **リファクタリング**: 削除前の存在確認を追加

#### 3.2. 純粋ロジック層の実装（Phase 2.2）

##### 3.2.1. バリデーション

- **1. validateEmailChange.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、validateEmailChange という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: `validateEmailChange.test.ts` に以下のテストを記述:
    - メールアドレス形式の検証
    - 新しいメールアドレスと確認用メールアドレスの一致検証
    - 現在のメールアドレスと同じでないかの検証
    - 現在のパスワードが必須であることの検証
  - **実装 (GREEN)**: メールアドレス変更フォームのバリデーションロジック
  - **リファクタリング**: エラーメッセージを明確化

- **2. validatePasswordChange.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、validatePasswordChange という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: `validatePasswordChange.test.ts` に以下のテストを記述:
    - 現在のパスワードが必須であることの検証
    - 新しいパスワードの強度検証（8文字以上、英数字含む）
    - 新しいパスワードと確認用パスワードの一致検証
    - 現在のパスワードと新しいパスワードが異なることの検証
  - **実装 (GREEN)**: パスワード変更フォームのバリデーションロジック
  - **リファクタリング**: パスワード強度ルールを統一

- **3. validateAccountDeletion.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、validateAccountDeletion という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: `validateAccountDeletion.test.ts` に以下のテストを記述:
    - 現在のパスワードが必須であることの検証
    - 削除確認チェックボックスがtrueであることの検証
  - **実装 (GREEN)**: アカウント削除フォームのバリデーションロジック
  - **リファクタリング**: バリデーションエラーを明確化

#### 3.3. UI層（Routes）の実装（Phase 3.3）

##### 3.3.1. プロフィール設定ページ

- **1. account.settings.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、account.settings.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - loader:
      1. セッション検証（AuthGuardで実行）
      2. getUserById（ユーザー情報取得）
      3. getSubscriptionByUserId（サブスクリプション状態取得、オプション）
      4. プロフィールデータ返却
    - action（intentパラメータで処理分岐）:
      - **email-change**:
        1. validateEmailChange（バリデーション）
        2. findUserByEmail（現在のユーザー取得）
        3. verifyPassword（パスワード検証）
        4. checkEmailExists（新しいメールアドレスの重複チェック）
        5. updateUserEmail（メールアドレス更新）
        6. 成功メッセージとリダイレクト
      - **password-change**:
        1. validatePasswordChange（バリデーション）
        2. findUserByEmail（現在のユーザー取得）
        3. verifyPassword（現在のパスワード検証）
        4. hashPassword（新しいパスワードのハッシュ化）
        5. updateUserPassword（パスワード更新）
        6. deleteAllUserSessions（すべてのセッション削除）
        7. createSessionData & saveSession（新しいセッション生成）
        8. 成功メッセージとリダイレクト
      - **delete-account**:
        1. validateAccountDeletion（バリデーション）
        2. findUserByEmail（現在のユーザー取得）
        3. verifyPassword（パスワード検証）
        4. getSubscriptionByUserId（サブスクリプション存在確認）
        5. サブスクリプションがある場合:
           - cancelStripeSubscription（Stripe即時解約）
           - deleteSubscription（サブスクリプションレコード削除）
        6. deleteAllUserSessions（すべてのセッション削除）
        7. deleteUser（ユーザー削除）
        8. `/login`へリダイレクト
  - **テスト実装**: 各intentのテスト、エラーハンドリングのテスト
  - **リファクタリング**: intent処理を関数に分離

#### 3.4. UI層（Components）の実装（Phase 3.4）

##### 3.4.1. プロフィール表示・変更コンポーネント

- **1. ProfileDisplay.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、ProfileDisplay という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: `ProfileDisplay.test.tsx` に以下のテストを記述:
    - ユーザー情報が正しく表示される
    - メールアドレス変更ボタンが表示される
    - パスワード変更ボタンが表示される
    - アカウント削除ボタンが表示される（danger variant）
  - **実装 (GREEN)**: プロフィール情報表示コンポーネント
  - **スタイリング制約**:
    - ❌ フロー制御クラスの直接使用禁止
    - ✅ Layer 3の `.profile-container`, `.profile-info-group`, `.profile-actions-group` を使用
    - ✅ Layer 2の `.profile-display`, `.profile-info`, `.profile-actions` を適用
    - ✅ 共通コンポーネント（Button, Modal）を使用
  - **リファクタリング**: アカウント削除UIを共通Modalを使用して実装

- **2. EmailChangeForm.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、EmailChangeForm という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: フォームレンダリング、バリデーションエラー表示のテスト
  - **実装 (GREEN)**: メールアドレス変更フォームコンポーネント（モーダル内で使用）
  - **フィールド構成**:
    - 新しいメールアドレス（FormField使用）
    - 新しいメールアドレス確認（FormField使用）
    - 現在のパスワード（FormField type="password"使用）
    - 保存ボタン・キャンセルボタン（Button使用）
  - **スタイリング制約**: Layer 2の `.change-form` を使用
  - **リファクタリング**: バリデーションフィードバックを改善

- **3. PasswordChangeForm.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの profile セクションに、PasswordChangeForm という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: フォームレンダリング、パスワード強度表示のテスト
  - **実装 (GREEN)**: パスワード変更フォームコンポーネント（モーダル内で使用）
  - **フィールド構成**:
    - 現在のパスワード（FormField type="password"使用）
    - 新しいパスワード（FormField type="password"使用）
    - 新しいパスワード確認（FormField type="password"使用）
    - 保存ボタン・キャンセルボタン（Button使用）
  - **スタイリング制約**: Layer 2の `.change-form` を使用
  - **重要**: パスワード変更後はセッションが再生成されることをユーザーに通知
  - **リファクタリング**: パスワード強度インジケーターを追加

### Phase 4: E2E拡張と統合確認 🔴未着手

- **1. Happy Pathの成功確認**: `npm run test:e2e` を実行し、Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）を確認します。
- **2. 詳細E2Eテスト実装**: E2Eテストファイルに、エラーケース、境界値、他機能との連携など、より詳細なシナリオのテストケースを追記します。
  - **追加テストシナリオ**:
    - **メールアドレス変更**:
      - メールアドレス重複時のエラー表示
      - 現在のパスワードが誤っている場合のエラー表示
      - メールアドレス確認不一致のエラー表示
    - **パスワード変更**:
      - 現在のパスワードが誤っている場合のエラー表示
      - 新しいパスワード強度不足のエラー表示
      - パスワード確認不一致のエラー表示
      - パスワード変更後のセッション再生成確認
    - **アカウント削除**:
      - サブスクリプション契約中の強力な警告表示
      - パスワード誤入力時のエラー表示
      - 削除確認チェックボックス未チェック時のエラー表示
      - 削除成功後の`/login`へのリダイレクト確認
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、品質を盤石にします。
    - **セクションレベル**: 主要アクションのエラーハンドリング。
    - **コンポーネントレベル**: バリデーション、インタラクション、アクセシビリティの検証。
- **3. E2Eテストのオールグリーンを確認**: `npm run test:e2e` を実行し、追加したものを含め、すべてのE2Eテストが成功することを確認します。
- **4. スタイリング規律確認**: `npm run lint:css-arch` を実行し、`globals.css` 内に配置プロパティ（width, height, margin, padding, display, flex, grid など）が含まれていないことを確認します。
  - **違反が検出された場合**: `tests/lint/css-arch-layer-report.md` の内容に従って修正してください。
  - **原則**: 「描き方（色・フォント）」はデザイントークン（CSS変数）、「配置（位置・サイズ・間隔）」はTailwindクラス
  - **詳細**: `docs/CSS_structure/STYLING_CHARTER.md`
- **5. 表示確認&承認**: `npm run dev` でアプリケーションを起動し、実際のブラウザで全ての機能が仕様通りに動作することを最終確認します。
  - プロフィール情報の表示
  - メールアドレス変更フロー（成功・エラー）
  - パスワード変更フロー（成功・エラー、セッション再生成）
  - アカウント削除フロー（警告表示、Stripe解約、削除成功）
- **6. セキュリティ確認**:
  - ✅ パスワード変更時にすべてのセッションが削除されている
  - ✅ アカウント削除時にStripeサブスクリプションが解約されている（ゾンビ課金防止）
  - ✅ メールアドレス変更時に本人確認（パスワード入力）が行われている
  - ✅ 削除確認チェックボックスによる誤操作防止が機能している
- **7. (任意) モデルベーステストの検討**: 状態が複雑に変化するコンポーネントに対して、`E2E_TEST_CRITERIA.md` のモデルベーステスト(MCP)の導入を検討し、UIの堅牢性をさらに高めます。

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

- パスワード変更時のセッション再生成の重要性（セキュリティ強化）
- アカウント削除時のStripe解約処理の必須性（ゾンビ課金防止）
- data-flow-diagram.mdで明確にしたエラーハンドリング（CancelStripe失敗時の処理中断）
- 共通Modalの活用によるUI統一（削除確認UI）
- メールアドレス変更時の本人確認（パスワード入力）による不正操作防止
- サブスクリプション契約中のアカウント削除時の強力な警告表示（UX/ビジネス要件）

## 7. さらなる改善提案

- メールアドレス変更時の確認メール送信（変更前のアドレスへ通知）
- パスワード変更時のメール通知（セキュリティアラート）
- アカウント削除のクーリングオフ期間（7日間の猶予期間）
- プロフィール画像のアップロード機能
- 2要素認証設定の管理
- ログイン履歴・セッション管理画面
