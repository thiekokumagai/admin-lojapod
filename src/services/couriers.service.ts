import { apiFetch } from './api';

export interface CourierTransaction {
  id: string;
  courierId: string;
  type: 'FEE' | 'PAYMENT';
  amount: number;
  description: string;
  date: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  balance: number;
  transactions?: CourierTransaction[];
}

export const couriersService = {
  getCouriers: async (): Promise<Courier[]> => {
    const response = await apiFetch('/couriers');
    return response.json();
  },

  createCourier: async (data: { name: string; phone: string }): Promise<Courier> => {
    const response = await apiFetch('/couriers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  registerFee: async (data: { courierId: string; amount: number; description: string }) => {
    const response = await apiFetch('/couriers/fee', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  payCourier: async (data: { courierId: string; amount: number; description?: string }) => {
    const response = await apiFetch('/couriers/pay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getCourier: async (id: string): Promise<Courier> => {
    const response = await apiFetch(`/couriers/${id}`);
    return response.json();
  },

  deleteTransaction: async (id: string) => {
    const response = await apiFetch(`/couriers/transactions/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }
};
