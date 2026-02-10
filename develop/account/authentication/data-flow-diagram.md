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

### パスワードリセットメール送信フロー

```mermaid
graph TD
    subgraph Browser["ブラウザ"]
        User((ユーザー)) -- "1. /forgot-password アクセス" --> ForgotRoute["Route (forgot-password.tsx)"]
        User -- "3. メール入力・送信" --> ForgotForm["ForgotPasswordForm"]
    end

    subgraph Server["サーバー"]
        direction TB

        subgraph Action["action (forgot-password.tsx)"]
            Action_Start("Start") --> GetEmail["メールアドレス取得"]
            GetEmail --> ValidateEmail["メール形式検証"]
            ValidateEmail -- "エラー" --> ReturnError["エラーレスポンス"]
            ValidateEmail -- "OK" --> FindUser["findUserByEmail.server<br/>(data-io)"]
            FindUser -- "存在しない" --> SilentSuccess["成功レスポンス<br/>（セキュリティのため）"]
            FindUser -- "存在する" --> GenerateToken["トークン生成<br/>(crypto.randomUUID)"]
            GenerateToken --> SaveToken["savePasswordResetToken.server<br/>(Workers KV, TTL: 1時間)"]
            SaveToken --> SendEmail["sendPasswordResetEmail.server<br/>(メール送信)"]
            SendEmail --> ActionEnd["成功メッセージ"]
        end

        ForgotRoute -- "2. loader実行" --> ForgotRoute
        ForgotForm -- "4. POST送信" --> Action_Start
    end

    subgraph Client["クライアント (React)"]
        direction TB

        ForgotRoute -- "props渡し" --> ForgotForm

        ForgotForm --> EmailField["FormField: email"]
        ForgotForm --> SubmitBtn["Button: 送信する"]
        ForgotForm --> HelpText["HelpText:<br/>・迷惑メールフォルダ確認<br/>・登録メールアドレス確認<br/>・数分後に再試行"]

        ActionEnd -- "メッセージ表示" --> SuccessMsg["「リセットメールを送信しました」"]
        ReturnError -- "エラー表示" --> ErrorMsg["ErrorMessage"]
    end

    style ForgotRoute fill:#fff4e1
    style Action fill:#f0f0f0
    style ForgotForm fill:#e8f5e9
    style HelpText fill:#e1f5ff
    style ReturnError fill:#ffcccc
```

### パスワードリセット実行フロー

```mermaid
graph TD
    subgraph Browser["ブラウザ"]
        User((ユーザー)) -- "1. /reset-password/:token アクセス" --> ResetRoute["Route (reset-password.$token.tsx)"]
        User -- "5. パスワード入力・送信" --> ResetForm["ResetPasswordForm"]
    end

    subgraph Server["サーバー"]
        direction TB

        subgraph Loader["loader (reset-password.$token.tsx)"]
            Loader_Start("Start") --> GetToken["URLからトークン取得"]
            GetToken --> VerifyToken["getPasswordResetToken.server<br/>(Workers KV)"]
            VerifyToken -- "存在しない/期限切れ" --> TokenInvalid["トークン無効エラー"]
            VerifyToken -- "有効" --> LoaderEnd("End: { tokenValid: true }")
        end

        subgraph Action["action (reset-password.$token.tsx)"]
            Action_Start("Start") --> GetFormData["パスワード取得"]
            GetFormData --> ValidatePwd["パスワード強度検証"]
            ValidatePwd -- "エラー" --> ReturnError["エラーレスポンス"]
            ValidatePwd -- "OK" --> VerifyTokenAgain["トークン再検証<br/>(Workers KV)"]
            VerifyTokenAgain -- "無効" --> ReturnTokenError["トークン無効エラー"]
            VerifyTokenAgain -- "有効" --> GetUserId["トークンからuserIdを取得"]
            GetUserId --> HashPwd["hashPassword<br/>(lib/auth)"]
            HashPwd --> UpdatePwd["updateUserPassword.server<br/>(data-io)"]
            UpdatePwd --> DeleteToken["deletePasswordResetToken.server<br/>(Workers KV)"]
            DeleteToken --> DeleteSessions["deleteAllUserSessions.server<br/>(data-io/common)"]
            DeleteSessions --> ActionEnd["リダイレクト: /login"]
        end

        ResetRoute -- "2. loader実行" --> Loader_Start
        LoaderEnd -- "3. フォーム表示" --> ResetRoute
        TokenInvalid -- "4. エラーページ表示" --> ResetRoute
        ResetForm -- "6. POST送信" --> Action_Start
    end

    subgraph Client["クライアント (React)"]
        direction TB

        ResetRoute -- "props渡し" --> ResetForm

        ResetForm --> NewPwdField["FormField: 新しいパスワード"]
        ResetForm --> ConfirmPwdField["FormField: パスワード確認"]
        ResetForm --> SubmitBtn["Button: リセットする"]

        ActionEnd -- "リダイレクト" --> LoginPage["/login へ遷移"]
        ReturnError -- "エラー表示" --> ErrorMsg["ErrorMessage"]
        ReturnTokenError -- "エラー表示" --> ErrorMsg
    end

    style ResetRoute fill:#fff4e1
    style Loader fill:#f0f0f0
    style Action fill:#f0f0f0
    style ResetForm fill:#e8f5e9
    style TokenInvalid fill:#ffcccc
    style ReturnError fill:#ffcccc
    style ReturnTokenError fill:#ffcccc
```

