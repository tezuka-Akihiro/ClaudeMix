# RFC-002: サービス横断spec基盤の構築

**ステータス**: 提案
**作成日**: 2026-01-03
**優先度**: 高
**Phase**: 2
**依存**: RFC-001完了

---

## 変更の概要

`app/specs/shared/` 配下に、サービス横断で使用する共通specファイル群を新規作成し、spec-loaderを拡張してこれらを読み込めるようにする。

---

## 背景と目的

### 現状の問題

1. **サービス横断値の散在**
   - プロジェクト名「ClaudeMix」: 3ファイル6箇所
   - タイムアウト設定: 7ファイル（全spec）
   - ブレークポイント: 3ファイル
   - バリデーションルール: account配下3ファイル

2. **共通設定の重複定義**
   ```yaml
   # 7ファイルで重複
   server_io:
     loader:
       timeout: 5000
   ```

3. **SSoT原則の不完全な実装**
   - セクション内commonは存在するが、サービス横断の共通層が不在
   - 技術的設定値（timeout、breakpoints等）の一元管理が不可能

### 目的

1. **SSoT原則の完全実装**: サービス横断値を1箇所に集約
2. **保守性向上**: 共通設定変更時の修正箇所を削減（7箇所→1箇所）
3. **拡張性確保**: 今後追加されるサービスでも即座に共通設定を利用可能

---

## 変更内容

### 1. 新規ディレクトリ・ファイル作成

**ディレクトリ構造**:

```
app/specs/
├── shared/                     # 新規作成
│   ├── project-spec.yaml       # RFC-001で作成済み
│   ├── validation-spec.yaml    # 新規
│   ├── responsive-spec.yaml    # 新規
│   ├── server-spec.yaml        # 新規
│   └── types.ts                # 新規
├── blog/
│   ├── common-spec.yaml
│   ├── posts-spec.yaml
│   ├── post-detail-spec.yaml
│   └── types.ts
└── account/
    ├── common-spec.yaml
    ├── authentication-spec.yaml
    ├── profile-spec.yaml
    ├── subscription-spec.yaml
    └── types.ts
```

### 2. 各specファイルの詳細設計

#### 2.1 validation-spec.yaml

**責務**: アプリケーション全体で使用するバリデーションルール

**内容**:

```yaml
metadata:
  feature_name: "shared-validation"
  version: "1.0.0"
  description: "サービス横断のバリデーションルール定義"

email:
  pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  max_length: 254
  error_message: "有効なメールアドレスを入力してください"

password:
  min_length: 8
  max_length: 128
  pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"
  requirements:
    - "8文字以上"
    - "大文字を含む"
    - "小文字を含む"
    - "数字を含む"
  error_message: "パスワードは8文字以上で、大文字・小文字・数字を含む必要があります"

username:
  min_length: 3
  max_length: 20
  pattern: "^[a-zA-Z0-9_-]+$"
  error_message: "ユーザー名は3-20文字で、英数字・アンダースコア・ハイフンのみ使用できます"

url:
  pattern: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$"
  error_message: "有効なURLを入力してください"
```

**移行元**:
- `account/common-spec.yaml:110-124`
- `account/authentication-spec.yaml:120-139`
- `account/profile-spec.yaml:163-193`

#### 2.2 responsive-spec.yaml

**責務**: レスポンシブデザインの共通設定

**内容**:

```yaml
metadata:
  feature_name: "shared-responsive"
  version: "1.0.0"
  description: "レスポンシブデザインの共通設定（ブレークポイント、グリッド等）"

breakpoints:
  mobile: 768    # px
  tablet: 1024   # px
  desktop: 1440  # px

grid_columns:
  mobile: 1
  tablet: 2
  desktop: 3

spacing:
  mobile: 16   # px
  tablet: 24   # px
  desktop: 32  # px

font_sizes:
  mobile:
    base: 16   # px
    heading: 24
  tablet:
    base: 16
    heading: 28
  desktop:
    base: 16
    heading: 32

container:
  max_width: 1280  # px
  padding:
    mobile: 16     # px
    tablet: 24
    desktop: 32
```

**移行元**:
- `blog/common-spec.yaml:166-168`
- `blog/posts-spec.yaml:249-265`
- `account/common-spec.yaml:190-203`

#### 2.3 server-spec.yaml

**責務**: サーバーサイド処理の共通設定

**内容**:

