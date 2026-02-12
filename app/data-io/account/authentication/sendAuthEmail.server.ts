/**
 * sendAuthEmail.server.ts
 * Purpose: Send authentication emails using Resend API
 *
 * @layer 副作用層 (data-io)
 * @responsibility メール送信（外部API通信）
 */

export interface SendAuthEmailParams {
  to: string;
  type: 'magic-link' | 'otp' | 'password-reset';
  payload: string; // URL for magic link/password-reset, or 6-digit code for OTP
  resendApiKey: string;
}

/**
 * Send an authentication email via Resend
 * Note: In a real implementation, templates should be used.
 */
export async function sendAuthEmail({
  to,
  type,
  payload,
  resendApiKey
}: SendAuthEmailParams): Promise<boolean> {
  const subjectMap: Record<SendAuthEmailParams['type'], string> = {
    'magic-link': 'ログインリンクのご案内',
    'otp': '認証コードのご案内',
    'password-reset': 'パスワードリセットのご案内',
  };
  const contentMap: Record<SendAuthEmailParams['type'], string> = {
    'magic-link': `以下のリンクをクリックしてログインしてください：\n\n${payload}\n\nこのリンクは10分間有効です。`,
    'otp': `以下の認証コードを入力してください：\n\n${payload}\n\nこのコードは10分間有効です。`,
    'password-reset': `以下のリンクをクリックしてパスワードをリセットしてください：\n\n${payload}\n\nこのリンクは1時間有効です。\n心当たりのない場合は、このメールを無視してください。`,
  };
  const subject = subjectMap[type];
  const content = contentMap[type];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ClaudeMix Auth <onboarding@resend.dev>', // Should be a verified domain in production
        to,
        subject,
        text: content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
