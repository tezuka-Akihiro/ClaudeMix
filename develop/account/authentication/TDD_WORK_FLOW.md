# TDD作業手順書: Authentication (認証)

## 1. 概要

**開発名**: Authentication (認証) の実装
**目的**: メールアドレス/パスワードによる安全な会員登録・ログイン・パスワードリセット機能を実現し、ユーザーアカウントの保護と不正アクセス防止を提供する

**実装優先度**: **HIGH** - `common`セクション完了後、最優先で実装（profile、subscriptionが依存）

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
  - テストファイル `tests/e2e/account/authentication.spec.ts` を**新規作成**します。
    - **依頼例**: `@GeneratorOperator "account サービス authentication のE2Eテストを作成して"`
  - **テストシナリオ**（Happy Path）:
    - **会員登録フロー**:
      - `/register` にアクセス
      - メールアドレス、パスワード、パスワード確認を入力
      - 登録ボタンをクリック
      - `/account` にリダイレクトされ、セッションCookieが設定される
    - **ログインフロー**:
      - `/login` にアクセス
      - 登録済みメールアドレス、パスワードを入力
      - ログインボタンをクリック
      - `/account` にリダイレクトされる
    - **ログアウトフロー**:
      - `/logout` にPOSTリクエスト送信
      - セッションが破棄される
      - `/login` にリダイレクトされる
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、開発のゴールを定義します。
- **2. テストの失敗を確認**: `npm run test:e2e` を実行し、実装がまだ存在しないため、このテストが失敗すること（RED）を確認します。
  - この失敗したテストが、Phase 2で実装すべき機能の明確なゴールとなります。

### Phase 2: CSS実装（Layer 2/3/4） 🔴未着手

**目的**: `uiux-spec.md` で設計した内容を、実際のCSSファイルとして実装します。

**実装対象**:

1. **Layer 2**: `app/styles/account/layer2-authentication.css`
2. **Layer 3**: `app/styles/account/layer3.ts`（既存ファイルに追記）
3. **Layer 4**: `app/styles/account/layer4.ts`（必要な場合のみ）

**段階的更新の運用**:

- `uiux-spec.md` で該当セクションのコンポーネント設計を行い、このフェーズで既存のCSS実装ファイルに追記します
- **共通化の検討**: 既存セクションに類似コンポーネントがある場合、必ず共通化を検討してください
- **整合性の確認**: 追加時は、既存実装との整合性（命名規則、トークン使用等）を確認してください

**手順**:

1. **Layer 2 実装**:
   - `uiux-spec.md` で定義したコンポーネントを元に `layer2-authentication.css` を実装
   - コンポーネントセレクタ (`.{component}-{variant?}`) で定義
   - 認証フォーム: `.auth-form`, `.auth-form-header`, `.auth-form-footer`, `.auth-link`
   - すべての値は `var(--*)` でLayer 1トークンを参照

2. **Layer 3 実装**:
   - `uiux-spec.md` の「認定済み並列配置」セクションを元に `layer3.ts` を実装
   - Tailwind plugin形式（`addComponents`）でレイアウトを定義
   - レイアウトクラス: `.auth-container`, `.auth-form-layout`
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

##### 3.1.1. ユーザーデータ操作

- **1. checkEmailExists.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、checkEmailExists.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: `checkEmailExists.server.test.ts` に以下のテストを記述:
    - メールアドレスが既に存在する場合、trueを返却
    - メールアドレスが存在しない場合、falseを返却
  - **実装 (GREEN)**: D1 Databaseでメールアドレス存在確認
  - **リファクタリング**: クエリパフォーマンスを最適化

- **2. findUserByEmail.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、findUserByEmail.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: メールアドレスでユーザー検索、存在しない場合nullのテスト
  - **実装 (GREEN)**: D1 Databaseからユーザー情報を取得
  - **リファクタリング**: エラーハンドリングを改善

- **3. createUser.server.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、createUser.server という名前のdata-ioファイルを作成して"`
  - **テスト実装 (RED)**: 新規ユーザー作成、メールアドレス一意性違反のテスト
  - **実装 (GREEN)**: D1 Databaseに新規ユーザーを登録
  - **リファクタリング**: トランザクション処理を追加

