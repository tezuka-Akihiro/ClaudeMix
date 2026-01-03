# RFC-003: 重複の排除とshared参照への移行

**ステータス**: 提案
**作成日**: 2026-01-03
**優先度**: 高
**Phase**: 3
**依存**: RFC-002完了

---

## 変更の概要

既存specファイルから重複している定義を削除し、RFC-002で作成したshared specへの参照に置き換える。これにより、80-120行の重複コードを削減し、SSoT原則を完全に実現する。

---

## 背景と目的

### 現状の問題

RFC-002で shared spec基盤は整備されたが、既存のspecファイルは依然として重複した値を保持している：

1. **timeout: 5000** → 7ファイルで重複
2. **breakpoints (768/1024)** → 3ファイルで重複
3. **validation patterns** → account配下3ファイルで重複
4. **copyright_name: "ClaudeMix"** → 2ファイルで重複

### 目的

1. **重複排除**: 80-120行の重複定義を削除
2. **shared参照への移行**: data-io層でshared specを読み込む実装に変更
3. **保守性向上**: 変更時の修正箇所を1箇所に集約

---

## 変更内容

### 1. 既存specファイルからの削除対象

#### 1.1 project名・copyright名の削除

**削除対象**:

```yaml
# blog/posts-spec.yaml (行17-19)
project:
  name: "ClaudeMix"           # 削除
  copyright_name: "ClaudeMix" # 削除

# blog/common-spec.yaml (行29-30)
blog_config:
  title: "ClaudeMix Blog"     # 保持（ブログ固有）
  copyright_name: "ClaudeMix" # 削除
```

**理由**: `shared/project-spec.yaml` で一元管理

#### 1.2 timeout設定の削除

**削除対象**: 全7ファイル

```yaml
# 以下のファイルから削除
# - blog/common-spec.yaml:20
# - blog/posts-spec.yaml:27
# - blog/post-detail-spec.yaml:20
# - account/common-spec.yaml:20
# - account/authentication-spec.yaml:20
# - account/profile-spec.yaml:20
# - account/subscription-spec.yaml:20

server_io:
  loader:
    timeout: 5000  # 削除
```

**理由**: `shared/server-spec.yaml` で一元管理

#### 1.3 responsive設定の削除

**削除対象**: 3ファイル

```yaml
# blog/common-spec.yaml:166-168
# blog/posts-spec.yaml:249-251
# account/common-spec.yaml:190-192

responsive:
  breakpoints:
    mobile: 768   # 削除
    tablet: 1024  # 削除
```

**注意**: `blog/posts-spec.yaml` の `grid_columns` はブログ固有設定のため保持

```yaml
# blog/posts-spec.yaml (保持)
responsive:
  grid_columns:  # 保持（posts固有）
    mobile: 1
    tablet: 2
    desktop: 3
```

#### 1.4 validation設定の削除

**削除対象**: 2ファイル

```yaml
# account/authentication-spec.yaml:120-139
validation:
  email:                # 削除（完全にsharedと重複）
    pattern: "..."
    max_length: 254
    error_message: "..."
  password:             # 削除（完全にsharedと重複）
    min_length: 8
    max_length: 128
    pattern: "..."
    error_message: "..."

# account/profile-spec.yaml:163-193
validation:
  new_email:            # 削除（authentication-specと同値）
    pattern: "..."
    max_length: 254
  new_password:         # 削除（authentication-specと同値）
    min_length: 8
    max_length: 128
    pattern: "..."
  current_password:     # 保持（profile固有）
    min_length: 1
    error_message: "現在のパスワードを入力してください"
```

**理由**: `shared/validation-spec.yaml` で一元管理

---

### 2. data-io層での参照実装

#### 2.1 blog/posts 関連

**ファイル**: `app/data-io/blog/posts/loadPostsSpec.server.ts`

