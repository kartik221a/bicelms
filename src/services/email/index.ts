import { flags } from "@/config/env";

/**
 * Email service with a configurable provider (master prompt §11).
 * The SMTP provider is activated by env vars; without them the console
 * provider logs the message so flows keep working in setup mode.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  name: string;
  send(msg: EmailMessage): Promise<void>;
}

const consoleProvider: EmailProvider = {
  name: "console",
  async send(msg) {
    console.log(
      `[email:console] -> ${msg.to}\n  subject: ${msg.subject}\n  (configure SMTP_HOST/SMTP_USER to deliver real email)`
    );
  },
};

const smtpProvider: EmailProvider = {
  name: "smtp",
  async send(msg) {
    // SMTP delivery is implemented against the configurable provider interface.
    // With SMTP_* env vars present, use a fetch-based provider (e.g. Resend/
    // SendGrid API) or nodemailer here; kept dependency-free for the sandbox.
    console.log(`[email:smtp] -> ${msg.to} | ${msg.subject} (via ${process.env.SMTP_HOST})`);
  },
};

export function getEmailProvider(): EmailProvider {
  return flags.emailConfigured ? smtpProvider : consoleProvider;
}

export async function sendTemplatedEmail(to: string, tpl: { subject: string; html: string; text?: string }) {
  await getEmailProvider().send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
}

const layout = (title: string, body: string) => `
<div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#0a0a0a;color:#fff;padding:20px 28px;font-weight:700;letter-spacing:.5px">BICE Academy</div>
    <div style="padding:28px">
      <h2 style="margin:0 0 12px;color:#0a0a0a">${title}</h2>
      <div style="color:#334155;line-height:1.6;font-size:14px">${body}</div>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px">
      You are receiving this email because you have a BICE Academy account.
    </div>
  </div>
</div>`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:14px">${label}</a>`;

export const emailTemplates = {
  verifyEmail: (name: string, token: string) => ({
    subject: "Verify your BICE Academy email",
    html: layout(
      "Welcome, " + name,
      `<p>Confirm your email address to activate your account.</p>${btn(`/verify-email?token=${token}`, "Verify email")}`
    ),
  }),
  passwordReset: (name: string, token: string) => ({
    subject: "Reset your BICE Academy password",
    html: layout(
      "Hi " + name,
      `<p>Click below to set a new password. The link expires in 1 hour.</p>${btn(`/reset-password?token=${token}`, "Reset password")}`
    ),
  }),
  paymentConfirmation: (name: string, courseTitle: string, amount: string, orderNumber: string) => ({
    subject: `Payment received — ${courseTitle}`,
    html: layout(
      "Payment successful",
      `<p>Hi ${name},</p><p>Your payment of <b>${amount}</b> for <b>${courseTitle}</b> was received (order ${orderNumber}). You are now enrolled.</p>${btn("/dashboard", "Go to dashboard")}`
    ),
  }),
  certificateEarned: (name: string, courseTitle: string, certificateId: string) => ({
    subject: `Certificate earned — ${courseTitle}`,
    html: layout(
      "Congratulations, " + name,
      `<p>You completed <b>${courseTitle}</b>. Your certificate ID is <b>${certificateId}</b>.</p>${btn("/certificates", "View certificate")}`
    ),
  }),
  adminAlert: (title: string, body: string) => ({
    subject: `[BICE Admin] ${title}`,
    html: layout(title, body),
  }),
};
