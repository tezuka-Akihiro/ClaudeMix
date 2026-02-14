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

### アカウント削除フロー（論理削除版）

```mermaid
graph TD
    User((ユーザー)) --> ProfileDisplay["ProfileDisplay"]
    ProfileDisplay -- "削除ボタンクリック" --> DeleteModal["Modal (common)"]
    DeleteModal -- "モーダル表示" --> CheckSub["サブスクリプション状態確認"]

    CheckSub -- "アクティブあり" --> ShowWarning["強力な警告表示"]
    CheckSub -- "なし" --> DeleteModal
    ShowWarning -- "期間放棄を確認" --> DeleteModal

    DeleteModal -- "削除確認" --> Action["account.settings action"]

    Action --> Validate["validateAccountDeletion (lib)"]
    Validate --> FindUser["findUserByEmail.server"]
    FindUser --> VerifyPwd["verifyPassword (lib/auth)"]
    VerifyPwd --> CheckSubAgain["サブスクリプション存在確認"]
    CheckSubAgain -- "あり" --> StopStripe["Stripeサブスクリプション停止<br/>(Customer保持)"]
    CheckSubAgain -- "なし" --> SoftDelete
    StopStripe --> SoftDelete["softDeleteUser.server<br/>(deleted_atに現在時刻を記録)"]
    SoftDelete --> DeleteSessions["deleteAllUserSessions.server"]
    DeleteSessions --> Redirect["/login へリダイレクト<br/>+ 冬眠開始メッセージ"]

    style DeleteModal fill:#ffcccc
    style SoftDelete fill:#fff4e1
    style Redirect fill:#ffcccc
```

### 物理抹消バッチフロー（新規追加）

```mermaid
graph TD
    Cron["Scheduled Worker<br/>(Cron Trigger: 1日1回)"] --> Query["D1: deleted_at < 30日前<br/>のユーザー取得"]
    Query --> Loop["各ユーザーに対して"]
    Loop --> StripeDelete["Stripe Customer削除"]
    StripeDelete --> SubDelete["D1: subscriptions DELETE"]
    SubDelete --> UserDelete["D1: users 物理DELETE"]
    UserDelete --> Log["実行ログ出力"]

    StripeDelete -- "失敗" --> ErrorLog["エラーログ + アラート<br/>(ユーザー削除はスキップ)"]

    style Cron fill:#e8f5e9
    style ErrorLog fill:#ff6666
```

### アカウント復旧フロー（新規追加）

```mermaid
graph TD
    User((ユーザー)) --> Login["Login Page"]
    Login -- "メール/PW入力" --> Action["login action"]
    Action --> FindUser["findUserByEmail.server"]
    FindUser -- "deleted_at is NOT NULL" --> ShowRestore["復旧ボタン表示"]
    ShowRestore -- "復旧ボタンクリック" --> RestoreAction["account.settings action<br/>(intent=restore-account)"]
    RestoreAction --> Restore["restoreUser.server<br/>(deleted_at = NULL)"]
    Restore --> CreateSession["セッション生成"]
    CreateSession --> Redirect["/account へリダイレクト"]

    style ShowRestore fill:#fff4e1
    style Restore fill:#e8f5e9
```

**重要な注意事項**:

- **Stripe停止の挙動**: 退会実行時は `Customer` を削除せず、サブスクリプションのみを停止状態にする。これにより、冬眠期間中の遅延Webhookを既存 `user_id` で受信可能。
- **べき等性の確保**: 物理削除後の遅延Webhookに対しても、システムは200を返し、ログに記録する。
- **冬眠期間**: 30日間は同一メールアドレスでの新規登録を制限（DB Unique制約）。
- **復旧**: 冬眠中の復旧ではサブスクリプションは自動再開されない。

---

## コンポーネント責務

| コンポーネント | 責務 | 依存先 |
| :--- | :--- | :--- |
| **account.settings.tsx** | プロフィール設定ページのRoute定義、action処理、論理削除（softDeleteUser呼び出し） | ProfileDisplay, validateEmailChange, updateUserEmail.server, softDeleteUser.server |
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

    G[softDeleteUser.server] --> H[D1 Database]
    H --> I[UPDATE users SET deleted_at = NOW()]

    M[restoreUser.server] --> N[D1 Database]
    N --> O[UPDATE users SET deleted_at = NULL]

    P[purgeExpiredUsers.server] --> Q[D1 Database]
    Q --> R[DELETE FROM users WHERE id]

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

```text
アカウント退会確認 → Stripeサブスクリプション停止(Customer保持) → softDeleteUser(論理削除) → deleteAllUserSessions → /login + 冬眠メッセージ
```

---

**最終更新**: 2026-02-14
