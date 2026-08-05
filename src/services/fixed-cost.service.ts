import { apiFetch } from "./api";

export interface FixedCost {
  id: string;
  name: string;
  value: number;
  repeats: boolean;
  type: string; // "ALWAYS" | "INSTALLMENTS"
  installmentsCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction {
  id: string;
  cashRegisterId: string | null;
  type: string; // "ENTRY" | "OUTFLOW"
  amount: number;
  description: string;
  date: string;
  fixedCostId: string | null;
  createdAt: string;
}

export const fixedCostService = {
  findAll: async (): Promise<FixedCost[]> => {
    const response = await apiFetch("/fixed-costs");
    return response.json();
  },

  create: async (data: {
    name: string;
    value: number;
    repeats: boolean;
    type: string;
    installmentsCount?: number | null;
  }): Promise<FixedCost> => {
    const response = await apiFetch("/fixed-costs", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (
    id: string,
    data: Partial<{
      name: string;
      value: number;
      repeats: boolean;
      type: string;
      installmentsCount: number | null;
    }>,
  ): Promise<FixedCost> => {
    const response = await apiFetch(`/fixed-costs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string): Promise<FixedCost> => {
    const response = await apiFetch(`/fixed-costs/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },

  pay: async (
    id: string,
    data: {
      amount: number;
      cashRegisterId?: string;
      description?: string;
    },
  ): Promise<CashTransaction> => {
    const response = await apiFetch(`/fixed-costs/${id}/pay`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  createManualTransaction: async (
    cashRegisterId: string,
    data: {
      type: 'ENTRY' | 'OUTFLOW';
      amount: number;
      description: string;
      category?: string;
    },
  ): Promise<CashTransaction> => {
    const response = await apiFetch(`/fixed-costs/transactions`, {
      method: "POST",
      body: JSON.stringify({ ...data, cashRegisterId }),
    });
    return response.json();
  },

  deleteTransaction: async (id: string): Promise<CashTransaction> => {
    const response = await apiFetch(`/fixed-costs/transactions/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};
