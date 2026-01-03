# RFC-006: Account Service Spec Migration Plan

**ステータス**: 提案
**作成日**: 2026-01-03
**優先度**: 🔴 Critical
**Phase**: 緊急対応
**依存**: なし（独立して実施可能）

---

## 変更の概要

accountサービスには1,313行の詳細なspecファイルが存在するにもかかわらず、実装では一切参照されていない。この重大な不整合を解消し、SSoT原則を完全に実現する。

---

## 背景と目的

### 現状の問題

**深刻度: 🔴 Critical**

1. **完全な二重管理**
   - specファイル: 1,313行の完璧な定義
   - 実装: すべての値をハードコード（spec参照回数: 0回）
   - 結果: 修正時に2箇所を変更する必要があり、不整合のリスク

2. **セキュリティリスク**
   ```yaml
   # spec定義（厳格）
   password:
     pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"

   # 実装（緩い）
   // パターン検証なし、長さチェックのみ
   ```
   - specで定義された厳格なバリデーションが実装されていない
   - パスワード要件が満たされず、セキュリティホール

3. **テスト信頼性の欠如**
   - E2Eテストで data-testid をハードコード
   - spec値との整合性が検証されていない
   - specを変更してもテストが失敗しない

4. **保守性の著しい低下**
   - エラーメッセージ変更: 62箇所を手動修正
   - UIラベル変更: 17箇所を手動修正
   - 変更漏れのリスクが極めて高い

### 目的

1. **SSoT原則の実現**: specファイルを唯一の情報源とする
2. **セキュリティ向上**: spec定義のバリデーションルールを確実に適用
3. **保守性向上**: 修正箇所を1箇所に集約
4. **テスト信頼性向上**: spec値を使用したテストで整合性を保証

---

## 影響範囲

### 直接影響

**変更対象ファイル数**: 約25-30ファイル

- **routes層**: 5ファイル（login, register, settings, forgot-password, reset-password）
- **components層**: 8ファイル（ProfileDisplay, EmailChangeModal, PasswordChangeModal等）
- **lib層**: 2ファイル（validateEmail, validatePassword）
- **E2Eテスト**: 3ファイル（authentication, profile, subscription）
- **data-io層**: 7-10ファイル（getUserByEmail, createUser等）

### 削減効果

- **ハードコード削除**: 約150-200行
- **保守コスト削減**: 62箇所 → 1箇所（エラーメッセージ変更時）
- **バグリスク削減**: spec/実装の不整合がなくなる

---

## 変更内容

### Phase 1: routes層の緊急対応（最優先）

#### 対象ファイル

1. `app/routes/login.tsx` (304行)
2. `app/routes/register.tsx` (241行)
3. `app/routes/account.settings.tsx` (325行)
4. `app/routes/forgot-password.tsx` (189行)
5. `app/routes/reset-password.$token.tsx` (未spec化)

#### 作業内容

**1. spec読み込みの追加**

```typescript
// 変更前
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  // ...
}

// 変更後
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const formData = await request.formData();
  const email = formData.get('email');
  // ...
}
```

**2. エラーメッセージのspec参照化**

```typescript
// 変更前（login.tsx:103-111）
if (typeof email !== 'string' || !email) {
  fieldErrors.email = 'メールアドレスを入力してください';
} else if (!validateEmail(email)) {
  fieldErrors.email = '有効なメールアドレスを入力してください';
}

if (typeof password !== 'string' || !password) {
  fieldErrors.password = 'パスワードを入力してください';
} else if (!validatePassword(password)) {
  fieldErrors.password = 'パスワードは8文字以上、128文字以下で、大文字・小文字・数字を含む必要があります';
}

// 変更後
const { required, invalid_format } = spec.validation.email.error_messages;

if (typeof email !== 'string' || !email) {
  fieldErrors.email = required;
} else if (!validateEmail(email)) {
  fieldErrors.email = invalid_format;
}

const passwordErrors = spec.validation.password.error_messages;

if (typeof password !== 'string' || !password) {
  fieldErrors.password = passwordErrors.required;
} else if (!validatePassword(password)) {
  fieldErrors.password = passwordErrors.weak;
}
```

**3. Flash Messagesのspec参照化**

