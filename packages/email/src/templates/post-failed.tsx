import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@postlane/config";

export interface PostFailedProps {
  workspaceName: string;
  platform: string;
  postExcerpt: string;
  errorMessage: string;
  retryUrl: string;
}

export const PostFailed: React.FC<PostFailedProps> = ({
  workspaceName,
  platform,
  postExcerpt,
  errorMessage,
  retryUrl,
}) => {
  return (
    <EmailLayout
      previewText={`Action required: Post failed to publish to ${platform}`}
      heading="Post publishing failed ⚠️"
    >
      <Text style={text}>
        We encountered an error while attempting to publish your post to{" "}
        <strong>{platform}</strong> for workspace <strong>{workspaceName}</strong>.
      </Text>

      <Section style={errorCard}>
        <Text style={errorLabel}>Error Reason:</Text>
        <Text style={errorText}>{errorMessage}</Text>
      </Section>

      <Section style={previewCard}>
        <Text style={previewLabel}>Post Excerpt:</Text>
        <Text style={previewContent}>"{postExcerpt}"</Text>
      </Section>

      <Section style={btnContainer}>
        <Button href={retryUrl} style={button}>
          Review & Retry Post
        </Button>
      </Section>

      <Text style={subtext}>
        Common reasons for failure include expired channel authorizations, media
        format constraints, or temporary platform API rate limits.
      </Text>
    </EmailLayout>
  );
};

export default PostFailed;

const text: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const errorCard: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  padding: "16px 20px",
  borderRadius: "8px",
  margin: "16px 0",
  border: "1px solid #fecaca",
};

const errorLabel: React.CSSProperties = {
  color: "#b91c1c",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const errorText: React.CSSProperties = {
  color: "#991b1b",
  fontSize: "14px",
  lineHeight: "20px",
  margin: 0,
};

const previewCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "16px 20px",
  borderRadius: "8px",
  margin: "16px 0",
  border: "1px solid #e2e8f0",
};

const previewLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const previewContent: React.CSSProperties = {
  color: "#1e293b",
  fontSize: "14px",
  fontStyle: "italic",
  lineHeight: "20px",
  margin: 0,
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
