import { apiFetch } from "@/services/api";

export interface AbandonedCartItem {
  name: string;
  quantity: number;
  variation: string | null;
}

export interface AbandonedCart {
  id: string;
  customerName: string;
  /** Telefone completo, só dígitos. Só chega a quem tem a permissão `abandoned_carts`. */
  customerPhone: string;
  items: AbandonedCartItem[];
  /** Estimativa: o valor vem do navegador do cliente. */
  totalEstimated: number;
  updatedAt: string;
  contactedAt: string | null;
}

export interface AbandonedCartContact {
  name: string;
  phone: string;
}

export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const res = await apiFetch("/abandoned-carts");
  if (!res.ok) {
    throw new Error("Erro ao buscar carrinhos abandonados");
  }
  return res.json();
}

/** Marca o carrinho como chamado e devolve o contato completo para abrir o WhatsApp. */
export async function contactAbandonedCart(id: string): Promise<AbandonedCartContact> {
  const res = await apiFetch(`/abandoned-carts/${id}/whatsapp`, { method: "POST" });
  if (!res.ok) {
    throw new Error("Erro ao abrir o contato do carrinho");
  }
  return res.json();
}

/** Tira o carrinho da lista (o servidor apaga o contato). */
export async function dismissAbandonedCart(id: string): Promise<void> {
  const res = await apiFetch(`/abandoned-carts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Erro ao remover o carrinho da lista");
  }
}