```typescript
// 変更前（login.tsx:63-67）
const FLASH_MESSAGES: Record<string, string> = {
  'session-expired': 'セッションの有効期限が切れました',
  'unauthorized': 'ログインが必要です',
  'logout-success': 'ログアウトしました',
  'password-reset-success': 'パスワードを再設定しました。新しいパスワードでログインしてください。',
};

const flashMessage = url.searchParams.get('message');
const message = flashMessage ? FLASH_MESSAGES[flashMessage] : null;

// 変更後
const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
const flashMessages = spec.routes.login.flash_messages;

const flashMessage = url.searchParams.get('message');
const message = flashMessage ? flashMessages[flashMessage as keyof typeof flashMessages] : null;
```

**4. loaderでspecをクライアントに渡す**

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  return json({
    // UIで使用するspec値のみを公開
    uiSpec: {
      forms: spec.forms.login,
      validation: {
        email: spec.validation.email.error_messages,
        password: spec.validation.password.error_messages,
      },
      testSelectors: spec.test.selectors,
    },
  });
}
```

**5. コンポーネントでspec値を使用**

```typescript
// 変更前
<button type="submit" data-testid="login-submit-button">
  {isSubmitting ? 'ログイン中...' : 'ログイン'}
</button>

// 変更後
const { uiSpec } = useLoaderData<typeof loader>();

<button
  type="submit"
  data-testid={uiSpec.testSelectors.submit_button}
>
  {isSubmitting
    ? uiSpec.forms.submit_button.loading_label
    : uiSpec.forms.submit_button.label
  }
</button>
```

---

### Phase 2: lib層のバリデーション修正（高優先）

#### 対象ファイル

1. `app/lib/account/authentication/validateEmail.ts`
2. `app/lib/account/authentication/validatePassword.ts`

#### 作業内容

**validateEmail.ts の修正**

```typescript
// 変更前
export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string' || !email || email.trim() === '') {
    return false;
  }

  // ハードコードされた正規表現（specと異なる）
  const emailPattern = /^[^\s@.][^\s@]*@[^\s@.][^\s@]*\.[^\s@.]+$/;

  return emailPattern.test(email) && email.length <= 254;
}

// 変更後
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

export function validateEmail(email: unknown): boolean {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const { pattern, max_length } = spec.validation.email;

  if (typeof email !== 'string' || !email || email.trim() === '') {
    return false;
  }

  if (email.length > max_length) {
    return false;
  }

  // specから正規表現を読み込む
  const emailPattern = new RegExp(pattern);
  return emailPattern.test(email);
}
```

**validatePassword.ts の修正（🔴 セキュリティ修正）**

```typescript
// 変更前（パターン検証なし - セキュリティホール）
export function validatePassword(password: unknown): boolean {
  if (typeof password !== 'string') {
    return false;
  }

  // 長さチェックのみ
  return password.length >= 8 && password.length <= 128;
}

// 変更後（specの厳格な要件を適用）
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

export function validatePassword(password: unknown): boolean {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const { min_length, max_length, pattern } = spec.validation.password;

  if (typeof password !== 'string') {
    return false;
  }

  // 長さチェック
  if (password.length < min_length || password.length > max_length) {
    return false;
  }

  // パターンチェック（大文字・小文字・数字を含む）
  const passwordPattern = new RegExp(pattern);
  return passwordPattern.test(password);
}

/**
 * パスワード要件のテキストを取得
 * UIでの表示用
 */
export function getPasswordRequirements(): string[] {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  return spec.validation.password.requirements;
}
```

**ユニットテストの更新**

```typescript
// validatePassword.test.ts
import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordRequirements } from './validatePassword';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

describe('validatePassword', () => {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  it('specで定義された最小文字数を満たさないパスワードを拒否する', () => {
    const tooShort = 'Ab1'; // 3文字（spec: min_length=8）
    expect(validatePassword(tooShort)).toBe(false);
  });

  it('specで定義されたパターンを満たすパスワードを受け入れる', () => {
    // 大文字・小文字・数字を含む8文字以上
    expect(validatePassword('Abcd1234')).toBe(true);
  });

  it('大文字を含まないパスワードを拒否する（spec要件）', () => {
    expect(validatePassword('abcd1234')).toBe(false);
  });

  it('小文字を含まないパスワードを拒否する（spec要件）', () => {
    expect(validatePassword('ABCD1234')).toBe(false);
  });

  it('数字を含まないパスワードを拒否する（spec要件）', () => {
    expect(validatePassword('Abcdefgh')).toBe(false);
  });

  it('specで定義された最大文字数を超えるパスワードを拒否する', () => {
    const tooLong = 'A1' + 'a'.repeat(127); // 129文字（spec: max_length=128）
    expect(validatePassword(tooLong)).toBe(false);
  });
});

