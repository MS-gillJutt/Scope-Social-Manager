import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import { BRAND } from "@postlane/config";

interface EmailLayoutProps {
  previewText: string;
  heading?: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  previewText,
  heading,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>
              <span style={{ color: BRAND.PRIMARY_COLOR, fontWeight: 800 }}>
                Post
              </span>
              <span style={{ color: BRAND.SECONDARY_COLOR, fontWeight: 800 }}>
                lane
              </span>
            </Text>
          </Section>

          {/* Content Card */}
          <Section style={card}>
            {heading && <Heading style={h1}>{heading}</Heading>}
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} {BRAND.NAME}. All rights reserved.
            </Text>
            <Text style={footerSubtext}>
              {BRAND.TAGLINE} &bull;{" "}
              <Link href={BRAND.WEBSITE_URL} style={footerLink}>
                Visit Website
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  margin: 0,
  padding: "40px 0",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "0 20px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const logoText: React.CSSProperties = {
  fontSize: "28px",
  letterSpacing: "-0.5px",
  margin: 0,
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "36px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
};

const h1: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "28px",
  marginTop: 0,
  marginBottom: "16px",
};

const footer: React.CSSProperties = {
  textAlign: "center",
  marginTop: "32px",
};

const footerText: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  margin: "0 0 6px 0",
};

const footerSubtext: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: BRAND.PRIMARY_COLOR,
  textDecoration: "underline",
};
