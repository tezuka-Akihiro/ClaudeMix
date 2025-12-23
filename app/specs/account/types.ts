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
