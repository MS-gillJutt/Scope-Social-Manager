import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@postlane/config";

export interface TokenExpiringProps {
  workspaceName: string;
  platform: string;
  accountName: string;
  expiresInDays: number;
  reconnectUrl: string;
}

export const TokenExpiring: React.FC<TokenExpiringProps> = ({
  workspaceName,
  platform,
  accountName,
  expiresInDays,
  reconnectUrl,
}) => {
  return (
    <EmailLayout
      previewText={`Action required: Your ${platform} connection is expiring soon`}
      heading="Social Account Connection Expiring ⏳"
    >
      <Text style={text}>
        Your connected account <strong>{accountName}</strong> ({platform}) in
        workspace <strong>{workspaceName}</strong> will expire in{" "}
        <strong>{expiresInDays} day{expiresInDays === 1 ? "" : "s"}</strong>.
      </Text>

      <Text style={text}>
        To prevent interruptions with scheduled posts and analytics syncing,
        please reconnect the account before the access token expires.
      </Text>

      <Section style={btnContainer}>
        <Button href={reconnectUrl} style={button}>
          Reconnect {platform}
        </Button>
      </Section>

      <Text style={subtext}>
        Reconnecting only takes a few seconds and refreshes the permissions
        required to publish seamlessly on your behalf.
      </Text>
    </EmailLayout>
  );
};

export default TokenExpiring;

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