##### 3.1.2. OAuth認証（実装済み）

- **1. exchangeGoogleCode.server.ts の実装**: ✅完了
  - **配置**: `app/data-io/account/authentication/exchangeGoogleCode.server.ts`
  - **責務**: Google認可コードをトークンに交換し、ユーザー情報を取得
  - **処理フロー**:
    1. 認可コードをGoogleのトークンエンドポイントに送信
    2. アクセストークンを取得
    3. アクセストークンでユーザー情報APIを呼び出し
    4. GoogleユーザーID、メールアドレス、名前を返却

- **2. getUserByOAuth.server.ts の実装**: ✅完了
  - **配置**: `app/data-io/account/authentication/getUserByOAuth.server.ts`
  - **責務**: OAuthプロバイダーとIDでユーザーを検索
  - **処理**: D1 Databaseで `oauthProvider` と `googleId` で検索

- **3. createOAuthUser.server.ts の実装**: ✅完了
  - **配置**: `app/data-io/account/authentication/createOAuthUser.server.ts`
  - **責務**: OAuthユーザーの新規登録
  - **処理**: `oauthProvider`, `googleId`, `email` を含むユーザーレコードを作成

#### 3.2. 純粋ロジック層の実装（Phase 2.2）

##### 3.2.1. パスワード処理

- **1. hashPassword.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、hashPassword という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: `hashPassword.test.ts` に以下のテストを記述:
    - 平文パスワードをハッシュ化できる
    - 同じパスワードでも異なるハッシュが生成される（salt）
    - ハッシュの長さが適切である
  - **実装 (GREEN)**: bcryptを使用してパスワードをハッシュ化（salt rounds: 10）
  - **リファクタリング**: エラーハンドリングを強化

- **2. verifyPassword.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、verifyPassword という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: 正しいパスワード→true、誤ったパスワード→falseのテスト
  - **実装 (GREEN)**: bcrypt.compareでパスワード検証
  - **リファクタリング**: タイミング攻撃対策を検討

##### 3.2.2. バリデーション

- **3. validateRegistration.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、validateRegistration という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: `validateRegistration.test.ts` に以下のテストを記述:
    - メールアドレス形式の検証
    - パスワード強度の検証（8文字以上、英数字含む）
    - パスワードと確認パスワードの一致検証
    - 必須フィールドの検証
  - **実装 (GREEN)**: 会員登録フォームのバリデーションロジック
  - **リファクタリング**: エラーメッセージを明確化

- **4. validateLogin.ts の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、validateLogin という名前のlibファイルを作成して"`
  - **テスト実装 (RED)**: メールアドレス、パスワードの必須チェック
  - **実装 (GREEN)**: ログインフォームのバリデーションロジック
  - **リファクタリング**: バリデーションルールを統一

#### 3.3. UI層（Routes）の実装（Phase 3.3）

##### 3.3.1. 会員登録・ログイン関連

- **1. register.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、register.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - loader: 既にログイン済みの場合、`/account`へリダイレクト
    - action:
      1. validateRegistration（バリデーション）
      2. checkEmailExists（重複チェック）
      3. hashPassword（パスワードハッシュ化）
      4. createUser（ユーザー作成）
      5. createSessionData & saveSession（セッション生成・保存）
      6. `/account`へリダイレクト
  - **テスト実装**: loader/actionのテスト（Remix Testing Libraryを使用）
  - **リファクタリング**: エラーハンドリングを強化

- **2. login.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、login.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - loader: 既にログイン済みの場合、`/account`へリダイレクト
    - action:
      1. validateLogin（バリデーション）
      2. findUserByEmail（ユーザー検索）
      3. verifyPassword（パスワード検証）
      4. createSessionData & saveSession（セッション生成・保存）
      5. redirect-urlパラメータがあればそこへ、なければ`/account`へリダイレクト
  - **テスト実装**: redirect-urlパラメータ処理のテスト
  - **リファクタリング**: セキュリティを強化

- **3. logout.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、logout.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - action:
      1. getSession（現在のセッション取得）
      2. destroySession（セッション削除）
      3. `/login`へリダイレクト
  - **テスト実装**: セッション削除のテスト
  - **リファクタリング**: エラーハンドリングを改善

