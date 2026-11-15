import { apiFetch } from './api';

export interface CourierOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  neighborhood?: string;
  totalOrder: number | string;
  totalReceived: number | string;
  paymentType: string;
  paymentMethod: string;
  paymentStatus?: string;
  amountProvided?: number | string | null;
  changeAmount?: number | string | null;
  status?: string;
}

export interface CourierTransaction {
  id: string;
  courierId: string;
  type: 'FEE' | 'PAYMENT';
  amount: number | string;
  description: string;
  date: string;
  orders?: CourierOrder[];
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  balance: number;
  transactions?: CourierTransaction[];
}

/** Rota (lançamento de taxa) com os pedidos dela: resposta enxuta para o mapa de entregas. */
export interface CourierRoute {
  id: string;
  amount: number;
  courierId: string | null;
  courierName: string | null;
  orders: { id: string; orderNumber: number; status: string }[];
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

  updateCourier: async (id: string, data: { name?: string; phone?: string; isActive?: boolean }): Promise<Courier> => {
    const response = await apiFetch(`/couriers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  registerFee: async (data: { courierId: string; amount: number; description: string; orderIds?: string[] }) => {
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

  /** Só as rotas pedidas (ids de lançamento), sem o histórico inteiro do motoboy. */
  getRoutes: async (transactionIds: string[]): Promise<CourierRoute[]> => {
    if (transactionIds.length === 0) return [];
    const response = await apiFetch(`/couriers/routes?ids=${encodeURIComponent(transactionIds.join(","))}`);
    return response.json();
  },

  /** Ajusta o valor de uma taxa de rota (só FEE, da loja do usuário). */
  adjustFee: async (transactionId: string, amount: number) => {
    const response = await apiFetch(`/couriers/transactions/${transactionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    });
    return response.json();
  },

  deleteTransaction: async (id: string) => {
    const response = await apiFetch(`/couriers/transactions/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }
};