---

### OTPコード送信フロー

```mermaid
graph TD
    subgraph Browser["ブラウザ"]
        User((ユーザー)) -- "1. /login アクセス" --> LoginRoute["Route (login.tsx)"]
        User -- "3. メール入力・「次へ」クリック" --> OtpForm["OTP送信フォーム"]
    end

    subgraph Server["サーバー"]
        direction TB

        subgraph Action["action (login.tsx, intent: send-otp)"]
            Action_Start("Start") --> GetEmail["メールアドレス取得"]
            GetEmail --> ValidateEmail["メール形式バリデーション"]
            ValidateEmail -- "エラー" --> ReturnError["エラーレスポンス"]
            ValidateEmail -- "OK" --> CheckRate["レート制限チェック<br/>(checkOtpRateLimit.server)"]
            CheckRate -- "超過" --> ReturnRateError["レート制限エラー"]
            CheckRate -- "OK" --> GenerateOtp["OTP生成<br/>(generateAuthToken)"]
            GenerateOtp --> SaveOtp["KVに保存<br/>(saveOtpToken.server)<br/>JSON: { code, email, attempts: 0 }<br/>TTL: 10分"]
            SaveOtp --> SendEmail["メール送信<br/>(sendAuthEmail.server)<br/>Resend API"]
            SendEmail --> ActionEnd["リダイレクト:<br/>/auth/otp?email=xxx"]
        end

        OtpForm -- "4. POST送信 (intent: send-otp)" --> Action_Start
        LoginRoute -- "2. loader → フォーム表示" --> LoginRoute

        subgraph DataIO["副作用層"]
            CheckRate_Detail["checkOtpRateLimit.server<br/>(KVでカウント管理)"]
            SaveOtp_Detail["saveOtpToken.server<br/>(KVにJSON保存)"]
            SendEmail_Detail["sendAuthEmail.server<br/>(Resend API)"]
        end

        subgraph Lib["純粋ロジック層"]
            GenerateOtp_Detail["generateAuthToken<br/>(6桁OTP生成)"]
        end
    end

    ActionEnd -- "5. リダイレクト" --> Browser
    ReturnError -- "エラー表示" --> ErrorMsg["ErrorMessage"]
    ReturnRateError -- "エラー表示" --> ErrorMsg

    style LoginRoute fill:#fff4e1
    style Action fill:#f0f0f0
    style OtpForm fill:#e8f5e9
    style ReturnError fill:#ffcccc
    style ReturnRateError fill:#ffcccc
```

