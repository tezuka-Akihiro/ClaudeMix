# data-flow-diagram.md - profile Section

## 目的

`file-list.md`を基に、`profile`セクションのコンポーネント間の依存関係とデータフローをMermaid図として可視化する。

---

## データフロー図

### メールアドレス変更フロー

```mermaid
graph TD
    User((ユーザー)) --> ProfileDisplay["ProfileDisplay"]
    ProfileDisplay -- "変更ボタンクリック" --> EmailModal["EmailChangeForm<br/>(モーダル)"]
    EmailModal -- "フォーム送信" --> Action["account.settings action"]

    Action --> Validate["validateEmailChange<br/>(lib)"]
    Validate --> FindUser["findUserByEmail.server<br/>(data-io/auth)"]
    FindUser --> VerifyPwd["verifyPassword<br/>(lib/auth)"]
    VerifyPwd --> CheckEmail["checkEmailExists.server<br/>(data-io/auth)"]
    CheckEmail --> UpdateEmail["updateUserEmail.server<br/>(data-io)"]
    UpdateEmail --> Success["成功メッセージ"]

    style EmailModal fill:#fff4e1
    style Action fill:#f0f0f0
    style Success fill:#e8f5e9
```

### パスワード変更フロー

```mermaid
graph TD
    User((ユーザー)) --> ProfileDisplay["ProfileDisplay"]
    ProfileDisplay -- "変更ボタンクリック" --> PasswordModal["PasswordChangeForm<br/>(モーダル)"]
    PasswordModal -- "フォーム送信" --> Action["account.settings action"]

    Action --> Validate["validatePasswordChange<br/>(lib)"]
    Validate --> FindUser["findUserByEmail.server<br/>(data-io/auth)"]
    FindUser --> VerifyPwd["verifyPassword<br/>(lib/auth)"]
    VerifyPwd --> HashPwd["hashPassword<br/>(lib/auth)"]
    HashPwd --> UpdatePwd["updateUserPassword.server<br/>(data-io)"]
    UpdatePwd --> DeleteSessions["deleteAllUserSessions.server<br/>(data-io)"]
    DeleteSessions --> CreateSession["createSessionData<br/>(lib/common)"]
    CreateSession --> SaveSession["saveSession.server<br/>(data-io/common)"]
    SaveSession --> Success["成功メッセージ + セッション再生成"]

    style PasswordModal fill:#fff4e1
    style Action fill:#f0f0f0
    style Success fill:#e8f5e9
```

### アカウント削除フロー

```mermaid
graph TD
    User((ユーザー)) --> ProfileDisplay["ProfileDisplay"]
    ProfileDisplay -- "削除ボタンクリック" --> DeleteModal["Modal (common)<br/>(アカウント削除確認)"]
    DeleteModal -- "モーダル表示" --> CheckSub["サブスクリプション状態確認<br/>(getSubscriptionByUserId.server)"]

    CheckSub -- "アクティブなサブスクリプションあり" --> ShowWarning["強力な警告表示<br/>（残り期間、返金なし）"]
    CheckSub -- "サブスクリプションなし" --> DeleteModal
    ShowWarning -- "期間放棄を確認" --> DeleteModal

    DeleteModal -- "削除確認" --> Action["account.settings action"]

    Action --> Validate["validateAccountDeletion<br/>(lib)"]
    Validate --> FindUser["findUserByEmail.server<br/>(data-io/auth)"]
    FindUser --> VerifyPwd["verifyPassword<br/>(lib/auth)"]
    VerifyPwd --> CheckSubAgain["サブスクリプション存在確認"]
    CheckSubAgain -- "あり" --> CancelStripe["cancelStripeSubscription.server<br/>(data-io/subscription)"]
    CancelStripe --> DeleteSubRecord["サブスクリプションレコード削除<br/>(D1 Database)"]
    CheckSubAgain -- "なし" --> DeleteSessions["deleteAllUserSessions.server<br/>(data-io/common)"]
    DeleteSubRecord --> DeleteSessions
    DeleteSessions --> DeleteUser["deleteUser.server<br/>(data-io)"]
    DeleteUser --> Redirect["/login へリダイレクト"]

    style DeleteModal fill:#ffcccc
    style ShowWarning fill:#ff9999
    style Action fill:#f0f0f0
    style Redirect fill:#ffcccc
```

---

## コンポーネント責務

| コンポーネント | 責務 | 依存先 |
| :--- | :--- | :--- |
| **account.settings.tsx** | プロフィール設定ページのRoute定義、action処理 | ProfileDisplay, validateEmailChange, updateUserEmail.server |
| **ProfileDisplay** | プロフィール情報表示、変更ボタン配置、アカウント削除UI（共通Modalを使用） | EmailChangeForm, PasswordChangeForm, Modal (common), Button (common), ErrorMessage (common) |
| **EmailChangeForm** | メールアドレス変更フォームUI（モーダル） | FormField, Button, ErrorMessage (common) |
| **PasswordChangeForm** | パスワード変更フォームUI（モーダル） | FormField, Button, ErrorMessage (common) |

---

## 純粋ロジック層の関数依存関係

```mermaid
graph LR
    A[validateEmailChange] --> B[メール形式チェック]
    A --> C[現在のメールと同じでないかチェック]

    D[validatePasswordChange] --> E[パスワード強度チェック]
    D --> F[パスワード一致チェック]
    D --> G[現在のパスワードと同じでないかチェック]

    H[validateAccountDeletion] --> I[パスワード必須チェック]
    H --> J[削除確認チェック]
```

---

## 副作用層の関数依存関係

```mermaid
graph TD
    A[updateUserEmail.server] --> B[D1 Database]
    B --> C[UPDATE users SET email, updated_at]

    D[updateUserPassword.server] --> E[D1 Database]
    E --> F[UPDATE users SET password, updated_at]

    G[deleteUser.server] --> H[D1 Database]
    H --> I[DELETE FROM users WHERE id]

    J[deleteAllUserSessions.server] --> K[Cloudflare Workers KV]
    K --> L[DELETE session:{userId}*]
```

---

## セキュリティフロー

### パスワード変更時のセッション管理

```mermaid
graph LR
    A[パスワード変更成功] --> B[deleteAllUserSessions.server]
    B --> C[すべてのセッション削除]
    C --> D[createSessionData]
    D --> E[新しいセッション生成]
    E --> F[saveSession.server]
    F --> G[現在のデバイスで再ログイン]
```

### アカウント削除時の処理

```mermaid
graph LR
    A[アカウント削除確認] --> B[deleteAllUserSessions.server]
    B --> C[すべてのセッション削除]
    C --> D[deleteUser.server]
    D --> E[ユーザーデータ削除]
    E --> F[/login へリダイレクト]
```

---

**最終更新**: 2025-12-23
