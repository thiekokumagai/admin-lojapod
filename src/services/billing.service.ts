import { apiFetch } from './api';

export type BillingStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';

export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  trialDays: number;
  isActive: boolean;
  isPublic: boolean;
  checkoutType: 'SINGLE_PRODUCT' | 'RECURRING_SUBSCRIPTION';
  providerProductId?: string;
  nextSubscriptionPlanId?: string;
  nextSubscriptionPlan?: BillingPlan;
}

export interface BillingPaymentReceipt {
  id: string;
  storeId: string;
  providerPaymentId?: string;
  amount: number;
  kind: string;
  method: 'CREDIT_CARD' | 'PIX_AUTO' | 'UNKNOWN';
  status: 'PENDING' | 'PAID' | 'REFUSED' | 'REFUNDED' | 'CHARGEBACK';
  paidAt?: string;
  createdAt: string;
}

export interface BillingSubscription {
  id: string;
  storeId: string;
  planId?: string;
  plan?: BillingPlan;
  status: BillingStatus;
  paymentMethod: 'CREDIT_CARD' | 'PIX_AUTO' | 'UNKNOWN';
  monthlyFee: string;
  supportSelected: boolean;
  trialEndsAt?: string;
  currentPeriodEndsAt?: string;
  gracePeriodEndsAt?: string;
  store: { id: string; title: string; subdomain: string; adminEmail: string; isActive: boolean };
}

export interface BillingOverview {
  statuses: Partial<Record<BillingStatus, number>>;
  paidAmount: number;
  paidCount: number;
  providerConfigured: boolean;
}

export const billingService = {
  async overview(): Promise<BillingOverview> {
    return (await apiFetch('/billing/admin/overview')).json();
  },
  async subscriptions(): Promise<BillingSubscription[]> {
    return (await apiFetch('/billing/admin/subscriptions')).json();
  },
  async action(storeId: string, action: 'SUSPEND' | 'REACTIVATE' | 'CANCEL', reason: string) {
    return (await apiFetch(`/billing/admin/stores/${storeId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    })).json();
  },
  async getPublicPlans(): Promise<BillingPlan[]> {
    return (await apiFetch('/billing/plans')).json();
  },
  async getMySubscription(): Promise<{
    subscription: BillingSubscription;
    availablePlans: BillingPlan[];
    payments: BillingPaymentReceipt[];
  }> {
    return (await apiFetch('/billing/my-subscription')).json();
  },
  async getCheckout(planIdOrType?: string): Promise<{ checkoutUrl: string }> {
    const url = planIdOrType ? `/billing/checkout?planId=${encodeURIComponent(planIdOrType)}` : '/billing/checkout';
    return (await apiFetch(url)).json();
  },
  async getAdminPlans(): Promise<BillingPlan[]> {
    return (await apiFetch('/billing/admin/plans')).json();
  },
  async syncCaktoProducts(): Promise<{ message: string; plans: BillingPlan[]; rawProductsCount: number }> {
    return (await apiFetch('/billing/admin/plans/sync-cakto', {
      method: 'POST',
    })).json();
  },
  async createPlan(dto: Partial<BillingPlan>): Promise<BillingPlan> {
    return (await apiFetch('/billing/admin/plans', {
      method: 'POST',
      body: JSON.stringify(dto),
    })).json();
  },
  async updatePlan(id: string, dto: Partial<BillingPlan>): Promise<BillingPlan> {
    return (await apiFetch(`/billing/admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    })).json();
  },
  async deletePlan(id: string): Promise<BillingPlan> {
    return (await apiFetch(`/billing/admin/plans/${id}`, {
      method: 'DELETE',
    })).json();
  },
  async updateSubscription(storeId: string, dto: any): Promise<BillingSubscription> {
    return (await apiFetch(`/billing/admin/stores/${storeId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    })).json();
  },
  async getAdminPayments(): Promise<any[]> {
    return (await apiFetch('/billing/admin/payments')).json();
  },
  async reprocessWebhooks(): Promise<any> {
    return (await apiFetch('/billing/admin/webhooks/reprocess', { method: 'POST' })).json();
  },
};
