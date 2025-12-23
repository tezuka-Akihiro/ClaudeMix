# data-flow-diagram.md - authentication Section

## 目的

`file-list.md`を基に、`authentication`セクションのコンポーネント間の依存関係とデータフローをMermaid図として可視化する。

---

## データフロー図

### 会員登録フロー

```mermaid
graph TD
    subgraph Browser["ブラウザ"]
        User((ユーザー)) -- "1. /register アクセス" --> RegisterRoute["Route (register.tsx)"]
        User -- "7. フォーム入力・送信" --> RegisterForm["RegisterForm"]
    end

    subgraph Server["サーバー"]
        direction TB

        subgraph Loader["loader (register.tsx)"]
            Loader_Start("Start") --> CheckSession["既存セッション確認<br/>(getSession.server)"]
            CheckSession -- "認証済み" --> RedirectAccount["リダイレクト: /account"]
            CheckSession -- "未認証" --> LoaderEnd("End: null (フォーム表示)")
        end

        subgraph Action["action (register.tsx)"]
            Action_Start("Start") --> GetFormData["FormDataから値取得"]
            GetFormData --> Validate["バリデーション<br/>(validateRegistration)"]
            Validate -- "エラー" --> ReturnError["エラーレスポンス"]
            Validate -- "OK" --> CheckEmail["重複チェック<br/>(checkEmailExists.server)"]
            CheckEmail -- "存在する" --> ReturnDuplicate["重複エラー"]
            CheckEmail -- "存在しない" --> HashPwd["パスワードハッシュ化<br/>(hashPassword)"]
            HashPwd --> CreateUser["ユーザー作成<br/>(createUser.server)"]
            CreateUser --> CreateSession["セッション生成<br/>(createSessionData)"]
            CreateSession --> SaveSession["セッション保存<br/>(saveSession.server)"]
            SaveSession --> ActionEnd["Cookie設定 + リダイレクト: /account"]
        end

        RegisterRoute -- "2. loader実行" --> Loader_Start
        LoaderEnd -- "3. フォーム表示" --> RegisterRoute
        RegisterForm -- "8. POST送信" --> Action_Start

        subgraph DataIO["副作用層"]
            CheckSession_Detail["getSession.server<br/>(KVからセッション取得)"]
            CheckEmail_Detail["checkEmailExists.server<br/>(D1でCOUNT)"]
            CreateUser_Detail["createUser.server<br/>(D1にINSERT)"]
            SaveSession_Detail["saveSession.server<br/>(KVに保存)"]
        end

        subgraph Lib["純粋ロジック層"]
            Validate_Detail["validateRegistration<br/>(メール・パスワード検証)"]
            HashPwd_Detail["hashPassword<br/>(bcrypt.hash)"]
            CreateSession_Detail["createSessionData<br/>(sessionId生成)"]
        end
    end

    subgraph Client["クライアント (React)"]
        direction TB

        RegisterRoute -- "4. props渡し" --> RegisterForm

        RegisterForm --> EmailField["FormField: email"]
        RegisterForm --> PasswordField["FormField: password"]
        RegisterForm --> PasswordConfirmField["FormField: passwordConfirm"]
        RegisterForm --> SubmitBtn["Button: 登録する"]
        RegisterForm --> LoginLink["Link: ログインはこちら"]

        SubmitBtn -- "9. ローディング状態" --> SubmitBtn
        ActionEnd -- "10. リダイレクト" --> Browser
        ReturnError -- "11. エラー表示" --> ErrorMsg["ErrorMessage"]
        ReturnDuplicate -- "11. エラー表示" --> ErrorMsg
    end

    style RegisterRoute fill:#fff4e1
    style Loader fill:#f0f0f0
    style Action fill:#f0f0f0
    style RegisterForm fill:#e8f5e9
    style RedirectAccount fill:#ffcccc
    style ReturnError fill:#ffcccc
    style ReturnDuplicate fill:#ffcccc
```

---

### ログインフロー

