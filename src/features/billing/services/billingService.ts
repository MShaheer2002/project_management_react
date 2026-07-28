import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';

// ── Types ──

export type BillingPlan = 'FREE' | 'STANDARD' | 'PREMIUM';
export type SubscriptionStatus = 'active' | 'incomplete' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none';

export interface BillingEntitlements {
  aiEnabled: boolean;
  storageLimitBytes: number | null;   // null = unlimited (Premium)
  memberInviteCap: number | null;     // null = unlimited (paid plans)
  paidSeatBilling: boolean;
  teamCap: number | null;             // null = unlimited (paid plans)
  allowedIntegrations: string[] | null; // null = all integrations allowed (paid plans)
}

export interface BillingPermissions {
  canViewBilling: boolean;
  canManageBilling: boolean;
}

export interface BillingSubscription {
  plan: BillingPlan;
  accessPlan: BillingPlan;            // effective plan — use this for feature gating
  status: SubscriptionStatus;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  seatCount: number;
  storageUsedBytes: number;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  entitlements: BillingEntitlements;
  permissions: BillingPermissions;
  prorationNotice: string | null;
}

export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  stripeInvoiceId: string | null;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  status: 'PAID' | 'UNPAID' | 'VOID';
  issuedAt: string | null;
  paidAt: string | null;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
}

export interface SetupIntentResponse {
  clientSecret: string;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  status: string;
  paymentIntentId: string | null;
  clientSecret: string | null;
  requiresAction: boolean;
  seatCount: number;
  prorationNotice: string | null;
}

export interface PaymentStatusResponse {
  plan: BillingPlan;
  accessPlan: BillingPlan;
  status: SubscriptionStatus;
  hasPaidAccess: boolean;
  paymentIntentId: string | null;
  paymentIntentStatus: string | null;
  clientSecret: string | null;
  requiresAction: boolean;
  prorationNotice: string | null;
}

// ── Service ──

export const billingService = {
  /** Get current workspace subscription/billing state */
  async getSubscription(): Promise<BillingSubscription> {
    const { data } = await privateApi.get<ApiResponse<BillingSubscription>>('/billing/subscription');
    return data.data;
  },

  /** Get payment status for recovery/reconciliation */
  async getPaymentStatus(): Promise<PaymentStatusResponse> {
    const { data } = await privateApi.get<ApiResponse<PaymentStatusResponse>>('/billing/subscription/payment-status');
    return data.data;
  },

  /** Create a new subscription (upgrade from Free) */
  async createSubscription(plan: 'STANDARD' | 'PREMIUM'): Promise<CreateSubscriptionResponse> {
    const { data } = await privateApi.post<ApiResponse<CreateSubscriptionResponse>>('/billing/subscription/create', {
      plan: plan.toLowerCase(),
      billingCycle: 'monthly',
    });
    return data.data;
  },

  /** Change plan (Standard ↔ Premium) */
  async changePlan(plan: 'STANDARD' | 'PREMIUM'): Promise<CreateSubscriptionResponse> {
    const { data } = await privateApi.patch<ApiResponse<CreateSubscriptionResponse>>('/billing/subscription/change-plan', {
      plan: plan.toLowerCase(),
    });
    return data.data;
  },

  /** Cancel subscription at period end */
  async cancelSubscription(): Promise<BillingSubscription> {
    const { data } = await privateApi.post<ApiResponse<BillingSubscription>>('/billing/subscription/cancel');
    return data.data;
  },

  /** Create a SetupIntent for saving a card */
  async createSetupIntent(): Promise<SetupIntentResponse> {
    const { data } = await privateApi.post<ApiResponse<SetupIntentResponse>>('/billing/setup-intent');
    return data.data;
  },

  /** List saved payment methods */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const { data } = await privateApi.get<ApiResponse<PaymentMethod[]>>('/billing/payment-methods');
    return data.data;
  },

  /** Attach a payment method after Stripe confirmation */
  async attachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    const { data } = await privateApi.post<ApiResponse<PaymentMethod>>('/billing/payment-methods/attach', { paymentMethodId });
    return data.data;
  },

  /** Set a payment method as default */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    const { data } = await privateApi.patch<ApiResponse<PaymentMethod>>('/billing/payment-methods/default', { paymentMethodId });
    return data.data;
  },

  /** Remove a payment method */
  async removePaymentMethod(id: string): Promise<void> {
    await privateApi.delete(`/billing/payment-methods/${id}`);
  },

  /** List invoices */
  async getInvoices(): Promise<Invoice[]> {
    const { data } = await privateApi.get<ApiResponse<Invoice[]>>('/billing/invoices');
    return data.data;
  },
};