```yaml
metadata:
  feature_name: "shared-server"
  version: "1.0.0"
  description: "サーバーサイド処理の共通設定（タイムアウト、レート制限等）"

loader:
  timeout: 5000           # ms
  retry:
    max_attempts: 3
    backoff: "exponential"
    initial_delay: 1000   # ms

action:
  timeout: 10000          # ms
  retry:
    max_attempts: 2
    backoff: "linear"
    initial_delay: 2000   # ms

rate_limit:
  per_minute: 60
  per_hour: 1000
  per_day: 10000

cache:
  default_ttl: 300        # seconds (5分)
  max_age: 3600           # seconds (1時間)

security:
  bcrypt_rounds: 10
  session_max_age: 604800 # seconds (7日間)
  csrf_token_length: 32
```

**移行元**:
- `blog/common-spec.yaml:20`
- `blog/posts-spec.yaml:27`
- `blog/post-detail-spec.yaml:20`
- `account/common-spec.yaml:20,30-46` (session設定の一部)
- `account/authentication-spec.yaml:20`
- `account/profile-spec.yaml:20`
- `account/subscription-spec.yaml:20`

#### 2.4 types.ts

**責務**: sharedスペックのTypeScript型定義

**内容**:

```typescript
/**
 * shared specファイルの型定義
 */

// validation-spec.yaml
export interface ValidationRule {
  pattern: string;
  error_message: string;
}

export interface PasswordValidation extends ValidationRule {
  min_length: number;
  max_length: number;
  requirements: string[];
}

export interface EmailValidation extends ValidationRule {
  max_length: number;
}

export interface UsernameValidation extends ValidationRule {
  min_length: number;
  max_length: number;
}

export interface ValidationSpec {
  metadata: {
    feature_name: string;
    version: string;
    description: string;
  };
  email: EmailValidation;
  password: PasswordValidation;
  username: UsernameValidation;
  url: ValidationRule;
}

// responsive-spec.yaml
export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface GridColumns {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface FontSizes {
  mobile: { base: number; heading: number };
  tablet: { base: number; heading: number };
  desktop: { base: number; heading: number };
}

export interface ResponsiveSpec {
  metadata: {
    feature_name: string;
    version: string;
    description: string;
  };
  breakpoints: Breakpoints;
  grid_columns: GridColumns;
  spacing: GridColumns;
  font_sizes: FontSizes;
  container: {
    max_width: number;
    padding: GridColumns;
  };
}

// server-spec.yaml
export interface RetryConfig {
  max_attempts: number;
  backoff: 'exponential' | 'linear';
  initial_delay: number;
}

export interface TimeoutConfig {
  timeout: number;
  retry: RetryConfig;
}

export interface ServerSpec {
  metadata: {
    feature_name: string;
    version: string;
    description: string;
  };
  loader: TimeoutConfig;
  action: TimeoutConfig;
  rate_limit: {
    per_minute: number;
    per_hour: number;
    per_day: number;
  };
  cache: {
    default_ttl: number;
    max_age: number;
  };
  security: {
    bcrypt_rounds: number;
    session_max_age: number;
    csrf_token_length: number;
  };
}

// project-spec.yaml (RFC-001で定義済み)
export interface ProjectSpec {
  metadata: {
    version: string;
    migrated_from?: string;
    migration_date?: string;
  };
  project: {
    name: string;
    service_name: string;
    concept: string;
    target: string;
    value_proposition: string;
  };
  references: {
    world_view_site_url: string;
    app_url: string;
  };
  services: {
    [serviceName: string]: {
      name: string;
      description: string;
      doc_path: string;
      sections: {
        [sectionName: string]: {
          name: string;
          abstract_purpose: string;
          specific_purpose: string;
          input: string;
          processing: string;
          output: string;
          doc_path: string;
        };
      };
    };
  };
}
```

### 3. spec-loaderの拡張

**ファイル**: `app/spec-loader/specLoader.server.ts`

**変更内容**:

```typescript
// 変更前
import { getSpec } from '~/generated/specs';

export function loadSpec<T>(featurePath: string): T {
  return getSpec<T>(featurePath);
}

// 変更後
import { getSpec, getSharedSpec } from '~/generated/specs';

/**
 * セクションspecをロード
 * @param featurePath 'blog/posts' のような機能パス
 */
export function loadSpec<T>(featurePath: string): T {
  return getSpec<T>(featurePath);
}

/**
 * 共通specをロード
 * @param specName 'validation', 'responsive', 'server', 'project' のいずれか
 */
export function loadSharedSpec<T>(specName: string): T {
  return getSharedSpec<T>(specName);
}
```

### 4. generate-specs.jsの拡張

**ファイル**: `scripts/prebuild/generate-specs.js`

**変更内容**:

