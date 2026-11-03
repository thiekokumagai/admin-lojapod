import { apiFetch } from "@/services/api";

export interface OrderBumpItem {
  id: string;
  storeId: string;
  title: string;
  isActive: boolean;
  priority: number;
  triggerType: "ALL" | "CATEGORY" | "PRODUCT";
  triggerProductId?: string | null;
  triggerCategoryId?: string | null;
  suggestedProductId: string;
  customPrice?: number | null;
  discountPercent?: number | null;
  createdAt: string;
  updatedAt: string;
  triggerProduct?: {
    id: string;
    title: string;
    price?: number | null;
    images?: { url: string }[];
  } | null;
  triggerCategory?: {
    id: string;
    title: string;
  } | null;
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
  triggerCategoryId?: string | null;
  suggestedProductId: string;
  customPrice?: number | null;
  discountPercent?: number | null;
}

export interface UpdateOrderBumpPayload extends Partial<CreateOrderBumpPayload> {}

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
};
