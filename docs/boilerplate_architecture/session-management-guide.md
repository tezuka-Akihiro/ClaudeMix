# ボイラープレート基盤機能: セッション管理システム ガイド

## 1. 概要

このボイラープレートには、堅牢なセッション管理機能が標準で組み込まれています。これにより、開発者は認証やアクセス制御といった定型的な作業に時間を費やすことなく、アプリケーションのコアなビジネスロジック開発に集中できます。

## 2. 使い方

### 2.1. 環境設定

セッション機能を使用する前に、環境変数を設定する必要があります。

1. `.env` ファイルが存在することを確認してください(ボイラープレートに含まれています)
2. `SESSION_SECRET` が設定されていることを確認してください

~~~bash
# .env
SESSION_SECRET=dev-secret-change-in-production-min-32-chars-required
~~~

**重要**: 本番環境では、必ず32文字以上のランダムな文字列に変更してください。

### 2.2. 保護されたページを作成する

認証が必要なページを作成するのは非常に簡単です。`app/routes/_protected.` というプレフィックスを付けてファイルを作成するだけです。

~~~typescript
// 例: app/routes/_protected.dashboard.tsx

export default function Dashboard() {
  // このコンポーネントは、未認証のユーザーがアクセスすると
  // 自動的に /login ページにリダイレクトされます。
  return <div>Welcome to your protected dashboard!</div>;
}
~~~

**URL例**: 上記のファイルは `/dashboard` でアクセス可能です。

### 2.3. セッション情報にアクセスする

#### クライアントサイド: `useSession`フック

コンポーネント内で現在のユーザー情報や認証状態を取得するには、`useSession`フックを使用します。

~~~typescript
import { useSession } from "~/components/providers/SessionProvider";

export default function MyComponent() {
  const { user, status } = useSession();

  if (status === "authenticated") {
    return <div>Welcome, {user.name}!</div>;
  }

  return <div>Please log in.</div>;
}
~~~

#### サーバーサイド: `getUserFromSession`関数

loader や action 内でセッション情報を取得する場合は、`getUserFromSession`を使用します。

~~~typescript
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUserFromSession } from "~/lib/session/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromSession(request);

  if (!user) {
    // 未認証時の処理
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // 認証済み時の処理
  return json({ user, data: "some protected data" });
}
~~~

### 2.4. ログイン・ログアウト

- **ログイン**: `/login` にアクセスすると、Cyberpunk-terminalテーマのログインページが表示されます。
  - **デモ用認証情報**: `username: user`, `password: password`
  - ログイン成功後、トップページ (`/`) にリダイレクトされます
  - 保護されたページから `/login` にリダイレクトされた場合、`redirectTo` パラメータが自動的に付与されます(将来の拡張用)
- **ログアウト**: `/logout` にアクセスすると、セッションが破棄され、`/login` ページにリダイレクトされます。

**ログインフローの例**:

1. 未認証状態で `/dashboard` にアクセス → `/login?redirectTo=%2Fdashboard` にリダイレクト
2. ログインフォームで `user` / `password` を入力してログイン
3. `/` (トップページ) にリダイレクト
4. 手動で `/dashboard` にアクセスすると、認証済みなのでアクセス可能

## 3. アーキテクチャ

### 3.1. 主要な設計思想

- **ボイラープレートの基盤機能**: セッション管理は、特定のサービスに依存しない、アプリケーション全体の普遍的な機能として実装されています。
- **レイアウトベースの保護**: RemixのLayout Route (`_protected.tsx`) を活用し、配下のすべてのルートを効率的に保護します。
- **グローバルな状態管理**: React Context (`SessionProvider`) を通じて、セッション情報をアプリケーションのどこからでも安全に利用できます。

### 3.2. ファイル構成

セッション機能は、以下のファイル群によって構成されています。

| カテゴリ | ファイル数 | 備考 |
| :--- |:---:| :--- |
| セッション基盤 | 3ファイル | `session.server.ts`, `session.types.ts`, `server-flags.ts` |
| SessionProvider | 1ファイル | `SessionProvider.tsx` |
| 認証Route | 4ファイル | `_auth.login.tsx`, `_auth.logout.tsx`, `_protected.tsx`, `closed.tsx` |
| ルート統合 | 1ファイル | `root.jsx`（改修済み） |
| 環境変数 | 2ファイル | `.env`, `.env.example`（更新済み） |
| **合計** | **11ファイル** | 新規9ファイル + 改修2ファイル |

## 4. 概念機能: 夜間アクセス制御

このボイラープレートには、「夜間アクセス不可」という機能をシミュレートするための**概念フラグ**が含まれています。

