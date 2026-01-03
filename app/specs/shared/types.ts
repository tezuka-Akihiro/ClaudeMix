/**
 * shared specファイルの型定義
 */

// validation-spec.yaml
export interface ValidationRule {
  pattern: string;
  error_message: string;
}

export interface PasswordValidation extends ValidationRule {
  min_length: number;
  max_length: number;
  requirements: string[];
}

export interface EmailValidation extends ValidationRule {
  max_length: number;
}

export interface UsernameValidation extends ValidationRule {
  min_length: number;
  max_length: number;
}

export interface ValidationSpec {
  metadata: {
    feature_name: string;
    version: string;
    description: string;
  };
  email: EmailValidation;
  password: PasswordValidation;
  username: UsernameValidation;
  url: ValidationRule;
}

// responsive-spec.yaml
export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface GridColumns {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface FontSizes {
  mobile: { base: number; heading: number };
  tablet: { base: number; heading: number };
  desktop: { base: number; heading: number };
}

export interface ResponsiveSpec {
  metadata: {
    feature_name: string;
    version: string;
    description: string;
  };
  breakpoints: Breakpoints;
  grid_columns: GridColumns;
  spacing: GridColumns;
  font_sizes: FontSizes;
  container: {
    max_width: number;
    padding: GridColumns;
  };
}

// server-spec.yaml
export interface RetryConfig {
  max_attempts: number;
  backoff: 'exponential' | 'linear';
  initial_delay: number;
}

export interface TimeoutConfig {
  timeout: number;
  retry: RetryConfig;
}

export interface ServerSpec {
  metadata: {
    feature_name: string;
    version: string;
    description: string;
  };
  loader: TimeoutConfig;
  action: TimeoutConfig;
  rate_limit: {
    per_minute: number;
    per_hour: number;
    per_day: number;
  };
  cache: {
    default_ttl: number;
    max_age: number;
  };
  security: {
    bcrypt_rounds: number;
    session_max_age: number;
    csrf_token_length: number;
  };
}

// project-spec.yaml (RFC-001で定義済み)
export interface ProjectSpec {
  metadata: {
    version: string;
    migrated_from?: string;
    migration_date?: string;
  };
  project: {
    name: string;
    service_name: string;
    concept: string;
    target: string;
    value_proposition: string;
  };
  references: {
    world_view_site_url: string;
    app_url: string;
  };
  services: {
    [serviceName: string]: {
      name: string;
      description: string;
      doc_path: string;
      sections: {
        [sectionName: string]: {
          name: string;
          abstract_purpose: string;
          specific_purpose: string;
          input: string;
          processing: string;
          output: string;
          doc_path: string;
        };
      };
    };
  };
}
