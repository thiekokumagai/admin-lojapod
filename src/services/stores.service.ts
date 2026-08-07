import { apiFetch } from './api';

export interface Store {
  id: string;
  subdomain: string;
  title: string;
  adminEmail: string;
  createdAt: string;
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
};