```typescript
// 変更前
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogPostsSpec } from '~/specs/blog/types';

export function loadPostsSpec(): BlogPostsSpec {
  return loadSpec<BlogPostsSpec>('blog/posts');
}

// 変更後
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { BlogPostsSpec } from '~/specs/blog/types';
import type { ProjectSpec, ServerSpec, ResponsiveSpec } from '~/specs/shared/types';

export function loadPostsSpec(): BlogPostsSpec {
  return loadSpec<BlogPostsSpec>('blog/posts');
}

export function loadPostsServerConfig() {
  const serverSpec = loadSharedSpec<ServerSpec>('server');
  return {
    timeout: serverSpec.loader.timeout
  };
}

export function loadPostsResponsiveConfig() {
  const responsiveSpec = loadSharedSpec<ResponsiveSpec>('responsive');
  return {
    breakpoints: responsiveSpec.breakpoints
  };
}

export function loadProjectInfo() {
  const projectSpec = loadSharedSpec<ProjectSpec>('project');
  return {
    name: projectSpec.project.name,
    copyrightName: projectSpec.project.name  // "ClaudeMix"
  };
}
```

**使用側の変更例** (`app/routes/blog._index.tsx`):

```typescript
// 変更前
export async function loader({ request }: LoaderFunctionArgs) {
  const spec = loadPostsSpec();
  // spec.server_io.loader.timeout を直接参照
  // spec.project.copyright_name を直接参照
}

// 変更後
export async function loader({ request }: LoaderFunctionArgs) {
  const spec = loadPostsSpec();
  const serverConfig = loadPostsServerConfig();
  const projectInfo = loadProjectInfo();

  // serverConfig.timeout を使用
  // projectInfo.copyrightName を使用
}
```

#### 2.2 blog/common 関連

**ファイル**: `app/data-io/blog/common/loadBlogConfig.server.ts`

```typescript
// 変更前
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';

export async function loadBlogConfig(): Promise<BlogConfig> {
  const spec = loadSpec<BlogCommonSpec>('blog/common');

  const copyright = `© ${new Date().getFullYear()} ${spec.blog_config.copyright_name}`;

  return {
    blogTitle: spec.blog_config.title,
    menuItems: spec.navigation.menu_items,
    copyright,
    siteUrl: spec.blog_config.site_url,
    footerLinks: ...,
    legalContent: ...
  };
}

// 変更後
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { BlogCommonSpec } from '~/specs/blog/types';
import type { ProjectSpec } from '~/specs/shared/types';

export async function loadBlogConfig(): Promise<BlogConfig> {
  const spec = loadSpec<BlogCommonSpec>('blog/common');
  const projectSpec = loadSharedSpec<ProjectSpec>('project');

  const copyright = `© ${new Date().getFullYear()} ${projectSpec.project.name}`;

  return {
    blogTitle: spec.blog_config.title,
    menuItems: spec.navigation.menu_items,
    copyright,
    siteUrl: spec.blog_config.site_url,
    footerLinks: ...,
    legalContent: ...
  };
}
```

#### 2.3 account/authentication 関連

**ファイル**: `app/data-io/account/authentication/validateCredentials.server.ts`

```typescript
// 変更前
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

export function validateEmail(email: string): boolean {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const pattern = new RegExp(spec.validation.email.pattern);
  return pattern.test(email);
}

export function validatePassword(password: string): boolean {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const pattern = new RegExp(spec.validation.password.pattern);
  const minLength = spec.validation.password.min_length;

  return password.length >= minLength && pattern.test(password);
}

// 変更後
import { loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { ValidationSpec } from '~/specs/shared/types';

export function validateEmail(email: string): boolean {
  const validationSpec = loadSharedSpec<ValidationSpec>('validation');
  const pattern = new RegExp(validationSpec.email.pattern);
  return pattern.test(email) && email.length <= validationSpec.email.max_length;
}

export function validatePassword(password: string): boolean {
  const validationSpec = loadSharedSpec<ValidationSpec>('validation');
  const pattern = new RegExp(validationSpec.password.pattern);
  const { min_length, max_length } = validationSpec.password;

  return (
    password.length >= min_length &&
    password.length <= max_length &&
    pattern.test(password)
  );
}

export function getPasswordRequirements(): string[] {
  const validationSpec = loadSharedSpec<ValidationSpec>('validation');
  return validationSpec.password.requirements;
}
```

