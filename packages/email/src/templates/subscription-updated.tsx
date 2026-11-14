import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@scope/config";

export interface SubscriptionUpdatedProps {
  workspaceName: string;
  planName: string;
  billingInterval: string;
  amount: string;
  nextBillingDate: string;
  dashboardUrl: string;
}

export const SubscriptionUpdated: React.FC<SubscriptionUpdatedProps> = ({
  workspaceName,
  planName,
  billingInterval,
  amount,
  nextBillingDate,
  dashboardUrl,
}) => {
  return (
    <EmailLayout
      previewText={`Your ${BRAND.NAME} subscription has been updated to ${planName}`}
      heading="Subscription Updated 🎉"
    >
      <Text style={text}>
        Your subscription for workspace <strong>{workspaceName}</strong> has been
        successfully updated.
      </Text>

      <Section style={summaryCard}>
        <Text style={summaryRow}>
          <strong>New Plan:</strong> {planName}
        </Text>
        <Text style={summaryRow}>
          <strong>Billing Cycle:</strong> {billingInterval}
        </Text>
        <Text style={summaryRow}>
          <strong>Price:</strong> {amount} / {billingInterval}
        </Text>
        <Text style={summaryRow}>
          <strong>Next Billing Date:</strong> {nextBillingDate}
        </Text>
      </Section>

      <Text style={text}>
        All new features and limit increases are now unlocked and ready to use in
        your workspace.
      </Text>

      <Section style={btnContainer}>
        <Button href={dashboardUrl} style={button}>
          Go to Workspace
        </Button>
      </Section>

      <Text style={subtext}>
        You can view your receipts and manage your subscription anytime under
        Workspace Settings &gt; Billing.
      </Text>
    </EmailLayout>
  );
};

export default SubscriptionUpdated;

const text: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const summaryCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  padding: "16px 20px",
  borderRadius: "8px",
  margin: "20px 0",
  border: "1px solid #e2e8f0",
};

const summaryRow: React.CSSProperties = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "4px 0",
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