```mermaid
graph TD
    subgraph Browser["ブラウザ"]
        User((ユーザー)) -- "1. /login アクセス" --> LoginRoute["Route (login.tsx)"]
        User -- "7. フォーム入力・送信" --> LoginForm["LoginForm"]
    end

    subgraph Server["サーバー"]
        direction TB

        subgraph Loader["loader (login.tsx)"]
            Loader_Start("Start") --> CheckSession["既存セッション確認<br/>(getSession.server)"]
            CheckSession -- "認証済み" --> RedirectAccount["リダイレクト: /account"]
            CheckSession -- "未認証" --> GetRedirectUrl["redirect-urlパラメータ取得"]
            GetRedirectUrl --> LoaderEnd("End: { redirectUrl }")
        end

        subgraph Action["action (login.tsx)"]
            Action_Start("Start") --> GetFormData["FormDataから値取得"]
            GetFormData --> Validate["バリデーション<br/>(validateLogin)"]
            Validate -- "エラー" --> ReturnError["エラーレスポンス"]
            Validate -- "OK" --> FindUser["ユーザー検索<br/>(findUserByEmail.server)"]
            FindUser -- "存在しない" --> ReturnAuthError["認証失敗エラー"]
            FindUser -- "存在する" --> VerifyPwd["パスワード検証<br/>(verifyPassword)"]
            VerifyPwd -- "不一致" --> ReturnAuthError
            VerifyPwd -- "一致" --> CreateSession["セッション生成<br/>(createSessionData)"]
            CreateSession --> SaveSession["セッション保存<br/>(saveSession.server)"]
            SaveSession --> GetRedirectParam["redirect-urlパラメータ取得"]
            GetRedirectParam --> ActionEnd["Cookie設定 + リダイレクト"]
        end

        LoginRoute -- "2. loader実行" --> Loader_Start
        LoaderEnd -- "3. フォーム表示" --> LoginRoute
        LoginForm -- "8. POST送信" --> Action_Start

        subgraph DataIO["副作用層"]
            CheckSession_Detail["getSession.server<br/>(KVからセッション取得)"]
            FindUser_Detail["findUserByEmail.server<br/>(D1でSELECT)"]
            SaveSession_Detail["saveSession.server<br/>(KVに保存)"]
        end

        subgraph Lib["純粋ロジック層"]
            Validate_Detail["validateLogin<br/>(メール・パスワード検証)"]
            VerifyPwd_Detail["verifyPassword<br/>(bcrypt.compare)"]
            CreateSession_Detail["createSessionData<br/>(sessionId生成)"]
        end
    end

    subgraph Client["クライアント (React)"]
        direction TB

        LoginRoute -- "4. props渡し" --> LoginForm

        LoginForm --> EmailField["FormField: email"]
        LoginForm --> PasswordField["FormField: password"]
        LoginForm --> SubmitBtn["Button: ログイン"]
        LoginForm --> RegisterLink["Link: 会員登録はこちら"]

        SubmitBtn -- "9. ローディング状態" --> SubmitBtn
        ActionEnd -- "10. リダイレクト<br/>(redirect-url優先)" --> Browser
        ReturnError -- "11. エラー表示" --> ErrorMsg["ErrorMessage"]
        ReturnAuthError -- "11. エラー表示" --> ErrorMsg
    end

    style LoginRoute fill:#fff4e1
    style Loader fill:#f0f0f0
    style Action fill:#f0f0f0
    style LoginForm fill:#e8f5e9
    style RedirectAccount fill:#ffcccc
    style ReturnError fill:#ffcccc
    style ReturnAuthError fill:#ffcccc
```

---

### ログアウトフロー