describe('getPasswordRequirements', () => {
  it('specで定義された要件リストを返す', () => {
    const requirements = getPasswordRequirements();

    expect(requirements).toContain('8文字以上');
    expect(requirements).toContain('大文字を含む');
    expect(requirements).toContain('小文字を含む');
    expect(requirements).toContain('数字を含む');
  });
});
```

---

### Phase 3: components層のリファクタリング

#### 対象ファイル

1. `app/components/account/profile/ProfileDisplay.tsx`
2. `app/components/account/profile/EmailChangeModal.tsx`
3. `app/components/account/profile/PasswordChangeModal.tsx`
4. `app/components/account/profile/DeleteAccountModal.tsx`
5. `app/components/account/subscription/SubscriptionStatusCard.tsx`
6. `app/components/account/common/AccountNav.tsx`

#### 作業内容

**ProfileDisplay.tsx の修正例**

```typescript
// 変更前
export function ProfileDisplay({ user, onEmailChange, onPasswordChange, onDelete }: ProfileDisplayProps) {
  return (
    <div className="profile-display" data-testid="profile-display">
      <section className="profile-info">
        <h2 className="profile-info__title">プロフィール情報</h2>

        <div className="profile-info__item">
          <div className="profile-info__label">メールアドレス</div>
          <div className="profile-info__value">{user.email}</div>
        </div>

        <div className="profile-info__item">
          <div className="profile-info__label">サブスクリプション状態</div>
          <div className="profile-info__value">
            {user.subscription_status === 'active' ? 'アクティブ' : '非アクティブ'}
          </div>
        </div>
      </section>

      <section className="profile-actions">
        <h2 className="profile-actions__title">アカウント操作</h2>
        <button onClick={onEmailChange}>メールアドレスを変更</button>
        <button onClick={onPasswordChange}>パスワードを変更</button>
        <button onClick={onDelete}>アカウントを削除</button>
      </section>
    </div>
  );
}

// 変更後
interface ProfileDisplayProps {
  user: User;
  spec: {
    sections: AccountProfileSpec['profile_display']['sections'];
    testSelectors: AccountProfileSpec['test']['selectors'];
  };
  onEmailChange: () => void;
  onPasswordChange: () => void;
  onDelete: () => void;
}

export function ProfileDisplay({ user, spec, onEmailChange, onPasswordChange, onDelete }: ProfileDisplayProps) {
  const { info, actions } = spec.sections;

  // サブスクリプション状態のラベルを取得
  const subscriptionLabel = info.fields.subscription_status.values[user.subscription_status]
    || info.fields.subscription_status.values.inactive;

  return (
    <div
      className="profile-display"
      data-testid={spec.testSelectors.profile_display}
    >
      <section className="profile-info">
        <h2 className="profile-info__title">{info.title}</h2>

        <div className="profile-info__item">
          <div className="profile-info__label">
            {info.fields.email.label}
          </div>
          <div className="profile-info__value">{user.email}</div>
        </div>

        <div className="profile-info__item">
          <div className="profile-info__label">
            {info.fields.subscription_status.label}
          </div>
          <div className="profile-info__value">
            {subscriptionLabel}
          </div>
        </div>
      </section>

      <section className="profile-actions">
        <h2 className="profile-actions__title">{actions.title}</h2>
        <button
          onClick={onEmailChange}
          data-testid={spec.testSelectors.email_change_button}
        >
          {actions.buttons[0].label}
        </button>
        <button
          onClick={onPasswordChange}
          data-testid={spec.testSelectors.password_change_button}
        >
          {actions.buttons[1].label}
        </button>
        <button
          onClick={onDelete}
          data-testid={spec.testSelectors.delete_account_button}
        >
          {actions.buttons[2].label}
        </button>
      </section>
    </div>
  );
}
```

**親routeからspecを注入**

```typescript
// app/routes/account.tsx
export async function loader() {
  const spec = loadSpec<AccountProfileSpec>('account/profile');

  return json({
    user: ...,
    spec: {
      sections: spec.profile_display.sections,
      testSelectors: spec.test.selectors,
    },
  });
}

