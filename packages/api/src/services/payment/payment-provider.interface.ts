export interface CheckoutSessionOptions {
  trialDays?: number;
  metadata?: Record<string, string>;
  billingInterval?: 'month' | 'year';
  workspaceId?: string;
  customerEmail?: string;
}

export interface WebhookEvent<T = Record<string, any>> {
  id: string;
  type: string;
  created: number;
  data: {
    object: T;
    previous_attributes?: Record<string, any>;
  };
}

export interface PaymentInvoice {
  id: string;
  stripeInvoiceId: string;
  amount: number; // in cents
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' | string;
  paidAt: Date | null;
  invoiceUrl: string | null;
  pdfUrl: string | null;
  createdAt: Date;
}

export interface PaymentProvider {
  /**
   * Create or retrieve a customer in the payment gateway
   */
  createCustomer(workspaceId: string, email: string, name: string): Promise<string>;

  /**
   * Create a checkout session for a subscription plan
   */
  createCheckoutSession(
    customerId: string,
    priceId: string,
    returnUrl: string,
    options?: CheckoutSessionOptions
  ): Promise<{ checkoutUrl: string }>;

  /**
   * Create a customer billing portal session
   */
  createCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ portalUrl: string }>;

  /**
   * Verify and parse incoming webhook payload
   */
  handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookEvent>;

  /**
   * Cancel an active subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Retrieve list of past invoices for a customer
   */
  getInvoices(customerId: string): Promise<PaymentInvoice[]>;
}
