import nodemailer, { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter;
  private readonly appUrl: string;
  private readonly fromEmail: string;

  constructor() {
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.fromEmail = process.env.EMAIL_FROM || 'Postlane <notifications@postlane.io>';

    const host = process.env.SMTP_HOST || 'localhost';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      // In development or test without SMTP, log or use json transport
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Failed to send email to', options.to, error);
      // Don't crash main flow if email server has temporary glitch
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verifyUrl = `${this.appUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Welcome to Postlane, ${name}!</h2>
        <p>Please verify your email address to get started managing your social media.</p>
        <div style="margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #9ca3af; font-size: 12px;">If you did not sign up for Postlane, you can safely ignore this email.</p>
      </div>
    `;

    await this.sendMail({
      to: email,
      subject: 'Verify your Postlane email address',
      html,
      text: `Hello ${name}, please verify your email address by visiting: ${verifyUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Reset your Postlane password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    await this.sendMail({
      to: email,
      subject: 'Reset your Postlane password',
      html,
      text: `Hi ${name}, reset your password here: ${resetUrl}`,
    });
  }

  async sendTeamInviteEmail(
    email: string,
    inviterName: string,
    workspaceName: string,
    token: string,
    role: string
  ): Promise<void> {
    const inviteUrl = `${this.appUrl}/invite/${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">You're invited to join ${workspaceName} on Postlane</h2>
        <p>${inviterName} has invited you to join their team as a <strong>${role}</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days.</p>
      </div>
    `;

    await this.sendMail({
      to: email,
      subject: `${inviterName} invited you to join ${workspaceName} on Postlane`,
      html,
      text: `${inviterName} invited you to join ${workspaceName} as ${role}. Accept invitation: ${inviteUrl}`,
    });
  }
}
