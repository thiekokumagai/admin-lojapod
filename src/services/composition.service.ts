import { apiFetch } from "./api";
import type {
  CompositionGroup,
  CompositionOption,
  ProductComposition,
  CreateCompositionGroupPayload,
  UpdateCompositionGroupPayload,
  CreateCompositionOptionPayload,
  UpdateCompositionOptionPayload,
  AttachProductCompositionPayload,
} from "@/types/composition";

export const compositionService = {
  async listGroups(params?: { search?: string; isActive?: boolean }): Promise<CompositionGroup[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.isActive !== undefined) query.append("isActive", String(params.isActive));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch(`/compositions/groups${queryString}`);
    if (!res.ok) throw new Error("Erro ao carregar grupos de composição");
    return res.json();
  },

  async getGroup(id: string): Promise<CompositionGroup> {
    const res = await apiFetch(`/compositions/groups/${id}`);
    if (!res.ok) throw new Error("Erro ao buscar grupo de composição");
    return res.json();
  },

  async createGroup(data: CreateCompositionGroupPayload): Promise<CompositionGroup> {
    const res = await apiFetch("/compositions/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao criar grupo de composição");
    }
    return res.json();
  },

  async updateGroup(id: string, data: UpdateCompositionGroupPayload): Promise<CompositionGroup> {
    const res = await apiFetch(`/compositions/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao atualizar grupo de composição");
    }
    return res.json();
  },

  async deleteGroup(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`/compositions/groups/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao excluir grupo de composição");
    }
    return res.json();
  },

  async createOption(groupId: string, data: CreateCompositionOptionPayload): Promise<CompositionOption> {
    const res = await apiFetch(`/compositions/groups/${groupId}/options`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao criar opção");
    }
    return res.json();
  },

  async updateOption(id: string, data: UpdateCompositionOptionPayload): Promise<CompositionOption> {
    const res = await apiFetch(`/compositions/options/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao atualizar opção");
    }
    return res.json();
  },

  async deleteOption(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`/compositions/options/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao excluir opção");
    }
    return res.json();
  },

  async getProductCompositions(productId: string): Promise<ProductComposition[]> {
    const res = await apiFetch(`/compositions/products/${productId}`);
    if (!res.ok) throw new Error("Erro ao carregar composições do produto");
    return res.json();
  },

  async attachProductCompositions(
    productId: string,
    data: AttachProductCompositionPayload,
  ): Promise<ProductComposition[]> {
    const res = await apiFetch(`/compositions/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao vincular composições ao produto");
    }
    return res.json();
  },
};
