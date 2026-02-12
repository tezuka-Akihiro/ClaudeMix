/**
 * auth.otp.tsx
 * Purpose: OTP verification page - verify code and log in
 *
 * @layer UI層 (routes)
 * @responsibility OTP認証コード入力・検証ページ
 */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, LinksFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useActionData, useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';

// CSS imports (LinksFunction for SSR)
import accountCommonStyles from '~/styles/account/layer2-common.css?url';
import authStyles from '~/styles/account/layer2-authentication.css?url';
import authStructureStyles from '~/styles/account/layer3-authentication.css?url';

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: accountCommonStyles },
  { rel: "stylesheet", href: authStyles },
  { rel: "stylesheet", href: authStructureStyles },
];

// UI Components
import { OtpVerifyForm } from '~/components/account/authentication/OtpVerifyForm';

// Spec loader
import { loadSpec, loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import type { ProjectSpec } from '~/specs/shared/types';

// Data-IO layer
import { verifyOtpToken } from '~/data-io/account/authentication/verifyOtpToken.server';
import { upsertUserByEmail } from '~/data-io/account/authentication/upsertUserByEmail.server';
import { saveOtpToken } from '~/data-io/account/authentication/saveOtpToken.server';
import { checkOtpRateLimit } from '~/data-io/account/authentication/checkOtpRateLimit.server';
import { sendAuthEmail } from '~/data-io/account/authentication/sendAuthEmail.server';
import { saveSession } from '~/data-io/account/common/saveSession.server';
import { getSession } from '~/data-io/account/common/getSession.server';

// Pure logic layer
import { sanitizeEmail } from '~/lib/account/authentication/sanitizeEmail';
import { generateOtp } from '~/lib/account/authentication/generateAuthToken';
import { createSessionData } from '~/lib/account/common/createSessionData';

interface ActionData {
  error?: string;
  success?: string;
}

interface LoaderData {
  projectName: string;
  email: string;
  uiSpec: {
    title: string;
    fields: {
      otpCode: {
        label: string;
        placeholder: string;
        name: string;
        inputmode: 'numeric';
        maxlength: number;
        autocomplete: string;
      };
    };
    submitButton: {
      label: string;
      loadingLabel: string;
    };
    links: {
      resend: { label: string };
      back: { label: string; path: string };
    };
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectName || 'ClaudeMix';
  return [
    { title: `${data?.uiSpec?.title || 'OTP認証'} - ${projectName}` },
  ];
};

/**
 * Loader: Prepare OTP verify page
 * Requires email in URL search params
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const projectSpec = loadSharedSpec<ProjectSpec>('project');

  // Check if already logged in
  const session = await getSession(request, context as any);
  if (session) {
    return redirect(spec.server_io.loader.authenticated_redirect);
  }

  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return redirect(spec.routes.login.path);
  }

  return json<LoaderData>({
    projectName: projectSpec.project.name,
    email,
    uiSpec: {
      title: spec.routes.otp_verify.title,
      fields: {
        otpCode: {
          label: spec.forms.otp_verify.fields.otp_code.label,
          placeholder: spec.forms.otp_verify.fields.otp_code.placeholder,
          name: spec.forms.otp_verify.fields.otp_code.name,
          inputmode: 'numeric',
          maxlength: spec.forms.otp_verify.fields.otp_code.maxlength,
          autocomplete: spec.forms.otp_verify.fields.otp_code.autocomplete,
        },
      },
      submitButton: {
        label: spec.forms.otp_verify.submit_button.label,
        loadingLabel: spec.forms.otp_verify.submit_button.loading_label,
      },
      links: {
        resend: { label: spec.forms.otp_verify.links.resend.label },
        back: {
          label: spec.forms.otp_verify.links.back.label,
          path: spec.forms.otp_verify.links.back.path,
        },
      },
    },
  });
}

/**
 * Action: Handle OTP verification and resend
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');

  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const email = sanitizeEmail(formData.get('email') as string || '');

  if (!email) {
    return redirect(spec.routes.login.path);
  }

  // Resend OTP
  if (intent === 'resend-otp') {
    // Rate limit check
    const rateLimitResult = await checkOtpRateLimit(email, context as any);
    if (!rateLimitResult.allowed) {
      return json<ActionData>(
        { error: spec.error_messages.otp.rate_limited },
        { status: 429 }
      );
    }

    // Generate and send new OTP
    const otpCode = generateOtp();
    const saved = await saveOtpToken(email, otpCode, context as any);
    if (!saved) {
      return json<ActionData>(
        { error: spec.error_messages.otp.send_failed },
        { status: 500 }
      );
    }

    const env = (context as any).cloudflare?.env || (context as any).env;
    await sendAuthEmail({
      to: email,
      type: 'otp',
      payload: otpCode,
      resendApiKey: env?.RESEND_API_KEY || '',
    });

    return json<ActionData>({ success: spec.success_messages.otp.code_sent });
  }

  // Verify OTP
  if (intent === 'verify-otp') {
    const otpCode = formData.get('otpCode') as string || '';

    const result = await verifyOtpToken(email, otpCode, context as any);

    if (!result.valid) {
      const errorMap: Record<string, string> = {
        invalid_code: spec.error_messages.otp.invalid_code,
        expired: spec.error_messages.otp.expired,
        max_attempts: spec.error_messages.otp.max_attempts_exceeded,
      };
      const errorMessage = result.error ? errorMap[result.error] : spec.error_messages.server.internal_error;

      return json<ActionData>(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // OTP valid: upsert user and create session
    const user = await upsertUserByEmail(email, context as any);
    if (!user) {
      return json<ActionData>(
        { error: spec.error_messages.server.internal_error },
        { status: 500 }
      );
    }

    const sessionId = crypto.randomUUID();
    const sessionData = createSessionData(user.id, sessionId);
    const setCookieHeader = await saveSession(sessionData, context as any);

    return redirect(spec.server_io.action.default_redirect, {
      headers: {
        'Set-Cookie': setCookieHeader,
      },
    });
  }

  return json<ActionData>(
    { error: spec.error_messages.server.internal_error },
    { status: 400 }
  );
}

export default function AuthOtp() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || loaderData.email;

  return (
    <main className="auth-container auth-container-structure" data-testid="otp-verify-page">
      <div className="auth-card auth-card-structure">
        <h1 className="auth-header__title">{loaderData.uiSpec.title}</h1>
        <p className="auth-header__subtitle">{email}</p>

        {actionData?.success && (
          <div className="success-message-structure" role="status">
            <span>{actionData.success}</span>
          </div>
        )}

        <OtpVerifyForm
          email={email}
          error={actionData?.error}
          uiSpec={loaderData.uiSpec}
          isSubmitting={isSubmitting}
        />
      </div>
    </main>
  );
}
