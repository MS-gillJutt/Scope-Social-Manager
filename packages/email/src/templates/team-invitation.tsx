import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@scope/config";

export interface TeamInvitationProps {
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
}

export const TeamInvitation: React.FC<TeamInvitationProps> = ({
  inviterName,
  workspaceName,
  role,
  inviteUrl,
}) => {
  return (
    <EmailLayout
      previewText={`You've been invited to join ${workspaceName} on ${BRAND.NAME}`}
      heading="You've been invited to join a team"
    >
      <Text style={text}>
        <strong>{inviterName}</strong> has invited you to collaborate on the{" "}
        <strong>{workspaceName}</strong> workspace as a{" "}
        <span style={roleBadge}>{role.toUpperCase()}</span> on {BRAND.NAME}.
      </Text>

      <Text style={text}>
        Accept this invitation to start scheduling and managing content together
        with your team.
      </Text>

      <Section style={btnContainer}>
        <Button href={inviteUrl} style={button}>
          Accept Invitation
        </Button>
      </Section>

      <Text style={subtext}>
        This invitation link will expire in 7 days. If you weren't expecting this
        invitation, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
};

export default TeamInvitation;

const text: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const roleBadge: React.CSSProperties = {
  backgroundColor: "#e0e7ff",
  color: BRAND.PRIMARY_COLOR,
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: 700,
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
