import * as React from "react";
import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout.js";
import { BRAND } from "@scope/config";

export interface PaymentFailedProps {
  workspaceName: string;
  amount: string;
  billingUrl: string;
}

export const PaymentFailed: React.FC<PaymentFailedProps> = ({
  workspaceName,
  amount,
  billingUrl,
}) => {
  return (
    <EmailLayout
      previewText={`Urgent: Payment failed for your ${BRAND.NAME} subscription`}
      heading="Payment Failed ⚠️"
    >
      <Text style={text}>
        We were unable to process a scheduled payment of <strong>{amount}</strong>{" "}
        for your workspace <strong>{workspaceName}</strong>.
      </Text>

      <Text style={text}>
        To keep your scheduled posts publishing without interruption and ensure
        uninterrupted access to your workspace, please update your payment method.
      </Text>

      <Section style={btnContainer}>
        <Button href={billingUrl} style={button}>
          Update Payment Method
        </Button>
      </Section>

      <Text style={subtext}>
        We will retry this payment in a few days. If the payment continues to
        fail, your workspace may be temporarily downgraded to the Free plan.
      </Text>
    </EmailLayout>
  );
};

export default PaymentFailed;

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
  backgroundColor: "#e11d48", // Rose 600 for urgency
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