---

### 3. spec型定義の更新

#### 3.1 blog/types.ts の更新

```typescript
// 変更前
export interface BlogPostsSpec {
  metadata: {...};
  project: {                    // 削除
    name: string;
    copyright_name: string;
  };
  server_io: {                  // 削除
    loader: {
      timeout: number;
      default_sort: string;
    };
  };
  responsive: {                 // 一部削除
    breakpoints: {
      mobile: number;
      tablet: number;
    };
    grid_columns: {...};
  };
  // ... その他のフィールド
}

// 変更後
export interface BlogPostsSpec {
  metadata: {...};
  // project セクション削除
  // server_io セクション削除
  responsive: {
    // breakpoints 削除
    grid_columns: {              // 保持（posts固有）
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
  // ... その他のフィールド
}

export interface BlogCommonSpec {
  metadata: {...};
  blog_config: {
    title: string;
    // copyright_name 削除
    home_path: string;
    site_url: string;
  };
  // responsive.breakpoints 削除
  // ... その他のフィールド
}
```

#### 3.2 account/types.ts の更新

```typescript
// 変更前
export interface AccountAuthenticationSpec {
  metadata: {...};
  server_io: {                  // 削除
    loader: {
      timeout: number;
    };
  };
  validation: {                 // 削除
    email: {...};
    password: {...};
  };
  // ... その他のフィールド
}

export interface AccountProfileSpec {
  metadata: {...};
  validation: {
    new_email: {...};           // 削除
    new_password: {...};        // 削除
    current_password: {...};    // 保持（profile固有）
  };
  // ... その他のフィールド
}

// 変更後
export interface AccountAuthenticationSpec {
  metadata: {...};
  // server_io 削除
  // validation 削除
  forms: {...};                 // 保持
  error_messages: {...};        // 保持
  ui_selectors: {...};          // 保持
  // ... その他のフィールド
}

export interface AccountProfileSpec {
  metadata: {...};
  validation: {
    current_password: {         // 保持（profile固有）
      min_length: number;
      error_message: string;
    };
  };
  forms: {...};                 // 保持
  modals: {...};                // 保持
  // ... その他のフィールド
}
```

---

## 影響範囲

### 直接影響

**変更ファイル数**: 15-20ファイル

- **既存spec**: 7ファイル（重複削除）
- **data-io層**: 8-10ファイル（shared spec参照追加）
- **型定義**: 2ファイル（blog/types.ts, account/types.ts）

### 間接影響

**依存するroutes/components**: 約20-30ファイル
- loaderでdata-io層を使用しているルート
- validationを使用しているコンポーネント

**注意**: data-io層のインターフェースは変更しないため、routes/componentsの変更は不要

---

## 移行手順

### ステップ1: data-io層の拡張（新規関数追加）

```bash
# 各data-io層に shared spec 読み込み関数を追加
# 既存関数は変更しない（破壊的変更回避）
```

### ステップ2: routes層の段階的移行

```bash
# 1ファイルずつ、新しいdata-io関数を使用するように変更
# 例: blog._index.tsx → loadProjectInfo() を使用
```

### ステップ3: 既存specファイルからの削除

```bash
# routes層の移行完了後、specファイルから重複を削除
# 1セクションずつ削除して動作確認
```

### ステップ4: 型定義の更新

```bash
# blog/types.ts, account/types.ts から削除されたフィールドを除去
# TypeScriptコンパイラエラーが出ないことを確認
```

### ステップ5: 全体テスト

```bash
npm run typecheck
npm test
npm run lint:all
```

---

## テスト計画

### 単体テスト

