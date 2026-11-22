import { apiFetch } from "@/services/api";
import type { OrderBumpDisplayLocation } from "@/utils/order-bump-location";

export interface OrderBumpItem {
  id: string;
  storeId: string;
  title: string;
  isActive: boolean;
  priority: number;
  triggerType: "ALL" | "CATEGORY" | "PRODUCT";
  triggerProductId?: string | null;
  triggerProductIds?: string[];
  triggerCategoryId?: string | null;
  triggerCategoryIds?: string[];
  suggestedProductId: string;
  customPrice?: number | null;
  discountPercent?: number | null;
  /** Onde a oferta aparece para o cliente. Ofertas antigas vêm como "CART". */
  displayLocation?: OrderBumpDisplayLocation;
  viewsCount?: number;
  conversionsCount?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
  triggerProduct?: {
    id: string;
    title: string;
    price?: number | null;
    images?: { url: string }[];
  } | null;
  triggerProducts?: {
    id: string;
    title: string;
    price?: number | null;
    images?: { url: string }[];
  }[];
  triggerCategory?: {
    id: string;
    title: string;
  } | null;
  triggerCategories?: {
    id: string;
    title: string;
  }[];
  suggestedProduct?: {
    id: string;
    title: string;
    price?: number | null;
    promotionalPrice?: number | null;
    isVisible?: boolean;
    images?: { url: string }[];
    items?: {
      id: string;
      stock: number;
    }[];
  } | null;
}

export interface CreateOrderBumpPayload {
  title?: string;
  isActive?: boolean;
  priority?: number;
  triggerType: "ALL" | "CATEGORY" | "PRODUCT";
  triggerProductId?: string | null;
  triggerProductIds?: string[];
  triggerCategoryId?: string | null;
  triggerCategoryIds?: string[];
  suggestedProductId: string;
  customPrice?: number | null;
  discountPercent?: number | null;
  displayLocation?: OrderBumpDisplayLocation;
}

export type UpdateOrderBumpPayload = Partial<CreateOrderBumpPayload>;

export const orderBumpService = {
  async list(): Promise<OrderBumpItem[]> {
    const res = await apiFetch("/order-bumps");
    if (!res.ok) {
      throw new Error("Erro ao buscar regras de Order Bump");
    }
    return res.json();
  },

  async create(payload: CreateOrderBumpPayload): Promise<OrderBumpItem> {
    const res = await apiFetch("/order-bumps", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao criar regra de Order Bump");
    }
    return res.json();
  },

  async update(id: string, payload: UpdateOrderBumpPayload): Promise<OrderBumpItem> {
    const res = await apiFetch(`/order-bumps/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao atualizar regra de Order Bump");
    }
    return res.json();
  },

  async toggleActive(id: string): Promise<OrderBumpItem> {
    const res = await apiFetch(`/order-bumps/${id}/toggle`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao alterar status");
    }
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await apiFetch(`/order-bumps/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao excluir regra");
    }
  },

  async reorder(ids: string[]): Promise<OrderBumpItem[]> {
    const res = await apiFetch("/order-bumps/reorder", {
      method: "PATCH",
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Erro ao reordenar sugestões");
    }
    return res.json();
  },
};