export default function Account() {
  const { user, spec } = useLoaderData<typeof loader>();

  return (
    <ProfileDisplay
      user={user}
      spec={spec}
      onEmailChange={...}
      onPasswordChange={...}
      onDelete={...}
    />
  );
}
```

---

### Phase 4: E2Eテストのリファクタリング

#### 対象ファイル

1. `tests/e2e/account/authentication.spec.ts`
2. `tests/e2e/account/profile.spec.ts`
3. `tests/e2e/account/subscription.spec.ts`

#### 作業内容

**spec読み込みユーティリティの作成**

```typescript
// tests/e2e/utils/loadSpec.ts
import { readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

export async function loadSpec<T>(service: string, section: string): Promise<T> {
  const specPath = join(process.cwd(), 'app/specs', service, `${section}-spec.yaml`);
  const yamlString = await readFile(specPath, 'utf-8');
  return yaml.load(yamlString) as T;
}
```

**authentication.spec.ts の修正**

```typescript
// 変更前
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.locator('[data-testid="email-input"]'); // ハードコード
    await expect(emailInput).toBeVisible();

    const submitButton = page.locator('[data-testid="submit-button"]'); // ハードコード
    await expect(submitButton).toContainText('登録'); // ハードコード
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('invalid');

    const submitButton = page.locator('[data-testid="submit-button"]');
    await submitButton.click();

    const errorMessage = page.locator('[data-testid="email-error"]');
    await expect(errorMessage).toContainText('有効なメールアドレスを入力してください'); // ハードコード
  });
});

// 変更後
import { test, expect } from '@playwright/test';
import { loadSpec } from '../../utils/loadSpec';
import type { AccountAuthenticationSpec } from '../../../app/specs/account/types';

let spec: AccountAuthenticationSpec;

test.beforeAll(async () => {
  spec = await loadSpec('account', 'authentication');
});

