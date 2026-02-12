/**
 * loadAccountSettingsData.server.ts
 * Loader logic for account settings page
 */

import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { AccountProfileSpec } from '~/specs/account/types';
import type { ProjectSpec } from '~/specs/shared/types';
import { getSession } from '~/data-io/account/common/getSession.server';
import { getSubscriptionByUserId } from '~/data-io/account/subscription/getSubscriptionByUserId.server';

export async function loadAccountSettingsData(request: Request, context: any) {
  const spec = loadSpec<AccountProfileSpec>('account/profile');
  const projectSpec = loadSharedSpec<ProjectSpec>('project');
  const session = await getSession(request, context);

  let subscription = null;
  if (session) {
    subscription = await getSubscriptionByUserId(session.userId, context);
  }

  return {
    projectName: projectSpec.project.name,
    subscription,
    profileSpec: {
      sections: spec.profile_display.sections,
    },
    emailChangeSpec: {
      title: spec.forms.email_change.title,
      fields: {
        new_email: {
          label: spec.forms.email_change.fields.new_email.label,
          placeholder: spec.forms.email_change.fields.new_email.placeholder,
        },
        current_password: {
          label: spec.forms.email_change.fields.current_password.label,
          placeholder: spec.forms.email_change.fields.current_password.placeholder,
        },
      },
      submit_button: {
        label: spec.forms.email_change.submit_button.label,
        loading_label: spec.forms.email_change.submit_button.loading_label,
      },
      cancel_button: {
        label: spec.forms.email_change.cancel_button.label,
      },
    },
    passwordChangeSpec: {
      title: spec.forms.password_change.title,
      fields: {
        current_password: {
          label: spec.forms.password_change.fields.current_password.label,
          placeholder: spec.forms.password_change.fields.current_password.placeholder,
        },
        new_password: {
          label: spec.forms.password_change.fields.new_password.label,
          placeholder: spec.forms.password_change.fields.new_password.placeholder,
        },
        new_password_confirm: {
          label: spec.forms.password_change.fields.new_password_confirm.label,
          placeholder: spec.forms.password_change.fields.new_password_confirm.placeholder,
        },
      },
      submit_button: {
        label: spec.forms.password_change.submit_button.label,
        loading_label: spec.forms.password_change.submit_button.loading_label,
      },
      cancel_button: {
        label: spec.forms.password_change.cancel_button.label,
      },
    },
    deleteAccountSpec: {
      title: spec.forms.delete_account.title,
      warning_message: spec.forms.delete_account.warning_message,
      fields: {
        current_password: {
          label: spec.forms.delete_account.fields.current_password.label,
          placeholder: spec.forms.delete_account.fields.current_password.placeholder,
        },
        confirmation: {
          label: spec.forms.delete_account.fields.confirmation.label,
        },
      },
      submit_button: {
        label: spec.forms.delete_account.submit_button.label,
        loading_label: spec.forms.delete_account.submit_button.loading_label,
      },
      cancel_button: {
        label: spec.forms.delete_account.cancel_button.label,
      },
    },
  };
}