##### 3.3.2. Google OAuth認証（実装済み）

- **1. auth.google.tsx の実装**: ✅完了
  - **配置**: `app/routes/auth.google.tsx`
  - **責務**: Google OAuth認証フローの開始
  - **実装内容**:
    - loader:
      1. 環境変数チェック（GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI）
      2. CSRF保護用stateパラメータ生成（UUID）
      3. `oauth_state` Cookieにstate保存（HttpOnly, Secure, SameSite=Lax, MaxAge=600）
      4. Google OAuth認証URLへリダイレクト
  - **セキュリティ**: stateパラメータによるCSRF保護

- **2. auth.callback.google.tsx の実装**: ✅完了
  - **配置**: `app/routes/auth.callback.google.tsx`
  - **責務**: Google OAuthコールバック処理
  - **実装内容**:
    - loader:
      1. クエリパラメータから `code` と `state` を取得
      2. **CSRF検証**: Cookieの `oauth_state` とクエリの `state` を比較
      3. 環境変数チェック
      4. `exchangeGoogleCode` でユーザー情報取得
      5. `getUserByOAuth` で既存ユーザー検索
      6. 未登録の場合は `createOAuthUser` で新規登録
      7. セッション生成・保存
      8. `oauth_state` Cookie削除 + セッションCookie設定
      9. `/account` へリダイレクト
  - **セキュリティ**:
    - state不一致時は `/login?error=csrf-detected` へリダイレクト
    - 認証成功後、oauth_state Cookieを即座に削除

- **3. login.tsx の修正**: ✅完了
  - **変更内容**: Apple認証ボタンを削除、Google認証ボタンのみ表示

##### 3.3.3. パスワードリセット関連（オプション機能）

- **4. forgot-password.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、forgot-password.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - loader: 基本的なページ表示
    - action: パスワードリセットメール送信ロジック（将来実装）
  - **注**: MVP段階では最小限の実装、メール送信機能は後回し可能
  - **テスト実装**: 基本的なフォーム送信のテスト
  - **リファクタリング**: 将来のメール送信に備えた構造

- **5. reset-password.$token.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、reset-password.$token.tsx という名前のルートファイルを作成して"`
  - **実装内容**:
    - loader: トークン検証（将来実装）
    - action: パスワードリセット実行ロジック（将来実装）
  - **注**: MVP段階では最小限の実装
  - **テスト実装**: 基本的なトークン検証のテスト
  - **リファクタリング**: セキュリティを強化

#### 3.4. UI層（Components）の実装（Phase 3.4）

##### 3.4.1. 認証フォームコンポーネント

- **1. RegisterForm.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、RegisterForm という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: `RegisterForm.test.tsx` に以下のテストを記述:
    - フォームが正しくレンダリングされる
    - メールアドレス、パスワード、パスワード確認フィールドが表示される
    - 登録ボタンが表示される
    - エラーメッセージが表示される（バリデーションエラー時）
  - **実装 (GREEN)**: 会員登録フォームコンポーネント
  - **スタイリング制約**:
    - ❌ フロー制御クラスの直接使用禁止
    - ✅ Layer 3の `.auth-form-layout` クラスを使用
    - ✅ Layer 2の `.auth-form` スタイルを適用
    - ✅ 共通コンポーネント（FormField, Button, ErrorMessage）を使用
  - **リファクタリング**: フォームバリデーションフィードバックを改善

- **2. LoginForm.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、LoginForm という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: フォームレンダリング、エラー表示のテスト
  - **実装 (GREEN)**: ログインフォームコンポーネント
  - **スタイリング制約**: RegisterFormと同様の制約
  - **リファクタリング**: 「パスワードを忘れた」リンクを追加

- **3. ForgotPasswordForm.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、ForgotPasswordForm という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: メールアドレス入力フィールドのテスト
  - **実装 (GREEN)**: パスワードリセットメール送信フォーム
  - **注**: MVP段階では最小限の実装
  - **リファクタリング**: ユーザーフィードバックを改善

