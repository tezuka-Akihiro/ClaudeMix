/**
 * specHelper.ts
 * Purpose: Load spec YAML files for E2E test assertions
 *
 * @layer E2E Test Helper
 * @responsibility Provide spec values for test assertions (SSoT)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

/**
 * Load spec YAML file and return typed object
 */
function loadSpec<T>(specPath: string): T {
  const fullPath = path.join(process.cwd(), 'app', 'specs', `${specPath}-spec.yaml`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  return yaml.parse(fileContents) as T;
}

/**
 * Account Authentication Spec
 */
export interface AccountAuthenticationSpec {
  routes: {
    register: {
      title: string;
    };
    login: {
      title: string;
    };
  };
  forms: {
    register: {
      submit_button: {
        label: string;
      };
    };
    login: {
      submit_button: {
        label: string;
      };
    };
  };
  validation: {
    password_confirm: {
      error_messages: {
        mismatch: string;
      };
    };
    email: {
      error_messages: {
        invalid_format: string;
      };
    };
  };
  error_messages: {
    login: {
      invalid_credentials: string;
    };
  };
}

/**
 * Account Profile Spec
 */
export interface AccountProfileSpec {
  validation: {
    current_password: {
      error_messages: {
        incorrect: string;
      };
    };
    new_password_confirm: {
      error_messages: {
        mismatch: string;
      };
    };
  };
  error_messages: {
    email_change: {
      email_exists: string;
    };
    password_change: {
      incorrect_current: string;
    };
    delete_account: {
      incorrect_password: string;
    };
  };
  forms: {
    delete_account: {
      warning_message: string;
    };
  };
}

/**
 * Load authentication spec
 */
export function getAuthenticationSpec(): AccountAuthenticationSpec {
  return loadSpec<AccountAuthenticationSpec>('account/authentication');
}

/**
 * Load profile spec
 */
export function getProfileSpec(): AccountProfileSpec {
  return loadSpec<AccountProfileSpec>('account/profile');
}
