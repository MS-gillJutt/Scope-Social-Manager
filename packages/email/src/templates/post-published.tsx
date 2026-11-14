import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@postlane/config";

export interface PostPublishedProps {
  workspaceName: string;
  platforms: string[];
  postExcerpt: string;
  postUrl: string;
  publishedAt: string;
}

export const PostPublished: React.FC<PostPublishedProps> = ({
  workspaceName,
  platforms,
  postExcerpt,
  postUrl,
  publishedAt,
}) => {
  return (
    <EmailLayout
      previewText={`Your post has been successfully published on ${platforms.join(", ")}`}
      heading="Post successfully published! 🚀"
    >
      <Text style={text}>
        Great news! Your post for workspace <strong>{workspaceName}</strong> was
        successfully published across {platforms.length} platform(s):{" "}
        <strong>{platforms.join(", ")}</strong>.
      </Text>

      <Section style={cardSection}>
        <Text style={excerptLabel}>Post Preview:</Text>
        <Text style={excerptText}>"{postExcerpt}"</Text>
        <Text style={metaText}>Published at: {publishedAt}</Text>
      </Section>

      <Section style={btnContainer}>
        <Button href={postUrl} style={button}>
          View Post & Analytics
        </Button>
      </Section>

      <Text style={subtext}>
        Analytics for this post will begin syncing automatically. Check your
        dashboard to monitor impressions and engagement.
      </Text>
    </EmailLayout>
  );
};

export default PostPublished;

const text: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const cardSection: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "16px 20px",
  borderRadius: "8px",
  margin: "20px 0",
  border: "1px solid #e2e8f0",
};

const excerptLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 6px 0",
};

const excerptText: React.CSSProperties = {
  color: "#1e293b",
  fontSize: "14px",
  fontStyle: "italic",
  lineHeight: "22px",
  margin: "0 0 10px 0",
};

const metaText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
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
