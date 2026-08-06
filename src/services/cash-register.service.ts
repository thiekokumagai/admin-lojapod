import { apiFetch } from "./api";
import { Order } from "../types/order";

export interface CashRegister {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashRegisterSummary {
  cashRegister: CashRegister;
  summary: {
    totalReceived: number;
    totalGross: number;
    totalCardFees: number;
    totalEntries: number;
    totalOutflows: number;
    motoboyOutflows: number;
    totalNet: number;
    totalsByMethod: Record<string, number>;
    orderCount: number;
  };
  orders: Order[];
}

export const cashRegisterService = {
  findAll: async (): Promise<CashRegister[]> => {
    const response = await apiFetch("/cash-registers");
    return response.json();
  },

  getSummary: async (id: string): Promise<CashRegisterSummary> => {
    const response = await apiFetch(`/cash-registers/${id}/summary`);
    return response.json();
  },

  create: async (data: { title: string; startDate: string; endDate: string; initialValue?: number }): Promise<CashRegister> => {
    const response = await apiFetch("/cash-registers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: Partial<{ title: string; startDate: string; endDate: string }>): Promise<CashRegister> => {
    const response = await apiFetch(`/cash-registers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch(`/cash-registers/${id}`, {
      method: "DELETE",
    });
  },
};
