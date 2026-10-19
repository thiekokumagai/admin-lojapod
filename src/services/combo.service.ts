import { apiFetch } from "./api";

export interface ComboItemInput {
  productId: string;
  productItemId?: string | null;
  quantity: number;
  variation?: string | null;
}

export interface ComboItemResponse extends ComboItemInput {
  id: string;
  comboId: string;
  productName: string;
  productPrice: number;
  productImage?: string | null;
  currentStock: number;
}

export interface Combo {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  price: number;
  isActive: boolean;
  isFeatured?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  maxPerOrder?: number | null;
  maxTotalSales?: number | null;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
  items: ComboItemResponse[];
  categoryTitle?: string | null;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
}

export interface CreateComboPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId?: string | null;
  price: number;
  isActive?: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
  maxPerOrder?: number;
  maxTotalSales?: number;
  items: ComboItemInput[];
}

export type UpdateComboPayload = Partial<CreateComboPayload>;

export const comboService = {
  async list(filters?: { search?: string; isActive?: string; categoryId?: string }): Promise<Combo[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.isActive !== undefined && filters.isActive !== "") params.append("isActive", filters.isActive);
    if (filters?.categoryId) params.append("categoryId", filters.categoryId);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiFetch(`/combos${query}`);
    if (!res.ok) throw new Error("Erro ao carregar combos");
    return res.json();
  },

  async getById(id: string): Promise<Combo> {
    const res = await apiFetch(`/combos/${id}`);
    if (!res.ok) throw new Error("Erro ao buscar combo");
    return res.json();
  },

  async create(payload: CreateComboPayload): Promise<Combo> {
    const res = await apiFetch("/combos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao criar combo");
    }
    return res.json();
  },

  async update(id: string, payload: UpdateComboPayload): Promise<Combo> {
    const res = await apiFetch(`/combos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao atualizar combo");
    }
    return res.json();
  },

  async duplicate(id: string): Promise<Combo> {
    const res = await apiFetch(`/combos/${id}/duplicate`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Erro ao duplicar combo");
    return res.json();
  },

  async toggleActive(id: string): Promise<Combo> {
    const res = await apiFetch(`/combos/${id}/toggle-active`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Erro ao alterar status do combo");
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await apiFetch(`/combos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao excluir combo");
  },

  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch("/combos/upload-image", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Erro ao fazer upload da imagem");
    return res.json();
  },
};
