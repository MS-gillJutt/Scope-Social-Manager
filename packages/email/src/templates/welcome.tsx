import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@postlane/config";

export interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  loginUrl,
}) => {
  return (
    <EmailLayout
      previewText={`Welcome to ${BRAND.NAME}!`}
      heading={`Welcome to ${BRAND.NAME}, ${name}! 👋`}
    >
      <Text style={text}>
        We're thrilled to have you onboard. Postlane makes it easy to schedule,
        publish, and analyze your social media content across all your favorite
        networks from one seamless dashboard.
      </Text>

      <Text style={text}>Here's how to get started:</Text>

      <Section style={listSection}>
        <Text style={listItem}>
          1️⃣ <strong>Connect your channels:</strong> Link your Instagram, LinkedIn,
          TikTok, and other accounts.
        </Text>
        <Text style={listItem}>
          2️⃣ <strong>Create your first post:</strong> Write your caption, attach
          media, and tailor per platform.
        </Text>
        <Text style={listItem}>
          3️⃣ <strong>Schedule and automate:</strong> Choose the best time to
          publish or let Postlane automate your queue.
        </Text>
      </Section>

      <Section style={btnContainer}>
        <Button href={loginUrl} style={button}>
          Go to Your Dashboard
        </Button>
      </Section>

      <Text style={subtext}>
        Need any help? Feel free to reply to this email or visit our help center.
      </Text>
    </EmailLayout>
  );
};

export default WelcomeEmail;

const text: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const listSection: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "16px 20px",
  borderRadius: "8px",
  margin: "20px 0",
  border: "1px solid #f1f5f9",
};

const listItem: React.CSSProperties = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "6px 0",
};

const btnContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0 20px 0",
};

const button: React.CSSProperties = {
  backgroundColor: BRAND.PRIMARY_COLOR,
  color: "#ffffff",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
};

const subtext: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0 0",
};