---

### OTP検証・ログインフロー

```mermaid
graph TD
    subgraph Browser["ブラウザ"]
        User((ユーザー)) -- "1. /auth/otp?email=xxx アクセス" --> OtpRoute["Route (auth.otp.tsx)"]
        User -- "5. 6桁コード入力・送信" --> OtpVerifyForm["OtpVerifyForm"]
    end

    subgraph Server["サーバー"]
        direction TB

        subgraph Loader["loader (auth.otp.tsx)"]
            Loader_Start("Start") --> GetEmail["URLパラメータからemail取得"]
            GetEmail -- "emailなし" --> RedirectLogin1["リダイレクト: /login"]
            GetEmail -- "emailあり" --> CheckKV["KVにOTPデータ存在確認"]
            CheckKV -- "存在しない" --> RedirectLogin2["リダイレクト: /login"]
            CheckKV -- "存在する" --> LoaderEnd("End: { email }")
        end

        subgraph Action["action (auth.otp.tsx)"]
            Action_Start("Start") --> GetFormData["FormDataから値取得<br/>(email, otpCode)"]
            GetFormData --> ValidateOtp["OTPコード形式バリデーション<br/>(validateOtpFormat)"]
            ValidateOtp -- "エラー" --> ReturnError["エラーレスポンス"]
            ValidateOtp -- "OK" --> VerifyOtp["KVからOTP取得・照合<br/>(verifyOtpToken.server)"]
            VerifyOtp -- "コード不一致" --> CheckAttempts{"attempts >= 3?"}
            CheckAttempts -- "No" --> IncrementAttempts["attempts+1 更新<br/>(KV)"]
            IncrementAttempts --> ReturnMismatch["コード不一致エラー"]
            CheckAttempts -- "Yes" --> DeleteOtp["KVからOTP削除"]
            DeleteOtp --> ReturnMaxAttempts["試行回数超過エラー"]
            VerifyOtp -- "期限切れ" --> ReturnExpired["期限切れエラー"]
            VerifyOtp -- "一致" --> DeleteOtpSuccess["KVからOTP削除"]
            DeleteOtpSuccess --> UpsertUser["ユーザーupsert<br/>(upsertUserByEmail.server)<br/>名寄せ: 既存ユーザー → 返却<br/>新規 → 作成"]
            UpsertUser --> CreateSession["セッション生成<br/>(createSessionData)"]
            CreateSession --> SaveSession["セッション保存<br/>(saveSession.server)"]
            SaveSession --> ActionEnd["Cookie設定 + リダイレクト: /account"]
        end

        OtpRoute -- "2. loader実行" --> Loader_Start
        LoaderEnd -- "3. フォーム表示" --> OtpRoute
        OtpVerifyForm -- "6. POST送信" --> Action_Start

        subgraph DataIO["副作用層"]
            VerifyOtp_Detail["verifyOtpToken.server<br/>(KVからOTP取得・照合)"]
            UpsertUser_Detail["upsertUserByEmail.server<br/>(D1 SELECT + INSERT)"]
            SaveSession_Detail["saveSession.server<br/>(KVに保存)"]
        end

        subgraph Lib["純粋ロジック層"]
            ValidateOtp_Detail["validateOtpFormat<br/>(6桁数字チェック)"]
            CreateSession_Detail["createSessionData<br/>(sessionId生成)"]
        end
    end

    subgraph Client["クライアント (React)"]
        direction TB

        OtpRoute -- "4. props渡し" --> OtpVerifyForm

        OtpVerifyForm --> HiddenEmail["hidden: email"]
        OtpVerifyForm --> OtpCodeField["FormField: 認証コード (6桁)"]
        OtpVerifyForm --> VerifyBtn["Button: 認証する"]
        OtpVerifyForm --> ResendLink["Link: コードを再送信"]
        OtpVerifyForm --> BackLink["Link: ログインに戻る"]

        VerifyBtn -- "7. ローディング状態" --> VerifyBtn
        ActionEnd -- "8. リダイレクト" --> Browser
        ReturnError -- "エラー表示" --> ErrorMsg["ErrorMessage"]
        ReturnMismatch -- "エラー表示" --> ErrorMsg
        ReturnMaxAttempts -- "エラー表示" --> ErrorMsg
        ReturnExpired -- "エラー表示" --> ErrorMsg
    end

    style OtpRoute fill:#fff4e1
    style Loader fill:#f0f0f0
    style Action fill:#f0f0f0
    style OtpVerifyForm fill:#e8f5e9
    style RedirectLogin1 fill:#ffcccc
    style RedirectLogin2 fill:#ffcccc
    style ReturnError fill:#ffcccc
    style ReturnMismatch fill:#ffcccc
    style ReturnMaxAttempts fill:#ffcccc
    style ReturnExpired fill:#ffcccc
```

