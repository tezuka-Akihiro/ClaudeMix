# 認証基盤のアーキテクチャ再定義 (Remix Auth 統合)

## 1. 背景と目的

認証・認可はシステムのセキュリティにおいて最も重要な要素の一つであり、OAuth等の複雑なプロトコルを自前で実装することは、メンテナンスコストの増大と脆弱性のリスクを伴います。
本ドキュメントでは、プロジェクトの「3大層分離アーキテクチャ」と「Workers KV/D1 ハイブリッド構成」を維持しつつ、信頼性の高い `Remix Auth` ライブラリを導入するための再定義案を提示します。

## 2. アーキテクチャ構成案

`Remix Auth` を「副作用層 (Data-IO)」に配置し、「純粋ロジック層 (Lib)」を汚染しないように分離します。

### 2.1 層別の責務分担

| 層 | コンポーネント | 役割・責務 |
| :--- | :--- | :--- |
| **UI層 (Routes)** | `routes/auth.*.tsx` | `authenticator.authenticate()` を呼び出し、認証フローを開始・完了させる |
| **副作用層 (Data-IO)** | `authenticator.server.ts` | `Authenticator` インスタンスの管理、Strategy の登録、環境変数の注入 |
| **副作用層 (Data-IO)** | `session.server.ts` | `createWorkersKVSessionStorage` を用いた KV ベースのセッション管理 |
| **副作用層 (Data-IO)** | `strategies/*.ts` | 各認証プロバイダー (Google, Apple, Form) の設定と検証フローの実行 |
| **純粋ロジック層 (Lib)** | `authService.ts` | プロバイダーから返されたプロフィールの検証 (Emailバリデーション等) とドメイン変換 |
| **副作用層 (Data-IO)** | `userRepository.server.ts` | D1 へのユーザー検索・作成 (副作用を伴う DB 操作) |

## 3. ディレクトリ構造

```text
app/
├── data-io/
│   └── account/
│       ├── common/
│       │   ├── authenticator.server.ts  # Authenticator インスタンスの集中管理
│       │   └── session.server.ts        # KVベースの SessionStorage 実装
│       └── authentication/
│           ├── strategies/              # Remix Auth の各 Strategy 設定
│           │   ├── google.server.ts
│           │   ├── apple.server.ts
│           │   └── form.server.ts
│           └── userRepository.server.ts  # D1 操作 (getUser, createUser)
├── lib/
│   └── account/
│       └── authentication/
│           ├── authLogic.ts             # 【純粋ロジック】プロフィールデータの検証・加工
│           ├── validateEmail.ts         # 【既存】メールアドレス検証
│           └── ...
└── routes/
    ├── auth.google.tsx                  # 認証開始
    └── auth.callback.google.tsx         # コールバック処理
```

## 4. 接合点 (Interface) とデータフロー

ライブラリ (Remix Auth) と純粋ロジック層 (Lib) の接合点は、Strategy の `verify` コールバック内に設けます。

### データフロー詳細

1.  **UI層 (Route)**: `authenticator.authenticate('google', request)` を呼び出す。
2.  **副作用層 (Strategy)**: プロバイダーから OAuth プロフィールを取得。
3.  **純粋ロジック層 (Lib)**: `authLogic.validateProfile(profile)` を呼び出し、ビジネスルール (email 検証、spec.yaml 照合) に基づき検証を行う。
    - **重要**: ここでは DB 通信を行わず、データが「正しいか」のみを判定し、正規化されたデータを返す。
4.  **副作用層 (Data-IO)**: 検証済みデータを用い、`userRepository` を介して D1 からユーザーを取得、または新規作成する。
5.  **副作用層 (Session)**: 最終的なユーザー情報を Workers KV に保存し、Cookie を発行。

### インターフェース例 (疎結合の徹底)

ライブラリの型（`GoogleProfile` 等）を `lib` 層に持ち込まないよう、`data-io` 層でデータの詰め替え（Mapping）を行います。

```typescript
// app/data-io/account/authentication/strategies/google.server.ts (副作用層)
import { googleAuthMapper } from '../mappers/googleMapper.server'; // data-io内での変換
import { authLogic } from '~/lib/account/authentication/authLogic'; // 純粋ロジック

export const googleStrategy = new GoogleStrategy(
  { clientId, clientSecret, callbackURL },
  async ({ profile }) => {
    // 1. ライブラリ依存の型からドメインモデルへ変換 (Data-IO層の責務)
    const domainProfile = googleAuthMapper.toDomainProfile(profile);

    // 2. 純粋ロジック層でのビジネスルール検証 (接合点)
    // lib層は domainProfile のインターフェースのみを知っており、Remix Auth には依存しない
    const validatedData = authLogic.processProfile(domainProfile);

    // 3. 副作用層での DB 操作
    const user = await userRepository.findOrCreateUser(validatedData);

    return user;
  }
);
```

## 5. 汚染防止のための絶対ルール

「アーキテクチャの死守」を確実にするため、以下の制限を課します。

1.  **Lib層の純粋性保持**: `app/lib/` 配下のファイルは、`remix-auth` および関連する Strategy パッケージを **絶対に変更・インポートしてはならない**。
2.  **データ変換の強制**: プロバイダーから提供される raw データは、必ず `data-io` 層で定義されたマッパーを通り、プロジェクト独自のドメイン型に変換してから `lib` 層に渡す。
3.  **例外処理の分離**: ライブラリに起因する例外（トークン失効、通信エラー等）は `data-io` または `routes` でキャッチし、`lib` 層には「ビジネスルール上のエラー（規約違反等）」のみを扱わせる。

## 6. GUIDING_PRINCIPLES.md への影響

- **矛盾点**: 現在の原則ではセッション管理が「手動」として記述されていますが、これを「Remix Auth + WorkersKVSessionStorage」による統制に更新します。
- **補強点**: 「ライブラリを利用しつつ、その検証ロジックは必ず Lib 層で行う」という原則を追加し、将来的なライブラリの入れ替えやセキュリティ要件の変更に強い設計とします。
- **ストレージ戦略**: KV (Session) / D1 (Users) のハイブリッド構成はそのまま維持され、Remix Auth の SessionStorage インターフェースによって抽象化されます。