```javascript
// 変更前（行31-58）
const specs = {};
const services = await fs.readdir(specsDir);

for (const service of services) {
  const servicePath = path.join(specsDir, service);
  const stat = await fs.stat(servicePath);

  if (!stat.isDirectory()) continue;

  const files = await fs.readdir(servicePath);
  const yamlFiles = files.filter(file => file.endsWith('-spec.yaml'));

  for (const file of yamlFiles) {
    const sectionName = file.replace('-spec.yaml', '');
    const featurePath = `${service}/${sectionName}`;
    const specPath = path.join(servicePath, file);

    try {
      const yamlString = await fs.readFile(specPath, 'utf-8');
      const parsedSpec = yaml.load(yamlString);
      specs[featurePath] = parsedSpec;
      console.log(`   ✅ Loaded spec: ${featurePath}`);
    } catch (error) {
      console.error(`   ❌ Failed to load spec ${featurePath}:`, error.message);
    }
  }
}

// 変更後
const specs = {};
const sharedSpecs = {}; // 新規追加
const services = await fs.readdir(specsDir);

for (const service of services) {
  const servicePath = path.join(specsDir, service);
  const stat = await fs.stat(servicePath);

  if (!stat.isDirectory()) continue;

  const files = await fs.readdir(servicePath);
  const yamlFiles = files.filter(file => file.endsWith('-spec.yaml'));

  for (const file of yamlFiles) {
    const specPath = path.join(servicePath, file);

    try {
      const yamlString = await fs.readFile(specPath, 'utf-8');
      const parsedSpec = yaml.load(yamlString);

      // sharedディレクトリの場合は別管理
      if (service === 'shared') {
        const specName = file.replace('-spec.yaml', '').replace('project-', ''); // 'project-spec.yaml' -> 'project'
        sharedSpecs[specName] = parsedSpec;
        console.log(`   ✅ Loaded shared spec: ${specName}`);
      } else {
        const sectionName = file.replace('-spec.yaml', '');
        const featurePath = `${service}/${sectionName}`;
        specs[featurePath] = parsedSpec;
        console.log(`   ✅ Loaded spec: ${featurePath}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to load spec ${specPath}:`, error.message);
    }
  }
}

console.log(`📝 Found ${Object.keys(specs).length} section specs`);
console.log(`📝 Found ${Object.keys(sharedSpecs).length} shared specs`);
```

**TypeScript生成部分の変更**:

```javascript
// 変更前（行63-94）
const tsContent = `// Auto-generated by scripts/prebuild/generate-specs.js
// Do not edit manually - this file is regenerated on every build

const specs: Record<string, unknown> = ${JSON.stringify(specs, null, 2)};