```mermaid
graph TD
    subgraph Browser["ブラウザ"]
        User((ユーザー)) -- "1. /logout リクエスト" --> LogoutRoute["Route (logout.tsx)"]
    end

    subgraph Server["サーバー"]
        direction TB

        subgraph Action["action (logout.tsx)"]
            Action_Start("Start") --> GetSessionId["セッションID取得<br/>(Cookie)"]
            GetSessionId --> DestroySession["セッション削除<br/>(destroySession.server)"]
            DestroySession --> InvalidateCookie["Cookie無効化<br/>(Max-Age=0)"]
            InvalidateCookie --> ActionEnd["リダイレクト: /login"]
        end

        LogoutRoute -- "2. action実行" --> Action_Start

        subgraph DataIO["副作用層"]
            DestroySession_Detail["destroySession.server<br/>(KVから削除)"]
        end
    end

    ActionEnd -- "3. リダイレクト" --> Browser

    style LogoutRoute fill:#fff4e1
    style Action fill:#f0f0f0
```

---

## コンポーネント責務

| コンポーネント | 責務 | 依存先 |
| :--- | :--- | :--- |
| **register.tsx** | 会員登録ページのRoute定義、loader/action処理 | RegisterForm, validateRegistration, createUser.server, hashPassword |
| **login.tsx** | ログインページのRoute定義、loader/action処理 | LoginForm, validateLogin, findUserByEmail.server, verifyPassword |
| **logout.tsx** | ログアウト処理専用Route（actionのみ） | destroySession.server |
| **RegisterForm** | 会員登録フォームUI、バリデーションエラー表示 | FormField, Button, ErrorMessage (common) |
| **LoginForm** | ログインフォームUI、バリデーションエラー表示 | FormField, Button, ErrorMessage (common) |

---

## 純粋ロジック層の関数依存関係

```mermaid
graph LR
    A[validateRegistration] --> B[メール形式チェック]
    A --> C[パスワード強度チェック]
    A --> D[パスワード一致チェック]

    E[validateLogin] --> F[メール形式チェック]
    E --> G[必須項目チェック]

    H[hashPassword] --> I[bcrypt.hash]
    I --> J[salt rounds: 10]

    K[verifyPassword] --> L[bcrypt.compare]
    L --> M[boolean返却]
```

### 純粋ロジック層の責務

| 関数 | 入力 | 処理 | 出力 |
| :--- | :--- | :--- | :--- |
| **validateRegistration** | email, password, passwordConfirm | メール形式、パスワード強度、一致確認 | ValidationError[] |
| **validateLogin** | email, password | メール形式、必須項目確認 | ValidationError[] |
| **hashPassword** | password: string | bcryptでハッシュ化 | hashedPassword: string |
| **verifyPassword** | password: string, hash: string | bcryptで比較 | boolean |

---

## 副作用層の関数依存関係

```mermaid
graph TD
    A[createUser.server] --> B[D1 Database]
    B --> C[INSERT INTO users]
    C --> D[User型返却]

    E[findUserByEmail.server] --> F[D1 Database]
    F --> G[SELECT FROM users WHERE email]
    G --> H[User型 | null返却]

    I[checkEmailExists.server] --> J[D1 Database]
    J --> K[SELECT COUNT FROM users WHERE email]
    K --> L[boolean返却]

    M[getSession.server] --> N[Cloudflare Workers KV]
    N --> O[SessionData | null返却]

    P[saveSession.server] --> Q[Cloudflare Workers KV]
    Q --> R[SET with TTL]

    S[destroySession.server] --> T[Cloudflare Workers KV]
    T --> U[DELETE]
```

### 副作用層の責務

| 関数 | 副作用の種類 | 依存リソース | 入力 | 出力 |
| :--- | :--- | :--- | :--- | :--- |
| **createUser.server** | DB書き込み | D1 Database | email, hashedPassword | User |
| **findUserByEmail.server** | DB読み取り | D1 Database | email | User \| null |
| **checkEmailExists.server** | DB読み取り | D1 Database | email | boolean |
| **getSession.server** | KV読み取り、Cookie読み取り | Workers KV, HTTP Request | - | SessionData \| null |
| **saveSession.server** | KV書き込み、Cookie書き込み | Workers KV, HTTP Response | SessionData | void |
| **destroySession.server** | KV削除、Cookie無効化 | Workers KV, HTTP Response | sessionId | void |

---

## セキュリティフロー

### パスワードハッシュ化フロー