---

## コンポーネント責務

| コンポーネント | 責務 | 依存先 |
| :--- | :--- | :--- |
| **register.tsx** | 会員登録ページのRoute定義、loader/action処理 | RegisterForm, validateRegistration, createUser.server, hashPassword |
| **login.tsx** | ログインページのRoute定義、loader/action処理 | LoginForm, validateLogin, findUserByEmail.server, verifyPassword |
| **logout.tsx** | ログアウト処理専用Route（actionのみ） | destroySession.server |
| **forgot-password.tsx** | パスワードリセットメール送信ページのRoute定義、loader/action処理 | ForgotPasswordForm, findUserByEmail.server, sendPasswordResetEmail.server |
| **reset-password.$token.tsx** | パスワードリセット実行ページのRoute定義、loader/action処理 | ResetPasswordForm, getPasswordResetToken.server, updateUserPassword.server, hashPassword |
| **auth.otp.tsx** | OTP検証ページのRoute定義、loader防衛/action処理 | OtpVerifyForm, validateOtpFormat, verifyOtpToken.server, upsertUserByEmail.server |
| **RegisterForm** | 会員登録フォームUI、バリデーションエラー表示 | FormField, Button, ErrorMessage (common) |
| **LoginForm** | ログインフォームUI、バリデーションエラー表示 | FormField, Button, ErrorMessage (common) |
| **ForgotPasswordForm** | パスワードリセットメール送信フォームUI、ヘルプテキスト表示 | FormField, Button, ErrorMessage (common) |
| **ResetPasswordForm** | パスワードリセット実行フォームUI、トークン検証 | FormField, Button, ErrorMessage (common) |
| **OtpVerifyForm** | OTPコード検証フォームUI、エラー表示 | FormField, Button, ErrorMessage, Link (common) |

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

    N[generateAuthToken] --> O[crypto.getRandomValues]
    O --> P[6桁数字OTP返却]

    Q[validateOtpFormat] --> R[正規表現チェック]
    R --> S["boolean返却 (^\\d{6}$)"]