**新規テスト**: data-io層の shared spec 読み込み関数

```typescript
// app/data-io/blog/posts/loadPostsSpec.server.test.ts

import { describe, it, expect } from 'vitest';
import { loadPostsServerConfig, loadProjectInfo } from './loadPostsSpec.server';

describe('loadPostsServerConfig', () => {
  it('shared server specからtimeoutを取得できる', () => {
    const config = loadPostsServerConfig();
    expect(config.timeout).toBe(5000);
  });
});

describe('loadProjectInfo', () => {
  it('shared project specからプロジェクト名を取得できる', () => {
    const info = loadProjectInfo();
    expect(info.name).toBe('ClaudeMix');
    expect(info.copyrightName).toBe('ClaudeMix');
  });
});
```

**既存テストの更新**: validation関連

```typescript
// app/data-io/account/authentication/validateCredentials.server.test.ts

import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword } from './validateCredentials.server';

describe('validateEmail', () => {
  it('有効なメールアドレスを検証できる', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  it('254文字を超えるメールアドレスを拒否する', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(validateEmail(longEmail)).toBe(false);
  });
});

describe('validatePassword', () => {
  it('有効なパスワードを検証できる', () => {
    expect(validatePassword('Abcd1234')).toBe(true);
    expect(validatePassword('weak')).toBe(false);
  });

  it('8文字未満のパスワードを拒否する', () => {
    expect(validatePassword('Abc123')).toBe(false);
  });

  it('128文字を超えるパスワードを拒否する', () => {
    const longPassword = 'A1' + 'a'.repeat(127);
    expect(validatePassword(longPassword)).toBe(false);
  });
});
```

### E2Eテスト

**対象**: 既存のE2Eテストがすべて通過することを確認

```bash
# アカウント関連
npx playwright test tests/e2e/account --config=tests/e2e/playwright.config.ts

# ブログ関連
npx playwright test tests/e2e/screen/blog --config=tests/e2e/playwright.config.ts
```

---

## ロールバック手順

### 緊急時（10分以内）

```bash
# Git revert
git revert HEAD~3..HEAD  # Phase 3の全コミットを取り消し

# ビルド・テスト実行
npm run build
npm test
```

### 段階的ロールバック

1. routes層を旧data-io関数に戻す
2. data-io層の新規関数を削除
3. 削除したspecフィールドを復元
4. 型定義を元に戻す

---

## リスク と対策

### リスク1: routes層での参照エラー

**確率**: 中
**影響度**: 高

**対策**:
- TypeScriptコンパイラによる事前検出
- 段階的移行（1ファイルずつ）
- 各ステップでのテスト実行

### リスク2: validation動作の変更

**確率**: 低
**影響度**: 高

**対策**:
- shared/validation-spec.yaml の値が既存と完全一致することを確認
- 単体テストで全パターン検証
- E2Eテストで実際のフォーム動作確認

### リスク3: パフォーマンスの劣化

**確率**: 極低
**影響度**: 低

**対策**:
- spec読み込みはビルド時に解決されるため影響なし
- 念のため、loaderのレスポンスタイムを計測

---

## 成功基準

1. **重複削減**: 80-120行の削減を達成
2. **型チェック通過**: `npm run typecheck` がエラーなし
3. **全テスト通過**: 単体テスト・E2Eテストがすべて成功
4. **機能完全性**: 既存機能がすべて動作する

---

## 削減効果の測定

**削減前**:
```bash
wc -l app/specs/blog/*.yaml app/specs/account/*.yaml
# 2019 total
```

**削減後**:
```bash
wc -l app/specs/blog/*.yaml app/specs/account/*.yaml
# 1900-1940 total (80-120行削減)
```

**削減率**: 約 4-6%

---

## 次のステップ

このRFC承認後、Phase 4（commonセクションの責務明確化）に進む。

- **Phase 4 RFC**: `RFC-004-clarify-common-responsibility.md`
- **依存関係**: RFC-003の完了が前提条件