- **ファイル**: `app/lib/constants/server-flags.ts`
- **フラグ**: `SERVER_FLAGS.AUTOSHUTDOWN_NIGHT`
- **UI**: `/closed` ページ (Cyberpunk-terminalテーマの夜間メンテナンス画面)

### 現状の実装

**重要**: このフラグは現在、**UI演出のみ**を目的としています。実際のアクセス制御やリダイレクト処理は実装されていません。

~~~typescript
// app/lib/constants/server-flags.ts
export const SERVER_FLAGS = {
  AUTOSHUTDOWN_NIGHT: false, // デフォルト: 無効
} as const;
~~~

### 将来の拡張パターン

このフラグを実際の夜間アクセス制御として機能させる場合、以下のような実装パターンが考えられます:

1. **`_protected.tsx` での時刻判定**:

~~~typescript
import { isNightTime } from "~/lib/constants/server-flags";

export async function loader({ request }: LoaderFunctionArgs) {
  // 夜間判定
  if (isNightTime()) {
    throw redirect("/closed");
  }

  // セッション判定
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect("/login");
  }
  return null;
}
~~~

2. **環境変数からのフラグ読み込み**:

~~~typescript
export const SERVER_FLAGS = {
  AUTOSHUTDOWN_NIGHT: process.env.AUTOSHUTDOWN_NIGHT === "true",
} as const;
~~~

3. **実際の時刻判定ロジック**:

~~~typescript
export function isNightTime(): boolean {
  if (!SERVER_FLAGS.AUTOSHUTDOWN_NIGHT) return false;

  const hour = new Date().getHours();
  return hour >= 22 || hour < 6; // 22:00-6:00を夜間とする
}
~~~

## 5. セキュリティとベストプラクティス

### 5.1. 現状の実装における注意事項

このボイラープレートのセッション機能は、**MVP(最小限の実装)**として設計されています。本番環境で使用する前に、以下の点を必ず改善してください:

⚠️ **本番環境前に必須の対応**:

1. **ハードコード認証の削除**
   - 現在: `user` / `password` で誰でもログイン可能
   - 対応: データベースと連携した実際の認証システムへ移行

2. **パスワードのハッシュ化**
   - 現在: パスワードが平文で比較される
   - 対応: `bcrypt` や `argon2` などでハッシュ化

3. **SESSION_SECRETの変更**
   - 現在: デフォルト値が `.env` に記載
   - 対応: 32文字以上のランダムな文字列に変更

4. **HTTPSの使用**
   - 現在: `secure: process.env.NODE_ENV === "production"` のみ
   - 対応: 本番環境では必ずHTTPSを使用

### 5.2. 推奨されるベストプラクティス

- セッションの有効期限を適切に設定する (現在: 7日間)
- CSRF対策を実装する (Remixの組み込み機能を活用)
- ログイン試行回数の制限を実装する
- 監査ログ (ログイン/ログアウトの記録) を実装する

## 6. 将来の拡張ポイント

このセッション管理基盤は、以下のような機能拡張の土台となります。

### 6.1. 認証・認可の強化

- ユーザーロール（`admin`/`user`）に基づいた、より詳細な権限制御
- パスワードのハッシュ化（`bcrypt`、`argon2`など）によるセキュリティ強化
- ユーザー情報のデータベース永続化（`Prisma`、`Drizzle`など）
- OAuth認証（Google, GitHub, Auth0など）の統合
- 多要素認証 (2FA/MFA) の実装

### 6.2. セッション管理の高度化

- セッションストアの変更 (Cookie → Redis/Database)
- セッションの自動延長 (アクティビティ検知)
- 複数デバイス対応とセッション管理UI
- "Remember Me" 機能の実装

### 6.3. 運用機能の追加

- `SERVER_FLAGS` の環境変数化と、実際の時刻判定ロジックの実装
- メンテナンスモードの実装
- IP制限・地域制限の実装
- ログイン通知機能 (メール/Slack等)

## 7. トラブルシューティング

### `SESSION_SECRET must be set` エラー

**原因**: `.env` ファイルに `SESSION_SECRET` が設定されていない。

**解決方法**:

1. `.env` ファイルを作成または確認
2. `SESSION_SECRET=your-secret-key-here-min-32-chars` を追加
3. 開発サーバーを再起動

### ログイン後もすぐにログアウトされる

**原因**: Cookie設定の問題、またはブラウザのプライベートモード。

**解決方法**:

1. ブラウザのCookie設定を確認
2. プライベートモードを解除
3. `session.server.ts` の `maxAge` 設定を確認

### 保護されたページにアクセスできない

**原因**: Layout Routeのファイル名が正しくない。

**解決方法**:

- ファイル名が `_protected.` で始まることを確認
- 例: `_protected.dashboard.tsx` → `/dashboard` でアクセス可能
