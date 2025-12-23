// app/specs/account/types.ts

/**
 * ユーザー情報
 */
export interface User {
  id: string;
  email: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  createdAt: string;
  updatedAt: string;
}

/**
 * セッションデータ
 */
export interface SessionData {
  sessionId: string;
  userId: string;
  expiresAt: string; // ISO 8601 format
  createdAt: string; // ISO 8601 format
}

/**
 * ナビゲーション項目
 */
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  isActive?: boolean;
}

/**
 * AccountLayoutに渡すデータ
 */
export interface AccountLayoutData {
  user: User;
  navItems: NavItem[];
}

/**
 * FormFieldのProps
 */
export interface FormFieldProps {
  label: string;
  name: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'url';
  value?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  onChange?: (value: string) => void;
}

/**
 * Buttonのバリアント
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * ButtonのProps
 */
export interface ButtonProps {
  variant: ButtonVariant;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

/**
 * ErrorMessageの種類
 */
export type ErrorMessageType = 'error' | 'warning' | 'info';

/**
 * ErrorMessageのProps
 */
export interface ErrorMessageProps {
  type: ErrorMessageType;
  message: string;
  onClose?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

/**
 * 認証エラーの種類
 */
export type AuthErrorType =
  | 'session_expired'
  | 'unauthorized'
  | 'invalid_credentials'
  | 'session_invalid';

/**
 * 認証エラー
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  redirectPath?: string;
}

/**
 * フォームバリデーションエラー
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 会員登録フォームデータ
 */
export interface RegistrationFormData {
  email: string;
  password: string;
  passwordConfirm: string;
}

/**
 * ログインフォームデータ
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * 認証アクション結果
 */
export interface AuthActionResult {
  success: boolean;
  error?: {
    message: string;
    field?: string;
  };
  redirectTo?: string;
}

/**
 * ユーザー作成データ（DB登録用）
 */
export interface CreateUserData {
  email: string;
  password: string; // ハッシュ化されたパスワード
}

/**
 * RegisterFormのProps
 */
export interface RegisterFormProps {
  errors?: ValidationError[];
  defaultValues?: Partial<RegistrationFormData>;
}

/**
 * LoginFormのProps
 */
export interface LoginFormProps {
  errors?: ValidationError[];
  defaultValues?: Partial<LoginFormData>;
  redirectUrl?: string;
}

/**
 * Account commonセクションのspec.yamlの型定義
 */
export interface AccountCommonSpec {
  metadata: {
    feature_name: string;
    slug: string;
    created_date: string;
    last_updated: string;
    version: string;
  };
  session: {
    cookie: {
      name: string;
      max_age: number;
      http_only: boolean;
      secure: boolean;
      same_site: string;
      path: string;
    };
    expiry: {
      duration_seconds: number;
    };
    kv: {
      namespace_binding: string;
      key_prefix: string;
    };
  };
  navigation: {
    menu_items: Array<{
      label: string;
      path: string;
      icon: string;
    }>;
    active_detection: {
      exact_match: boolean;
    };
  };
  validation: {
    email: {
      pattern: string;
      max_length: number;
      error_message: string;
    };
    password: {
      min_length: number;
      max_length: number;
      pattern: string;
      error_message: string;
    };
    required: {
      error_message: string;
    };
  };
  error_messages: {
    auth: {
      session_expired: string;
      unauthorized: string;
      invalid_credentials: string;
      session_invalid: string;
    };
    network: {
      timeout: string;
      server_error: string;
    };
    general: {
      unknown_error: string;
    };
  };
  redirect: {
    login_path: string;
    after_login_default: string;
    query_param_name: string;
  };
  button: {
    variants: {
      primary: {
        aria_label: string;
      };
      secondary: {
        aria_label: string;
      };
      danger: {
        aria_label: string;
      };
    };
    states: {
      loading: {
        text: string;
        aria_label: string;
      };
      disabled: {
        aria_label: string;
      };
    };
  };
  error_display: {
    types: {
      error: {
        icon: string;
        auto_dismiss: boolean;
      };
      warning: {
        icon: string;
        auto_dismiss: boolean;
        auto_dismiss_delay_ms: number;
      };
      info: {
        icon: string;
        auto_dismiss: boolean;
        auto_dismiss_delay_ms: number;
      };
    };
  };
  responsive: {
    breakpoints: {
      mobile: number;
      tablet: number;
    };
    navigation_layout: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    button_width: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
  };
  accessibility: {
    aria_labels: {
      account_nav: string;
      loading_spinner: string;
      error_message: string;
      close_error: string;
    };
    aria_live: {
      error_message: string;
      success_message: string;
    };
    keyboard_shortcuts: {
      close_error: string;
    };
  };
  security: {
    password_hash: {
      algorithm: string;
      salt_rounds: number;
    };
    session_id: {
      algorithm: string;
      min_length: number;
    };
    csrf: {
      enabled: boolean;
      header_name: string;
    };
  };
}

/**
 * Account authenticationセクションのspec.yamlの型定義
 */
export interface AccountAuthenticationSpec {
  metadata: {
    feature_name: string;
    slug: string;
    created_date: string;
    last_updated: string;
    version: string;
  };
  server_io: {
    loader: {
      timeout: number;
      authenticated_redirect: string;
    };
    action: {
      default_redirect: string;
      timeout: number;
      intents: {
        register: string;
        login: string;
        logout: string;
      };
    };
  };
  routes: {
    register: {
      path: string;
      title: string;
    };
    login: {
      path: string;
      title: string;
      redirect_param: string;
    };
    logout: {
      path: string;
      redirect_after: string;
    };
  };
  forms: {
    register: {
      fields: {
        email: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
        password: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
        password_confirm: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
      };
      submit_button: {
        label: string;
        loading_label: string;
      };
      links: {
        login: {
          label: string;
          path: string;
        };
      };
    };
    login: {
      fields: {
        email: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
        password: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
      };
      submit_button: {
        label: string;
        loading_label: string;
      };
      links: {
        register: {
          label: string;
          path: string;
        };
      };
    };
  };
  validation: {
    email: {
      pattern: string;
      max_length: number;
      error_messages: {
        required: string;
        invalid_format: string;
        already_exists: string;
      };
    };
    password: {
      min_length: number;
      max_length: number;
      pattern: string;
      error_messages: {
        required: string;
        too_short: string;
        too_long: string;
        weak: string;
      };
    };
    password_confirm: {
      error_messages: {
        required: string;
        mismatch: string;
      };
    };
  };
  error_messages: {
    authentication: {
      invalid_credentials: string;
      account_locked: string;
      session_creation_failed: string;
    };
    registration: {
      email_exists: string;
      creation_failed: string;
    };
    server: {
      timeout: string;
      internal_error: string;
    };
  };
  success_messages: {
    registration: {
      completed: string;
    };
    login: {
      completed: string;
    };
    logout: {
      completed: string;
    };
  };
  security: {
    password_hash: {
      algorithm: string;
      salt_rounds: number;
    };
    account_lock: {
      enabled: boolean;
      max_failed_attempts: number;
      lock_duration_seconds: number;
    };
    rate_limit: {
      enabled: boolean;
      max_requests_per_minute: number;
    };
  };
  database: {
    users: {
      table_name: string;
      columns: {
        id: {
          type: string;
          constraints: string;
          description: string;
        };
        email: {
          type: string;
          constraints: string;
          description: string;
        };
        password: {
          type: string;
          constraints: string;
          description: string;
        };
        subscription_status: {
          type: string;
          constraints: string;
          default: string;
          description: string;
        };
        created_at: {
          type: string;
          constraints: string;
          description: string;
        };
        updated_at: {
          type: string;
          constraints: string;
          description: string;
        };
      };
      indexes: Array<{
        name: string;
        columns: string[];
        unique: boolean;
      }>;
    };
  };
  responsive: {
    breakpoints: {
      mobile: number;
      tablet: number;
    };
    form_container: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
  };
  accessibility: {
    aria_labels: {
      register_form: string;
      login_form: string;
      email_field: string;
      password_field: string;
      password_confirm_field: string;
      submit_button: string;
    };
    error_announcement: {
      aria_live: string;
      aria_atomic: boolean;
    };
  };
  test: {
    fixtures: {
      valid_user: {
        email: string;
        password: string;
      };
      invalid_credentials: {
        email: string;
        password: string;
      };
    };
    selectors: {
      register_form: string;
      login_form: string;
      email_input: string;
      password_input: string;
      password_confirm_input: string;
      submit_button: string;
      error_message: string;
    };
  };
}

/**
 * メールアドレス変更フォームデータ
 */
export interface EmailChangeFormData {
  newEmail: string;
  currentPassword: string;
}

/**
 * パスワード変更フォームデータ
 */
export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

/**
 * アカウント削除フォームデータ
 */
export interface DeleteAccountFormData {
  currentPassword: string;
  confirmation: boolean;
}

/**
 * プロフィール表示データ
 */
export interface ProfileDisplayData {
  user: User;
}

/**
 * EmailChangeFormのProps
 */
export interface EmailChangeFormProps {
  isOpen: boolean;
  onClose: () => void;
  errors?: ValidationError[];
  defaultValues?: Partial<EmailChangeFormData>;
}

/**
 * PasswordChangeFormのProps
 */
export interface PasswordChangeFormProps {
  isOpen: boolean;
  onClose: () => void;
  errors?: ValidationError[];
  defaultValues?: Partial<PasswordChangeFormData>;
}

/**
 * DeleteAccountModalのProps
 */
export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors?: ValidationError[];
}

/**
 * ProfileDisplayのProps
 */
export interface ProfileDisplayProps {
  user: User;
  onEmailChange: () => void;
  onPasswordChange: () => void;
  onDeleteAccount: () => void;
}

/**
 * Account profileセクションのspec.yamlの型定義
 */
export interface AccountProfileSpec {
  metadata: {
    feature_name: string;
    slug: string;
    created_date: string;
    last_updated: string;
    version: string;
  };
  server_io: {
    loader: {
      timeout: number;
    };
    action: {
      timeout: number;
      intents: {
        email_change: string;
        password_change: string;
        delete_account: string;
      };
    };
  };
  routes: {
    settings: {
      path: string;
      title: string;
    };
  };
  forms: {
    email_change: {
      title: string;
      fields: {
        new_email: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
        current_password: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
      };
      submit_button: {
        label: string;
        loading_label: string;
      };
      cancel_button: {
        label: string;
      };
    };
    password_change: {
      title: string;
      fields: {
        current_password: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
        new_password: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
        new_password_confirm: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
      };
      submit_button: {
        label: string;
        loading_label: string;
      };
      cancel_button: {
        label: string;
      };
    };
    delete_account: {
      title: string;
      warning_message: string;
      fields: {
        current_password: {
          name: string;
          label: string;
          type: string;
          placeholder: string;
          autocomplete: string;
          required: boolean;
        };
        confirmation: {
          name: string;
          label: string;
          type: string;
          required: boolean;
        };
      };
      submit_button: {
        label: string;
        loading_label: string;
      };
      cancel_button: {
        label: string;
      };
    };
  };
  profile_display: {
    sections: {
      info: {
        title: string;
        fields: {
          email: {
            label: string;
          };
          subscription_status: {
            label: string;
            values: {
              active: string;
              inactive: string;
              trial: string;
            };
          };
          created_at: {
            label: string;
          };
          updated_at: {
            label: string;
          };
        };
      };
      actions: {
        title: string;
        buttons: Array<{
          label: string;
          action: string;
          variant: string;
        }>;
      };
    };
  };
  validation: {
    new_email: {
      pattern: string;
      max_length: number;
      error_messages: {
        required: string;
        invalid_format: string;
        already_exists: string;
        same_as_current: string;
      };
    };
    new_password: {
      min_length: number;
      max_length: number;
      pattern: string;
      error_messages: {
        required: string;
        too_short: string;
        too_long: string;
        weak: string;
        same_as_current: string;
      };
    };
    new_password_confirm: {
      error_messages: {
        required: string;
        mismatch: string;
      };
    };
    current_password: {
      error_messages: {
        required: string;
        incorrect: string;
      };
    };
    confirmation: {
      error_messages: {
        required: string;
      };
    };
  };
  error_messages: {
    email_change: {
      email_exists: string;
      same_as_current: string;
      update_failed: string;
    };
    password_change: {
      incorrect_current: string;
      same_as_current: string;
      update_failed: string;
    };
    delete_account: {
      incorrect_password: string;
      not_confirmed: string;
      delete_failed: string;
    };
    server: {
      timeout: string;
      internal_error: string;
    };
  };
  success_messages: {
    email_change: {
      completed: string;
    };
    password_change: {
      completed: string;
    };
    delete_account: {
      completed: string;
    };
  };
  modal: {
    overlay: {
      background: string;
      z_index: number;
    };
    container: {
      max_width: string;
      padding: string;
      border_radius: string;
    };
    close_on_overlay_click: boolean;
    close_on_escape: boolean;
  };
  responsive: {
    breakpoints: {
      mobile: number;
      tablet: number;
    };
    container: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    modal: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
  };
  accessibility: {
    aria_labels: {
      profile_display: string;
      email_change_modal: string;
      password_change_modal: string;
      delete_account_modal: string;
      email_field: string;
      password_field: string;
      save_button: string;
      cancel_button: string;
      delete_button: string;
    };
    modal: {
      role: string;
      aria_modal: boolean;
      focus_trap: boolean;
      close_on_escape: boolean;
    };
    error_announcement: {
      aria_live: string;
      aria_atomic: boolean;
    };
  };
  security: {
    password_change: {
      delete_all_sessions: boolean;
      regenerate_current_session: boolean;
    };
    delete_account: {
      delete_all_sessions: boolean;
      delete_user_data: boolean;
      redirect_after_delete: string;
    };
  };
  test: {
    fixtures: {
      existing_user: {
        email: string;
        password: string;
        new_email: string;
        new_password: string;
      };
      duplicate_email: {
        email: string;
      };
    };
    selectors: {
      profile_display: string;
      email_change_button: string;
      password_change_button: string;
      delete_account_button: string;
      email_change_modal: string;
      password_change_modal: string;
      delete_account_modal: string;
      new_email_input: string;
      current_password_input: string;
      new_password_input: string;
      new_password_confirm_input: string;
      confirmation_checkbox: string;
      save_button: string;
      cancel_button: string;
      delete_button: string;
      error_message: string;
      success_message: string;
    };
  };
}
