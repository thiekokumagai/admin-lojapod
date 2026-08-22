import { apiFetch } from './api';

export type BillingStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';

export interface BillingSubscription {
  id: string;
  storeId: string;
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
  async editSubscription(storeId: string, data: Partial<BillingSubscription>) {
    return (await apiFetch(`/billing/admin/subscriptions/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })).json();
  }
};
