import { apiFetch } from './api';

export interface Store {
  id: string;
  subdomain: string;
  title: string;
  adminEmail: string;
  isActive: boolean;
  createdAt: string;
  subscriptionExpiresAt?: string;
  monthlyFee?: number;
  _count?: {
    products: number;
    orders: number;
    customers: number;
  };
}

export interface CreateStorePayload {
  subdomain: string;
  title: string;
  adminEmail: string;
  password?: string;
  subscriptionExpiresAt?: string;
  monthlyFee?: number;
}

export const storesService = {
  getStores: async (): Promise<Store[]> => {
    const res = await apiFetch('/stores');
    return res.json();
  },

  createStore: async (payload: CreateStorePayload): Promise<Store> => {
    const res = await apiFetch('/stores', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  updateStore: async (id: string, payload: Partial<CreateStorePayload>): Promise<Store> => {
    const res = await apiFetch(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  toggleStoreActive: async (id: string): Promise<Store> => {
    const res = await apiFetch(`/stores/${id}/toggle-active`, {
      method: 'PATCH',
    });
    return res.json();
  },

  deleteStore: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiFetch(`/stores/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
