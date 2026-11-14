import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@postlane/config";

export interface ResetPasswordProps {
  name: string;
  resetUrl: string;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  name,
  resetUrl,
}) => {
  return (
    <EmailLayout
      previewText="Reset your Postlane password"
      heading="Reset your password"
    >
      <Text style={text}>Hi {name},</Text>
      <Text style={text}>
        We received a request to reset your password for your {BRAND.NAME}{" "}
        account. Click the button below to choose a new password:
      </Text>

      <Section style={btnContainer}>
        <Button href={resetUrl} style={button}>
          Reset Password
        </Button>
      </Section>

      <Text style={subtext}>
        This password reset link will expire in 1 hour. If you didn't request a
        password reset, you can safely ignore this email — your password will
        remain unchanged.
      </Text>
    </EmailLayout>
  );
};

export default ResetPassword;

const text: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const btnContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0 24px 0",
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
