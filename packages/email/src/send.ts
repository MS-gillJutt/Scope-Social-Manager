import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import * as React from "react";
import { env } from "@postlane/config";

// Singleton transport instance
let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface SendEmailOptions<P = Record<string, unknown>> {
  to: string | string[];
  subject: string;
  template: React.ComponentType<P>;
  props: P;
  replyTo?: string;
  from?: string;
}

export interface SendRawEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

/**
 * Sends a transactional email using a React Email template.
 */
export async function sendEmail<P extends Record<string, unknown>>({
  to,
  subject,
  template,
  props,
  replyTo,
  from = env.EMAIL_FROM,
}: SendEmailOptions<P>): Promise<{ messageId: string }> {
  const element = React.createElement(template, props);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });

  const client = getTransporter();

  const info = await client.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    replyTo,
    subject,
    html,
    text: plainText,
  });

  return { messageId: info.messageId };
}

/**
 * Sends a raw HTML email.
 */
export async function sendRawEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  from = env.EMAIL_FROM,
}: SendRawEmailOptions): Promise<{ messageId: string }> {
  const client = getTransporter();

  const info = await client.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    replyTo,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""),
  });

  return { messageId: info.messageId };
}
