// =============================================================================
// Subscription & Billing Types
// =============================================================================

import type { Plan } from "@postlane/config";

export type BillingInterval = "month" | "year";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export interface Subscription {
  id: string;
  workspaceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: Plan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  brand: string; // e.g. "visa"
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amount: number; // in cents
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  paidAt: Date | null;
  invoiceUrl: string | null;
  createdAt: Date;
}

export interface UpgradePreview {
  currentPlan: Plan;
  newPlan: Plan;
  billingInterval: BillingInterval;
  immediateChargeAmount: number; // prorated, in cents
  nextBillingAmount: number;
  nextBillingDate: Date;
}

export interface ChangePlanInput {
  plan: Plan;
  billingInterval: BillingInterval;
}