export function getSpec<T>(featurePath: string): T {
  if (!specs[featurePath]) {
    throw new Error(\`Spec not found for feature: \${featurePath}\`);
  }
  return specs[featurePath] as T;
}

export function getAllSpecPaths(): string[] {
  return Object.keys(specs);
}
`;

// 変更後
const tsContent = `// Auto-generated by scripts/prebuild/generate-specs.js
// Do not edit manually - this file is regenerated on every build

/**
 * セクションspec（サービス/セクション単位）
 */
const specs: Record<string, unknown> = ${JSON.stringify(specs, null, 2)};

/**
 * 共通spec（サービス横断）
 */
const sharedSpecs: Record<string, unknown> = ${JSON.stringify(sharedSpecs, null, 2)};

/**
 * セクションspecを取得
 * @param featurePath 'blog/posts' のような機能パス
 * @returns パース済みのSpecオブジェクト
 */
export function getSpec<T>(featurePath: string): T {
  if (!specs[featurePath]) {
    throw new Error(\`Spec not found for feature: \${featurePath}\`);
  }
  return specs[featurePath] as T;
}

/**
 * 共通specを取得
 * @param specName 'validation', 'responsive', 'server', 'project' のいずれか
 * @returns パース済みのSharedSpecオブジェクト
 */
export function getSharedSpec<T>(specName: string): T {
  if (!sharedSpecs[specName]) {
    throw new Error(\`Shared spec not found: \${specName}\`);
  }
  return sharedSpecs[specName] as T;
}

/**
 * 読み込まれているすべてのspec機能パスを取得
 */
export function getAllSpecPaths(): string[] {
  return Object.keys(specs);
}

/**
 * 読み込まれているすべての共通spec名を取得
 */
export function getAllSharedSpecNames(): string[] {
  return Object.keys(sharedSpecs);
}
`;
```

---

## 影響範囲

### 直接影響

- **新規作成**: 4ファイル
  - `app/specs/shared/validation-spec.yaml`
  - `app/specs/shared/responsive-spec.yaml`
  - `app/specs/shared/server-spec.yaml`
  - `app/specs/shared/types.ts`

- **変更**: 2ファイル
  - `scripts/prebuild/generate-specs.js` (約50行追加)
  - `app/spec-loader/specLoader.server.ts` (約10行追加)

### 間接影響

- **既存specファイル**: 影響なし（Phase 3で参照に切り替え）
- **data-io層**: 影響なし（Phase 3で利用開始）

---

## 移行手順

### ステップ1: ディレクトリ作成

```bash
mkdir -p app/specs/shared
```

### ステップ2: 新規specファイル作成

```bash
# validation-spec.yaml 作成
# responsive-spec.yaml 作成
# server-spec.yaml 作成
# types.ts 作成
```

### ステップ3: generate-specs.js 拡張

```bash
# scripts/prebuild/generate-specs.js を編集
```

### ステップ4: spec-loader 拡張

```bash
# app/spec-loader/specLoader.server.ts を編集
```

### ステップ5: ビルド確認

```bash
# ビルドスクリプト実行
npm run build

# 生成ファイル確認
cat app/generated/specs.ts | grep "sharedSpecs"
```

### ステップ6: 単体テスト作成

```bash
# spec-loaderのテスト作成
# app/spec-loader/specLoader.server.test.ts
```

---

## テスト計画

### 単体テスト

**新規テストファイル**: `app/spec-loader/specLoader.server.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { loadSpec, loadSharedSpec } from './specLoader.server';
import type { ValidationSpec, ResponsiveSpec, ServerSpec } from '~/specs/shared/types';

describe('specLoader', () => {
  describe('loadSharedSpec', () => {
    it('validation specを正しくロードできる', () => {
      const spec = loadSharedSpec<ValidationSpec>('validation');

      expect(spec.metadata.feature_name).toBe('shared-validation');
      expect(spec.email.pattern).toBeDefined();
      expect(spec.password.min_length).toBe(8);
    });

    it('responsive specを正しくロードできる', () => {
      const spec = loadSharedSpec<ResponsiveSpec>('responsive');

      expect(spec.breakpoints.mobile).toBe(768);
      expect(spec.breakpoints.tablet).toBe(1024);
      expect(spec.grid_columns.desktop).toBe(3);
    });

    it('server specを正しくロードできる', () => {
      const spec = loadSharedSpec<ServerSpec>('server');

      expect(spec.loader.timeout).toBe(5000);
      expect(spec.action.timeout).toBe(10000);
      expect(spec.security.bcrypt_rounds).toBe(10);
    });

    it('存在しないspec名でエラーを投げる', () => {
      expect(() => {
        loadSharedSpec('nonexistent');
      }).toThrow('Shared spec not found: nonexistent');
    });
  });

  describe('loadSpec (既存)', () => {
    it('blog/posts specを正しくロードできる', () => {
      const spec = loadSpec('blog/posts');
      expect(spec).toBeDefined();
    });
  });
});
```

### 統合テスト

```bash
# ビルドプロセス全体の確認
npm run build

# 生成されたspecs.tsの構造確認
node -e "
  const specs = require('./app/generated/specs.ts');
  console.log('Section specs:', Object.keys(specs.specs));
  console.log('Shared specs:', Object.keys(specs.sharedSpecs));
"
```

---

## ロールバック手順

### 緊急時

```bash
# Git revert
git revert HEAD

# ビルド再実行
npm run build
```

### 計画的ロールバック

1. 新規作成したshared/配下のファイルを削除
2. generate-specs.js を旧バージョンに戻す
3. specLoader.server.ts を旧バージョンに戻す
4. ビルド実行で確認

---

## リスクと対策

### リスク1: ビルドプロセスの破壊

**確率**: 低
**影響度**: 高

**対策**:
- ビルド前後でテスト実行
- CI/CDパイプラインでの自動検証
- ロールバック手順の事前準備

### リスク2: 型定義の不一致

**確率**: 中
**影響度**: 中

**対策**:
- types.tsの厳密な型定義
- TypeScriptコンパイラでの検証
- 単体テストでの型アサーション

### リスク3: 既存機能への影響

**確率**: 極低
**影響度**: 中

**対策**:
- 既存specファイルは変更しない（Phase 3まで）
- 新規APIの追加のみ（破壊的変更なし）

---

## 成功基準

1. **ビルド成功**: `npm run build` が正常終了
2. **spec生成確認**: `app/generated/specs.ts` に `sharedSpecs` オブジェクトが含まれる
3. **型チェック通過**: `npm run typecheck` がエラーなし
4. **単体テスト通過**: spec-loaderのテストが全て成功

---

## 次のステップ

このRFC承認後、Phase 3（重複の排除とshared参照への移行）に進む。

- **Phase 3 RFC**: `RFC-003-migrate-to-shared-refs.md`
- **依存関係**: RFC-002の完了が前提条件
