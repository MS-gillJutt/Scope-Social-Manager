import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@postlane/config";

export interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({
  name,
  verifyUrl,
}) => {
  return (
    <EmailLayout
      previewText="Verify your email address for Postlane"
      heading="Verify your email address"
    >
      <Text style={text}>Hi {name},</Text>
      <Text style={text}>
        Thanks for signing up for {BRAND.NAME}! Please confirm your email address
        by clicking the button below:
      </Text>

      <Section style={btnContainer}>
        <Button href={verifyUrl} style={button}>
          Verify Email Address
        </Button>
      </Section>

      <Text style={subtext}>
        This verification link will expire in 24 hours. If you didn't create an
        account with {BRAND.NAME}, you can safely disregard this email.
      </Text>
    </EmailLayout>
  );
};

export default VerifyEmail;

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