- **4. ResetPasswordForm.tsx の実装**:
  - **依頼例**: `@GeneratorOperator "account サービスの authentication セクションに、ResetPasswordForm という名前のUIコンポーネントを作成して"`
  - **テスト実装 (RED)**: パスワード、パスワード確認フィールドのテスト
  - **実装 (GREEN)**: パスワードリセット実行フォーム
  - **注**: MVP段階では最小限の実装
  - **リファクタリング**: パスワード強度インジケーターを追加

### Phase 4: E2E拡張と統合確認 🔴未着手

- **1. Happy Pathの成功確認**: `npm run test:e2e` を実行し、Phase 1で作成したHappy PathのE2Eテストが完全に成功すること（GREEN）を確認します。
- **2. 詳細E2Eテスト実装**: E2Eテストファイルに、エラーケース、境界値、他機能との連携など、より詳細なシナリオのテストケースを追記します。
  - **追加テストシナリオ**:
    - **会員登録**:
      - メールアドレス重複時のエラー表示
      - パスワード強度不足のエラー表示
      - パスワード不一致のエラー表示
    - **ログイン**:
      - 誤ったメールアドレスでのエラー表示
      - 誤ったパスワードでのエラー表示
      - redirect-urlパラメータの動作確認
    - **ログアウト**:
      - ログアウト後の認証保護ページへのアクセス拒否
    - **パスワードリセット**:
      - メール送信成功の確認（将来実装）
      - トークン検証のテスト（将来実装）
    - **Google OAuth認証**:
      - Google認証ボタンクリックでGoogleへリダイレクト
      - 認証成功後に `/account` へリダイレクト
      - CSRF検証失敗時のエラー表示（state不一致）
      - 環境変数未設定時のエラー表示
  - **テスト基準**: `E2E_TEST_CRITERIA.md` の以下を参考に、品質を盤石にします。
    - **セクションレベル**: 主要アクションのエラーハンドリング。
    - **コンポーネントレベル**: バリデーション、インタラクション、アクセシビリティの検証。
- **3. E2Eテストのオールグリーンを確認**: `npm run test:e2e` を実行し、追加したものを含め、すべてのE2Eテストが成功することを確認します。
- **4. スタイリング規律確認**: `npm run lint:css-arch` を実行し、`globals.css` 内に配置プロパティ（width, height, margin, padding, display, flex, grid など）が含まれていないことを確認します。
  - **違反が検出された場合**: `tests/lint/css-arch-layer-report.md` の内容に従って修正してください。
  - **原則**: 「描き方（色・フォント）」はデザイントークン（CSS変数）、「配置（位置・サイズ・間隔）」はTailwindクラス
  - **詳細**: `docs/CSS_structure/STYLING_CHARTER.md`
- **5. 表示確認&承認**: `npm run dev` でアプリケーションを起動し、実際のブラウザで全ての機能が仕様通りに動作することを最終確認します。
  - 会員登録フロー（成功・エラー）
  - ログインフロー（成功・エラー、redirect-url）
  - ログアウトフロー
  - パスワードリセットフロー（基本UI確認）
- **6. セキュリティ確認**:
  - ✅ パスワードがハッシュ化されてDBに保存されている
  - ✅ セッションCookieがHttpOnly、Secure、SameSiteで設定されている
  - ✅ CSRF対策（Remixの組み込み対策）が機能している
  - ✅ SQL Injection対策（パラメータ化クエリ）が実装されている
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

- bcryptによるパスワードハッシュ化の重要性とsalt rounds設定
- セッションベース認証における Cookie のセキュリティ設定（HttpOnly, Secure, SameSite）
- タイミング攻撃対策（パスワード検証時の一定時間応答）
- redirect-urlパラメータによるログイン後のスムーズな遷移
- バリデーションエラーメッセージのUX設計
- common セクションの再利用可能なコンポーネント（FormField, Button, ErrorMessage）の活用

## 7. さらなる改善提案

- 2要素認証（2FA）の導入検討
- OAuth連携（Google, GitHub等）の検討
- パスワードリセット機能の本格実装（メール送信）
- ログイン試行回数制限（ブルートフォース攻撃対策）
- セッションのリフレッシュ機能（自動延長）
- アカウント確認メール（メールアドレス検証）の導入
