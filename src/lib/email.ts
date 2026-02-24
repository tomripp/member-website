import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function emailWrapper(content: string, locale: string): string {
  const footerText =
    locale === "de"
      ? "Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail."
      : "This is an automated email. Please do not reply to this message.";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 24px; }
    p { color: #374151; line-height: 1.6; margin: 0 0 16px; }
    .button { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 8px 0 24px; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .url-fallback { color: #6b7280; font-size: 13px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">MyWebsite</div>
    ${content}
    <div class="footer">${footerText}</div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: string = "en"
): Promise<void> {
  const verifyUrl = `${BASE_URL}/${locale}/auth/verify-email?token=${token}`;

  const isDE = locale === "de";
  const subject = isDE
    ? "E-Mail-Adresse bestätigen"
    : "Verify your email address";

  const content = isDE
    ? `<p>Vielen Dank für Ihre Registrierung!</p>
       <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den Button unten klicken. Der Link ist 24 Stunden gültig.</p>
       <a href="${verifyUrl}" class="button">E-Mail bestätigen</a>
       <p class="url-fallback">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>${verifyUrl}</p>`
    : `<p>Thank you for registering!</p>
       <p>Please verify your email address by clicking the button below. The link is valid for 24 hours.</p>
       <a href="${verifyUrl}" class="button">Verify Email</a>
       <p class="url-fallback">If the button doesn't work, copy this link into your browser:<br>${verifyUrl}</p>`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html: emailWrapper(content, locale),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: string = "en"
): Promise<void> {
  const resetUrl = `${BASE_URL}/${locale}/auth/reset-password?token=${token}`;

  const isDE = locale === "de";
  const subject = isDE
    ? "Passwort zurücksetzen"
    : "Reset your password";

  const content = isDE
    ? `<p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.</p>
       <p>Klicken Sie auf den Button unten, um ein neues Passwort festzulegen. Der Link ist <strong>1 Stunde</strong> gültig.</p>
       <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
       <p>Falls Sie keine Anfrage gestellt haben, können Sie diese E-Mail ignorieren.</p>
       <p class="url-fallback">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>${resetUrl}</p>`
    : `<p>You requested a password reset.</p>
       <p>Click the button below to set a new password. The link is valid for <strong>1 hour</strong>.</p>
       <a href="${resetUrl}" class="button">Reset Password</a>
       <p>If you didn't request this, you can safely ignore this email.</p>
       <p class="url-fallback">If the button doesn't work, copy this link into your browser:<br>${resetUrl}</p>`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html: emailWrapper(content, locale),
  });
}