test.describe('User Registration', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto(spec.routes.register.path);

    const emailInput = page.locator(spec.test.selectors.email_input);
    await expect(emailInput).toBeVisible();

    const submitButton = page.locator(spec.test.selectors.submit_button);
    await expect(submitButton).toContainText(spec.forms.register.submit_button.label);
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto(spec.routes.register.path);

    const emailInput = page.locator(spec.test.selectors.email_input);
    await emailInput.fill('invalid');

    const submitButton = page.locator(spec.test.selectors.submit_button);
    await submitButton.click();

    const errorMessage = page.locator(spec.test.selectors.email_error);
    const expectedError = spec.validation.email.error_messages.invalid_format;
    await expect(errorMessage).toContainText(expectedError);
  });

  test('should enforce password requirements from spec', async ({ page }) => {
    await page.goto(spec.routes.register.path);

    const passwordInput = page.locator(spec.test.selectors.password_input);

    // specの最小文字数未満
    const tooShort = 'Ab1'; // spec.validation.password.min_length より短い
    await passwordInput.fill(tooShort);

    const submitButton = page.locator(spec.test.selectors.submit_button);
    await submitButton.click();

    const errorMessage = page.locator(spec.test.selectors.password_error);
    const expectedError = spec.validation.password.error_messages.too_short;
    await expect(errorMessage).toContainText(expectedError);
  });
});
```

**効果**:
- specファイルを変更すると、E2Eテストも自動的に追従
- data-testid、UIテキスト、エラーメッセージの整合性が保証される
- spec/実装/テストの三位一体が実現

---

## 移行手順

### ステップ1: Phase 1 - routes層（2-3日）

**Day 1**:
1. `login.tsx` のリファクタリング
2. `register.tsx` のリファクタリング
3. 単体テスト実行

**Day 2**:
1. `account.settings.tsx` のリファクタリング
2. `forgot-password.tsx` のリファクタリング
3. E2Eテスト実行（既存）

**Day 3**:
1. すべてのroutes層の統合テスト
2. 問題があれば修正

### ステップ2: Phase 2 - lib層（1日）

**Day 4**:
1. `validateEmail.ts` の修正
2. `validatePassword.ts` の修正（🔴 セキュリティ修正）
3. ユニットテスト作成・実行
4. E2Eテストで動作確認

### ステップ3: Phase 3 - components層（2日）

**Day 5-6**:
1. `ProfileDisplay.tsx` のリファクタリング
2. モーダルコンポーネント（3ファイル）のリファクタリング
3. `SubscriptionStatusCard.tsx` のリファクタリング
4. `AccountNav.tsx` のリファクタリング
5. E2Eテスト実行

### ステップ4: Phase 4 - E2Eテスト（1-2日）

**Day 7-8**:
1. spec読み込みユーティリティ作成
2. `authentication.spec.ts` のリファクタリング
3. `profile.spec.ts` のリファクタリング
4. `subscription.spec.ts` のリファクタリング
5. 全E2Eテスト実行

### ステップ5: 最終確認（1日）

**Day 9**:
1. 全テスト実行（unit + E2E）
2. 手動テスト（実際のUI操作）
3. spec/実装/テストの整合性確認
4. ドキュメント更新

---

## テスト計画

### 単体テスト

**新規テスト**:
- `validateEmail.test.ts`: spec値との整合性を検証
- `validatePassword.test.ts`: spec要件の完全な検証

**更新テスト**:
- routes層のテスト: spec参照の動作確認

### E2Eテスト

**既存テストの更新**:
- すべてのdata-testidをspec参照に変更
- すべてのUIテキスト検証をspec参照に変更
- エラーメッセージ検証をspec参照に変更

**新規テスト**:
- spec整合性テスト: spec値が実装に正しく反映されているか

### セキュリティテスト

**重要**: `validatePassword.ts` の修正後、以下を確認

1. 弱いパスワードを拒否するか
   - 小文字のみ: `abcd1234` → ❌ 拒否
   - 大文字のみ: `ABCD1234` → ❌ 拒否
   - 数字なし: `Abcdefgh` → ❌ 拒否

2. 強いパスワードを受け入れるか
   - `Abcd1234` → ✅ 受け入れ
   - `MyP@ssw0rd` → ✅ 受け入れ

---

## リスクと対策

### リスク1: 既存ユーザーへの影響

**確率**: 中
**影響度**: 高

**問題**: validatePassword修正後、既存の弱いパスワードでログインできなくなる可能性

**対策**:
1. **段階的移行**:
   - 新規登録のみ厳格なバリデーション適用
   - 既存ユーザーには次回パスワード変更時に適用

2. **データベース調査**:
   ```sql
   -- 弱いパスワードを使用しているユーザー数を確認
   -- （実際にはハッシュ化されているため、直接検証は不可）
   ```

3. **移行期間の設定**:
   - 3ヶ月間の猶予期間
   - ログイン時に「パスワードを強化してください」と警告表示

### リスク2: パフォーマンスへの影響

**確率**: 低
**影響度**: 低

**問題**: 毎回specを読み込むとパフォーマンスが低下する可能性

**対策**:
1. **キャッシュ機構**:
   ```typescript
   let cachedSpec: AccountAuthenticationSpec | null = null;

   export function loadSpec(): AccountAuthenticationSpec {
     if (!cachedSpec) {
       cachedSpec = getSpec<AccountAuthenticationSpec>('account/authentication');
     }
     return cachedSpec;
   }
   ```

2. **ビルド時バンドル**:
   - 既に `generate-specs.js` でバンドル済み
   - 実行時のファイルI/Oなし

### リスク3: テストの不安定化

**確率**: 低
**影響度**: 中

**問題**: spec参照への変更でテストが失敗する可能性

**対策**:
1. **段階的移行**:
   - 1ファイルずつ変更してテスト実行
   - 問題があればすぐに特定・修正

2. **並行実行**:
   - 旧テストと新テストを並行実行
   - 新テストが安定してから旧テストを削除

---

## 成功基準

1. **spec参照率100%**: accountサービスのすべての実装でspecを参照
2. **ハードコード削減**: 150-200行の削減
3. **セキュリティ向上**: validatePasswordがspec要件を完全に実装
4. **テスト通過率100%**: 全ユニットテスト・E2Eテストが通過
5. **spec整合性**: spec/実装/テストの値が完全に一致

---

## 推定工数

| Phase | 作業内容 | 工数 |
|-------|---------|------|
| Phase 1 | routes層のリファクタリング | 2-3日 |
| Phase 2 | lib層のリファクタリング | 1日 |
| Phase 3 | components層のリファクタリング | 2日 |
| Phase 4 | E2Eテストのリファクタリング | 1-2日 |
| Phase 5 | 最終確認・ドキュメント | 1日 |
| **合計** | | **7-9日** |

---

## 次のステップ

このRFC承認後、即座にPhase 1（routes層）に着手することを推奨します。

- **最優先**: `validatePassword.ts` のセキュリティ修正
- **Phase 1完了後**: Phase 2以降を順次実施

---

## 備考

このRFCは、RFC-001〜005とは独立して実施可能です。むしろ、**RFC-001〜005よりも優先すべき**緊急度の高い改善です。

理由:
1. **セキュリティリスク**: パスワードバリデーションの欠落
2. **二重管理**: 1,313行のspecファイルが無駄になっている
3. **保守性**: 62箇所のエラーメッセージを手動管理

**推奨実施順序**:
1. **RFC-006** (本RFC) - 緊急対応
2. RFC-001 - TOML→YAML移行
3. RFC-002 - shared spec基盤
4. RFC-003 - 重複排除
5. RFC-004 - 責務明確化
6. RFC-005 - 構成化メカニズム
