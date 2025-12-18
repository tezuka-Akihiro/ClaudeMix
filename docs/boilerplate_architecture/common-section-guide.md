# ガイド: commonセクションの実装

**対象読者**: commonセクションを実装する開発者
**前提知識**: セッション管理の基本 ([session-management-guide.md](./session-management-guide.md))
**関連文書**: [commonセクション責務決定ログ](../develop/service-name/common/2025-10-13-common-section-responsibility-for-page-container.md)

---

## 1. 概要

### 1.1. commonセクションとは

`common`セクションは、他の機能セクション（`design-flow`, `implementation-flow`など）とは異なる、**サービス全体の基盤を構築する特別な役割**を担います。

### 1.2. 重要な実装原則

⚠️ **最優先実装**: `common`セクションは、必ず他のどのセクションよりも**先に実装**してください。

**理由**:

- ページコンテナが他セクションの配置先となる
- E2Eテストファイルの土台を提供する
- セッション機能の初期統合を担当する

## 2. commonセクションの責務

`common`セクションは、以下の2つの主要な実装責務を持ちます。

### 2.1. ページコンテナの実装

各セクションを統合するルートファイル（例: `app/routes/service-name.tsx`）のレイアウトを実装します。

**成果物**:

- ルートファイル: `app/routes/{service-name}.tsx`
- E2Eテストファイル: `tests/e2e/screen/{service-name}.screen.spec.ts`

**実装例**:

~~~tsx
// app/routes/service-name.tsx
import { Header } from "~/components/service-name/common/Header";
import { Footer } from "~/components/service-name/common/Footer";

export default function FlowAuditor() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* 個別セクションはここに配置される */}
      </main>
      <Footer />
    </div>
  );
}
~~~

### 2.2. 共通コンポーネントの実装

`Header`, `Footer`など、サービス全体で共有されるコンポーネントを実装します。

**配置場所**: `app/components/{service-name}/common/`

**成果物**:

- `app/components/{service-name}/common/Header.tsx`
- `app/components/{service-name}/common/Footer.tsx`
- その他の共通UI要素

**実装例**:

~~~tsx
// app/components/service-name/common/Header.tsx
import { useSession } from "~/components/providers/SessionProvider";

export function Header() {
  const { user, status } = useSession();

  return (
    <header className="bg-[#1a1f3a] border-b-2 border-[#00ff41] p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-[#00ff41] font-mono text-xl">
          service name
        </h1>

        {/* セッション情報の表示 */}
        <div className="text-[#00ff41] font-mono text-sm">
          {status === "authenticated" ? (
            <span>Welcome, {user.name}!</span>
          ) : (
            <span>Not logged in</span>
          )}
        </div>
      </div>
    </header>
  );
}
~~~

## 3. セッション機能との統合

### 3.1. なぜcommonセクションでセッションを使うのか

`common`セクションは、ボイラープレート標準のセッション機能を**最初に利用する**重要な責務を持ちます。

**理由**:

- Header/Footerは全ページで共有される → セッション情報の表示に最適
- ページコンテナがセッション保護の対象となる
- 他のセクションがセッション統合の実装例を参考にできる

### 3.2. 具体的な統合方法

#### `useSession`フックの利用

`Header`や`Footer`コンポーネントで`useSession`フックを使い、認証状態やユーザー情報を表示します。

~~~tsx
import { useSession } from "~/components/providers/SessionProvider";
import { Link } from "@remix-run/react";

