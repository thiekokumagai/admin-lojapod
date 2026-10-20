import { apiFetch } from "@/services/api";

export type LoyaltyProgramType =
  | "FREE_PRODUCT"
  | "POINTS_DISCOUNT"
  | "CASHBACK"
  | "PROGRESSIVE_DISCOUNT"
  | "HYBRID";

export interface ProgressiveTier {
  minOrders: number;
  discountPercent: number;
}

export interface LoyaltyProgram {
  id: string;
  storeId: string;
  isActive: boolean;
  type: LoyaltyProgramType;
  stampsRequired: number;
  minOrderValue: number;
  validityDays: number;
  rewardText: string;
  rewardCouponCode?: string | null;
  rewardDiscount?: number | null;
  pointsPerReal?: number;
  pointsRedemptionValue?: number;
  minPointsToRedeem?: number;
  cashbackPercent?: number;
  progressiveTiers?: ProgressiveTier[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: string;
  stampsCount: number;
  pointsAmount?: number | null;
  cashbackAmount?: number | null;
  description?: string;
  createdAt: string;
}

export interface LoyaltyRewardRedemption {
  id: string;
  storeId: string;
  loyaltyCardId: string;
  orderId?: string | null;
  customerPhone: string;
  customerName?: string | null;
  rewardType: string;
  rewardTitle: string;
  status: "PENDING_DELIVERY" | "DELIVERED" | "CANCELLED";
  deliveredAt?: string | null;
  notes?: string | null;
  createdAt: string;
  order?: {
    orderNumber: number;
    totalOrder: number;
    status: string;
  } | null;
}

export interface LoyaltyCard {
  id: string;
  storeId: string;
  customerId?: string | null;
  customerPhone: string;
  customerName?: string | null;
  currentStamps: number;
  pointsBalance: number;
  cashbackBalance: number;
  totalCompleted: number;
  startedAt?: string | null;
  expiresAt?: string | null;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "REDEEMED";
  createdAt: string;
  updatedAt: string;
  transactions?: LoyaltyTransaction[];
  redemptions?: LoyaltyRewardRedemption[];
}

export interface LoyaltyListResponse {
  data: LoyaltyCard[];
  total: number;
  page: number;
  limit: number;
  program: LoyaltyProgram | null;
  pendingRedemptionsCount?: number;
}

export const loyaltyService = {
  getProgram: async (): Promise<LoyaltyProgram> => {
    const res = await apiFetch("/loyalty/program");
    if (!res.ok) throw new Error("Erro ao buscar configurações do programa de fidelidade");
    return res.json();
  },

  getCustomerCard: async (phone?: string): Promise<{ card: LoyaltyCard | null; program: LoyaltyProgram | null }> => {
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    const sp = new URLSearchParams();
    if (cleanPhone) sp.set("phone", cleanPhone);
    const res = await apiFetch(`/loyalty/card?${sp.toString()}`);
    if (!res.ok) throw new Error("Erro ao consultar cartão fidelidade");
    return res.json();
  },

  updateProgram: async (data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> => {
    const res = await apiFetch("/loyalty/program", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao salvar programa de fidelidade");
    }
    return res.json();
  },

  listCards: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<LoyaltyListResponse> => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append("search", params.search);
    if (params?.status) sp.append("status", params.status);
    if (params?.page) sp.append("page", String(params.page));
    if (params?.limit) sp.append("limit", String(params.limit));

    const res = await apiFetch(`/loyalty/cards?${sp.toString()}`);
    if (!res.ok) throw new Error("Erro ao listar cartões de fidelidade");
    return res.json();
  },

  manualAdjust: async (data: { customerPhone: string; customerName?: string; stampsCount: number; reason?: string }): Promise<LoyaltyCard> => {
    const res = await apiFetch("/loyalty/adjust", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao ajustar selos");
    }
    return res.json();
  },

  listRedemptions: async (status?: string): Promise<LoyaltyRewardRedemption[]> => {
    const sp = new URLSearchParams();
    if (status) sp.append("status", status);
    const res = await apiFetch(`/loyalty/redemptions?${sp.toString()}`);
    if (!res.ok) throw new Error("Erro ao listar resgates de brindes");
    return res.json();
  },

  markRedemptionDelivered: async (id: string): Promise<LoyaltyRewardRedemption> => {
    const res = await apiFetch(`/loyalty/redemptions/${id}/deliver`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Erro ao confirmar entrega do brinde");
    return res.json();
  },
};