```mermaid
graph LR
    A[平文パスワード] --> B[hashPassword]
    B --> C[bcrypt.hash]
    C --> D[salt rounds: 10]
    D --> E[ハッシュ化パスワード]
    E --> F[DB保存]
```

### パスワード検証フロー

```mermaid
graph LR
    A[平文パスワード] --> B[verifyPassword]
    C[DBから取得したハッシュ] --> B
    B --> D[bcrypt.compare]
    D -- "一致" --> E[true]
    D -- "不一致" --> F[false]
```

### セッション生成フロー

```mermaid
graph LR
    A[ユーザー認証成功] --> B[createSessionData]
    B --> C[crypto.randomUUID]
    C --> D[sessionId生成]
    D --> E[expiresAt計算<br/>(現在時刻 + 7日)]
    E --> F[SessionData作成]
    F --> G[saveSession.server]
    G --> H[Workers KV保存<br/>(TTL: 7日)]
    H --> I[Cookie設定<br/>(HttpOnly, Secure, SameSite=Lax)]
```

---

## エラーハンドリングフロー

### 会員登録エラー

```mermaid
graph TD
    A[register action] --> B{バリデーション}
    B -- エラー --> C[ValidationError[] 返却]
    B -- OK --> D{メールアドレス重複?}
    D -- 重複 --> E[email_exists エラー返却]
    D -- OK --> F{ユーザー作成成功?}
    F -- 失敗 --> G[creation_failed エラー返却]
    F -- 成功 --> H{セッション生成成功?}
    H -- 失敗 --> I[session_creation_failed エラー返却]
    H -- 成功 --> J[リダイレクト: /account]

    style C fill:#ffcccc
    style E fill:#ffcccc
    style G fill:#ffcccc
    style I fill:#ffcccc
    style J fill:#e8f5e9
```

### ログインエラー

```mermaid
graph TD
    A[login action] --> B{バリデーション}
    B -- エラー --> C[ValidationError[] 返却]
    B -- OK --> D{ユーザー存在?}
    D -- 存在しない --> E[invalid_credentials エラー]
    D -- 存在する --> F{パスワード一致?}
    F -- 不一致 --> E
    F -- 一致 --> G{セッション生成成功?}
    G -- 失敗 --> H[session_creation_failed エラー返却]
    G -- 成功 --> I[リダイレクト]

    style C fill:#ffcccc
    style E fill:#ffcccc
    style H fill:#ffcccc
    style I fill:#e8f5e9
```

---

## リダイレクト動作フロー

### ログイン後のリダイレクト

```mermaid
graph TD
    A[login action成功] --> B{redirect-urlパラメータ存在?}
    B -- Yes --> C[パラメータのURLへリダイレクト]
    B -- No --> D[デフォルト: /account へリダイレクト]

    E[例: /login?redirect-url=/account/settings] --> F[ログイン成功後]
    F --> G[リダイレクト: /account/settings]

    H[例: /login (パラメータなし)] --> I[ログイン成功後]
    I --> J[リダイレクト: /account]
```

### 既にログイン済みの場合

```mermaid
graph TD
    A[/register または /login アクセス] --> B[loader実行]
    B --> C{セッション有効?}
    C -- Yes --> D[リダイレクト: /account]
    C -- No --> E[フォーム表示]
```

---

## データベーススキーマ図

```mermaid
erDiagram
    USERS {
        TEXT id PK "UUID"
        TEXT email UK "メールアドレス"
        TEXT password "ハッシュ化パスワード"
        TEXT subscription_status "active, inactive, trial"
        TEXT created_at "ISO 8601"
        TEXT updated_at "ISO 8601"
    }

    SESSIONS {
        TEXT session_id PK "Workers KV Key"
        TEXT user_id FK "ユーザーID"
        TEXT expires_at "ISO 8601"
        TEXT created_at "ISO 8601"
    }

    USERS ||--o{ SESSIONS : "has"
```

> **注**: SESSIONSはCloudflare Workers KVに保存されます（D1ではありません）

---

**最終更新**: 2025-12-23