export function Header() {
  const { user, status } = useSession();

  return (
    <header>
      <h1>My Service</h1>

      {/* 認証状態に応じた表示切り替え */}
      {status === "authenticated" ? (
        <div>
          <span>Welcome, {user.name}!</span>
          <Link to="/logout">Logout</Link>
        </div>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  );
}
~~~

#### セッション保護の考慮

サービスが認証を必要とする場合、ページコンテナを`_protected`レイアウトに配置することを検討してください。

~~~tsx
// app/routes/_protected.service-name.tsx (セッション保護が必要な場合)
export default function FlowAuditor() {
  // 未認証ユーザーは自動的に /login にリダイレクトされる
  return <div>...</div>;
}
~~~

**詳細**: セッション機能の全体像については、[session-management-guide.md](./session-management-guide.md) を参照してください。

## 4. E2Eテストの責務

### 4.1. なぜcommonセクションでE2Eテストを作成するのか

`common`セクションは、サービス全体のE2Eテストの**土台**を構築します。

**重要**: 他のセクション(`design-flow`等)は、既存のE2Eテストファイルにテストを**追記**します。したがって、**最初のE2Eテストファイルを作成するのはcommonセクションの責務**です。

### 4.2. テストファイルの作成

**ファイルパス**: `tests/e2e/screen/{service-name}.screen.spec.ts`

**実装例**:

~~~typescript
// tests/e2e/screen/service-name.screen.spec.ts
import { test, expect } from "@playwright/test";

test.describe("service name Screen", () => {
  test("should display page container with Header and Footer", async ({ page }) => {
    await page.goto("/service-name");

    // Header の表示確認
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByText("service name")).toBeVisible();

    // Footer の表示確認
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  // セッション保護のテスト（サービスが認証必須の場合）
  test("should redirect to login when accessing protected page without auth", async ({ page }) => {
    await page.goto("/service-name");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/);
  });
});
~~~

### 4.3. 初期テストシナリオ

commonセクションで実装すべきテストケース:

1. ✅ **基本表示テスト**: ページコンテナ、Header、Footerが正しく表示される
2. ✅ **セッション保護テスト** (認証必須サービスの場合): 未認証ユーザーが`/login`にリダイレクトされる
3. ✅ **レイアウトテスト**: Header/Footer/mainエリアの基本レイアウトが正しい

### 4.4. 後続セクションへの引き継ぎ

他のセクション(`design-flow`, `implementation-flow`等)は、このE2Eテストファイルに自身の機能に関するテストを**追記**していきます。

**例**: `design-flow`セクションが追記する場合

~~~typescript
// 同じファイル内に追記
test.describe("Design Flow Section", () => {
  test("should display design flow section", async ({ page }) => {
    await page.goto("/service-name");
    // design-flowセクションのテスト
  });
});
~~~

## 5. 実装順序

commonセクションの推奨実装順序:

~~~text
Phase 1: E2Eテストファイル作成
  └─ tests/e2e/screen/{service}.screen.spec.ts を新規作成

Phase 2: ページコンテナ実装
  └─ app/routes/{service}.tsx を新規作成
     (または _protected.{service}.tsx)

Phase 3: Header実装
  ├─ app/components/{service}/common/Header.tsx を作成
  └─ useSession統合、認証状態表示

Phase 4: Footer実装
  └─ app/components/{service}/common/Footer.tsx を作成

Phase 5: テスト確認
  ├─ E2Eテスト実行
  └─ ブラウザでの動作確認
~~~

## 6. チェックリスト

commonセクション完了前に、以下を確認してください:

- [ ] ページコンテナが実装されている (`app/routes/{service}.tsx`)
- [ ] E2Eテストファイルが作成されている (`tests/e2e/screen/{service}.screen.spec.ts`)
- [ ] Headerコンポーネントが実装されている
- [ ] Footerコンポーネントが実装されている
- [ ] `useSession`フックが適切に統合されている
- [ ] 基本表示のE2Eテストがパスしている
- [ ] (認証必須の場合) セッション保護テストがパスしている
- [ ] ブラウザでページが正しく表示される

## 7. 参考資料

- [セッション管理ガイド](./session-management-guide.md) - セッション機能の詳細
- [commonセクション責務決定ログ](../develop/service-name/common/2025-10-13-common-section-responsibility-for-page-container.md) - 設計判断の背景

---