```

### 純粋ロジック層の責務

| 関数 | 入力 | 処理 | 出力 |
| :--- | :--- | :--- | :--- |
| **validateRegistration** | email, password, passwordConfirm | メール形式、パスワード強度、一致確認 | ValidationError[] |
| **validateLogin** | email, password | メール形式、必須項目確認 | ValidationError[] |
| **hashPassword** | password: string | bcryptでハッシュ化 | hashedPassword: string |
| **verifyPassword** | password: string, hash: string | bcryptで比較 | boolean |
| **generateAuthToken** | - | crypto.getRandomValuesで6桁OTP生成 | string (6桁数字) |
| **validateOtpFormat** | code: string | 正規表現 `^\d{6}$` で形式チェック | boolean |

---

## 副作用層の関数依存関係

```mermaid
graph TD
    A[createUser.server] --> B[D1 Database]
    B --> C[INSERT INTO users]
    C --> D[User型返却]

    E[findUserByEmail.server] --> F[D1 Database]
    F --> G[SELECT FROM users WHERE email]
    G --> H[User型またはnull返却]

    I[checkEmailExists.server] --> J[D1 Database]
    J --> K[SELECT COUNT FROM users WHERE email]
    K --> L[boolean返却]

    M[getSession.server] --> N[Cloudflare Workers KV]
    N --> O[SessionDataまたはnull返却]

    P[saveSession.server] --> Q[Cloudflare Workers KV]
    Q --> R[SET with TTL]

    S[destroySession.server] --> T[Cloudflare Workers KV]
    T --> U[DELETE]

    V[saveOtpToken.server] --> W[Cloudflare Workers KV]
    W --> X["PUT JSON { code, email, attempts }<br/>TTL: 10分"]

    Y[verifyOtpToken.server] --> Z[Cloudflare Workers KV]
    Z --> AA["GET → JSON parse → コード照合"]

    BB[upsertUserByEmail.server] --> CC[D1 Database]
    CC --> DD["SELECT → 存在すれば返却 / なければ INSERT"]

    EE[checkOtpRateLimit.server] --> FF[Cloudflare Workers KV]
    FF --> GG["GET カウント → 上限チェック"]

    HH[sendAuthEmail.server] --> II[Resend API]
    II --> JJ["OTPコードメール送信"]
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
| **saveOtpToken.server** | KV書き込み | Workers KV | email, code | void |
| **verifyOtpToken.server** | KV読み取り・書き込み | Workers KV | email, code | OtpVerifyResult |
| **upsertUserByEmail.server** | DB読み取り・書き込み | D1 Database | email | User |
| **checkOtpRateLimit.server** | KV読み取り・書き込み | Workers KV | email | boolean |
| **sendAuthEmail.server** | 外部API呼び出し | Resend API | email, code | void |

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
    D --> E["expiresAt計算 (現在時刻 + 7日)"]
    E --> F[SessionData作成]
    F --> G[saveSession.server]
    G --> H["Workers KV保存 (TTL: 7日)"]
    H --> I["Cookie設定 (HttpOnly, Secure, SameSite=Lax)"]
```

---

## エラーハンドリングフロー

### 会員登録エラー

```mermaid
graph TD
    A[register action] --> B{バリデーション}
    B -- エラー --> C[ValidationError配列 返却]
    B -- OK --> D{メールアドレス重複?}
    D -- 重複 --> E[email_exists エラー返却]
    D -- OK --> F{ユーザー作成成功?}
    F -- 失敗 --> G[creation_failed エラー返却]
    F -- 成功 --> H{セッション生成成功?}
    H -- 失敗 --> I[session_creation_failed エラー返却]
    H -- 成功 --> J["リダイレクト: /account"]

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
    B -- エラー --> C[ValidationError配列 返却]
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
    B -- No --> D["デフォルト: /account へリダイレクト"]

    E["例: loginにredirect-urlあり"] --> F[ログイン成功後]
    F --> G["リダイレクト: /account/settings"]

    H["例: loginにパラメータなし"] --> I[ログイン成功後]
    I --> J["リダイレクト: /account"]
```

### Google OAuth後のリダイレクト

```mermaid
graph TD
    A["loginページ: Googleボタンクリック"] --> B["/auth/google?redirect-url={元URL}"]
    B --> C["oauth_redirect Cookieに元URLを保存"]
    C --> D["Google認証画面へリダイレクト"]
    D --> E["/auth/callback/google"]
    E --> F{"oauth_redirect Cookie存在?"}
    F -- Yes --> G["CookieのURLへリダイレクト + Cookie削除"]
    F -- No --> H["デフォルト: /account へリダイレクト"]
```

### 既にログイン済みの場合

```mermaid
graph TD
    A["register または login アクセス"] --> B[loader実行]
    B --> C{セッション有効?}
    C -- Yes --> D["リダイレクト: /account"]
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

**最終更新**: 2026-02-10
