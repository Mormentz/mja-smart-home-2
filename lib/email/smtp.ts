import nodemailer from "nodemailer";

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE ?? "true") === "true";

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, user, pass, secure };
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@homeconnect.local";
}

export function isSmtpConfigured() {
  return smtpConfig() !== null;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const cfg = smtpConfig();
  if (!cfg) {
    console.warn("[email] SMTP not configured; skipping send to", opts.to);
    return { skipped: true as const };
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  await transporter.sendMail({
    from: getEmailFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  return { sent: true as const };
}

export function appBaseUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${appBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: "Verify your HomeConnect email",
    text: `Verify your email by opening this link: ${verifyUrl}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 22px;">Confirm your email</h1>
        <p>Welcome to HomeConnect. Verify your email to continue artisan onboarding.</p>
        <p style="margin: 28px 0;">
          <a href="${verifyUrl}"
             style="background:#0f172a;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block;">
            Verify email
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;">If the button does not work, open:<br/>${verifyUrl}</p>
      </div>
    `,
  });
}
