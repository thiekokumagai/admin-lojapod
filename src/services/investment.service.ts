import { apiFetch } from "./api";

export interface InvestmentTransaction {
  id: string;
  type: "ENTRY" | "OUTFLOW";
  amount: number;
  description?: string;
  createdAt: string;
}

export interface InvestmentSummary {
  totalBalance: number;
  totalEntries: number;
  totalOutflows: number;
}

export interface PurchaseAnalysisParams {
  meses?: number;
  categoria?: string;
  dias_cobertura?: number;
  valor?: number;
}

export const investmentService = {
  getSummary: async (): Promise<InvestmentSummary> => {
    const response = await apiFetch("/investments/summary");
    return response.json();
  },

  getTransactions: async (): Promise<InvestmentTransaction[]> => {
    const response = await apiFetch("/investments/transactions");
    return response.json();
  },

  getPurchaseAnalysis: async (params: PurchaseAnalysisParams): Promise<any> => {
    const query = new URLSearchParams();
    if (params.meses) query.append("meses", params.meses.toString());
    if (params.categoria) query.append("categoria", params.categoria);
    if (params.dias_cobertura) query.append("dias_cobertura", params.dias_cobertura.toString());
    if (params.valor) query.append("valor", params.valor.toString());
    
    const response = await apiFetch(`/investments/purchase-analysis?${query.toString()}`);
    return response.json();
  },

  addInvestment: async (payload: { amount: number; description?: string }): Promise<InvestmentTransaction> => {
    const response = await apiFetch("/investments/add", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  registerPurchase: async (payload: { amount: number; description: string }): Promise<InvestmentTransaction> => {
    const response = await apiFetch("/investments/purchase", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await apiFetch(`/investments/${id}`, {
      method: "DELETE",
    });
  },
};
