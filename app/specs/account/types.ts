// app/specs/account/types.ts

/**
 * ユーザー情報
 */
export interface User {
  id: string;
  email: string;
  subscriptionStatus: 'active' | 'inactive';
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
  services: {
    items: Array<{
      label: string;
      path: string;
      description: string;
    }>;
  };
  validation: {
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
      authenticated_redirect: string;
    };
    action: {
      default_redirect: string;
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
    forgot_password: {
      path: string;
      title: string;
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
    forgot_password: {
      title: string;
      description: string;
      fields: {
        email: {
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
      success_message: string;
    };
  };
  validation: {
    email: {
      error_messages: {
        required: string;
        invalid_format: string;
        already_exists: string;
      };
    };
    password: {
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
    password_reset: {
      token_invalid: string;
      token_verification_failed: string;
      token_expired: string;
      user_not_found: string;
      update_failed: string;
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
  flash_messages: {
    'session-expired': string;
    'unauthorized': string;
    'logout-success': string;
    'password-reset-success': string;
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
    loader: {};
    action: {
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
      error_messages: {
        required: string;
        invalid_format: string;
        already_exists: string;
        same_as_current: string;
      };
    };
    new_password: {
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
      min_length: number;
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

/**
 * サブスクリプション状態
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

/**
 * サブスクリプション情報
 */
export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string; // ISO 8601 format
  currentPeriodEnd: string; // ISO 8601 format
  canceledAt?: string; // ISO 8601 format
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

/**
 * プラン情報
 */
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  stripePriceId: string;
  features: string[];
  discountRate: number;
  badge?: string;
}

/**
 * サブスクリプション状態表示用データ
 */
export interface SubscriptionStatusData {
  label: string;
  badgeVariant: 'success' | 'secondary' | 'warning' | 'info' | 'danger';
  color: string;
  description: string;
}

/**
 * PlanSelectorのProps
 */
export interface PlanSelectorProps {
  plans: Plan[];
  currentPlanId?: string;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

/**
 * SubscriptionStatusのProps
 */
export interface SubscriptionStatusProps {
  subscription: Subscription;
  plan: Plan;
  onCancel: () => void;
}

/**
 * CancelSubscriptionModalのProps
 */
export interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Stripe Checkout Session作成データ
 */
export interface CreateCheckoutSessionData {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Stripe Webhook イベント
 */
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

/**
 * Account subscriptionセクションのspec.yamlの型定義
 */
export interface AccountSubscriptionSpec {
  metadata: {
    feature_name: string;
    slug: string;
    created_date: string;
    last_updated: string;
    version: string;
  };
  server_io: {
    loader: {};
    action: {
      intents: {
        create_checkout: string;
        cancel_subscription: string;
      };
    };
  };
  routes: {
    subscription: {
      path: string;
      title: string;
    };
    webhook: {
      path: string;
      title: string;
    };
    success_redirect: {
      path: string;
      title: string;
    };
    cancel_redirect: {
      path: string;
      title: string;
    };
  };
  plans: Record<string, {
    id: string;
    name: string;
    description: string;
    price: number;
    original_price?: number;
    currency: string;
    interval: string;
    interval_count: number;
    stripe_price_id: string;
    features: string[];
    discount_rate: number;
    badge?: string;
    enabled: boolean;
  }>;
  subscription_status: {
    active: {
      label: string;
      badge_variant: string;
      color: string;
      description: string;
    };
    canceled: {
      label: string;
      badge_variant: string;
      color: string;
      description: string;
    };
    past_due: {
      label: string;
      badge_variant: string;
      color: string;
      description: string;
    };
    trialing: {
      label: string;
      badge_variant: string;
      color: string;
      description: string;
    };
    incomplete: {
      label: string;
      badge_variant: string;
      color: string;
      description: string;
    };
    incomplete_expired: {
      label: string;
      badge_variant: string;
      color: string;
      description: string;
    };
    unpaid: {
      label: string;
      badge_variant: string;
      color: string;
      description: string;
    };
  };
  webhook_events: {
    checkout_session_completed: {
      event_type: string;
      description: string;
      action: string;
    };
    customer_subscription_created: {
      event_type: string;
      description: string;
      action: string;
    };
    customer_subscription_updated: {
      event_type: string;
      description: string;
      action: string;
    };
    customer_subscription_deleted: {
      event_type: string;
      description: string;
      action: string;
    };
    invoice_paid: {
      event_type: string;
      description: string;
      action: string;
    };
    invoice_payment_failed: {
      event_type: string;
      description: string;
      action: string;
    };
    invoice_payment_action_required: {
      event_type: string;
      description: string;
      action: string;
    };
  };
  ui: {
    plan_selector: {
      title: string;
      grid_columns: {
        desktop: number;
        tablet: number;
        mobile: number;
      };
      card_padding: string;
      card_border_radius: string;
      card_gap: {
        desktop: string;
        mobile: string;
      };
    };
    subscription_status: {
      title: string;
      card_width: {
        desktop: string;
        tablet: string;
        mobile: string;
      };
    };
    cancel_modal: {
      title: string;
      width: {
        desktop: string;
        mobile: string;
      };
      padding: string;
      border_radius: string;
      warning_message: string;
      info_message: string;
    };
  };
  forms: {
    create_checkout: {
      fields: {
        plan_id: {
          name: string;
          type: string;
          required: boolean;
        };
      };
      submit_button: {
        label: string;
        loading_label: string;
      };
    };
    cancel_subscription: {
      title: string;
      submit_button: {
        label: string;
        loading_label: string;
        variant: string;
      };
      cancel_button: {
        label: string;
        variant: string;
      };
    };
  };
  error_messages: {
    checkout: {
      session_creation_failed: string;
      invalid_plan: string;
      user_not_found: string;
    };
    cancel: {
      subscription_not_found: string;
      cancel_failed: string;
      already_canceled: string;
    };
    webhook: {
      signature_verification_failed: string;
      invalid_event_type: string;
      processing_failed: string;
    };
    server: {
      timeout: string;
      internal_error: string;
      stripe_api_error: string;
    };
  };
  success_messages: {
    checkout: {
      completed: string;
    };
    cancel: {
      completed: string;
    };
    webhook: {
      processed: string;
    };
  };
  stripe: {
    api_version: string;
    checkout_session: {
      mode: string;
      payment_method_types: string[];
      billing_address_collection: string;
      success_url_param: string;
      cancel_url_param: string;
    };
    webhook: {
      signature_header: string;
      tolerance: number;
    };
    retry: {
      max_attempts: number;
      initial_delay: number;
      max_delay: number;
    };
  };
  database: {
    subscriptions_table: {
      name: string;
      columns: {
        id: string;
        user_id: string;
        stripe_subscription_id: string;
        stripe_customer_id: string;
        plan_id: string;
        status: string;
        current_period_start: string;
        current_period_end: string;
        canceled_at: string;
        created_at: string;
        updated_at: string;
      };
    };
  };
  security: {
    webhook: {
      verify_signature: boolean;
      reject_invalid_signature: boolean;
    };
    checkout_session: {
      include_user_id_in_metadata: boolean;
      customer_email_auto_fill: boolean;
    };
    subscription: {
      require_authentication: boolean;
      validate_user_ownership: boolean;
    };
  };
  responsive: {
    plan_card: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    modal: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    font_size: {
      plan_name: {
        mobile: string;
        desktop: string;
      };
      plan_price: {
        mobile: string;
        desktop: string;
      };
    };
  };
  accessibility: {
    aria_labels: {
      plan_selector: string;
      plan_card: string;
      subscription_status: string;
      cancel_modal: string;
      subscribe_button: string;
      cancel_button: string;
      back_button: string;
    };
    modal: {
      role: string;
      aria_modal: boolean;
      focus_trap: boolean;
      close_on_escape: boolean;
      focus_on_open: string;
    };
    error_announcement: {
      aria_live: string;
      aria_atomic: boolean;
    };
    success_announcement: {
      aria_live: string;
      aria_atomic: boolean;
    };
  };
  performance: {
    page_load: {
      fcp_target: number;
      lcp_target: number;
    };
    checkout_session_creation: {
      timeout: number;
    };
    webhook_processing: {
      timeout: number;
    };
  };
  test: {
    fixtures: {
      test_user: {
        email: string;
        user_id: string;
        stripe_customer_id: string;
      };
      test_subscription: {
        stripe_subscription_id: string;
        plan_id: string;
        status: string;
        current_period_start: string;
        current_period_end: string;
      };
    };
    stripe_test_cards: {
      success: {
        number: string;
        exp_month: number;
        exp_year: number;
        cvc: string;
      };
      declined: {
        number: string;
        exp_month: number;
        exp_year: number;
        cvc: string;
      };
      requires_authentication: {
        number: string;
        exp_month: number;
        exp_year: number;
        cvc: string;
      };
    };
    selectors: {
      plan_selector: string;
      plan_card_1month: string;
      plan_card_3months: string;
      plan_card_6months: string;
      subscribe_1month: string;
      subscribe_3months: string;
      subscribe_6months: string;
      subscription_status: string;
      status_badge: string;
      cancel_subscription_button: string;
      cancel_subscription_modal: string;
      cancel_modal_back_button: string;
      cancel_modal_confirm_button: string;
      checkout_error: string;
      cancel_error: string;
      subscription_success: string;
      cancel_success: string;
    };
  };
  future_features: {
    plan_change: {
      enabled: boolean;
      description: string;
    };
    billing_history: {
      enabled: boolean;
      description: string;
    };
    coupon: {
      enabled: boolean;
      description: string;
    };
    multiple_payment_methods: {
      enabled: boolean;
      description: string;
    };
  };
}
