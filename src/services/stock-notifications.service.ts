import { apiFetch } from "@/services/api";

export interface StockNotificationItem {
  id: string;
  storeId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  productItemId: string | null;
  variationName: string | null;
  customerName: string;
  customerPhone: string;
  status: "PENDING" | "NOTIFIED";
  notifiedAt: string | null;
  createdAt: string;
  currentStock: number;
  isAvailable: boolean;
}

export async function getStockNotifications(filters?: {
  status?: string;
  productId?: string;
}): Promise<StockNotificationItem[]> {
  const query = new URLSearchParams();
  if (filters?.status) query.append("status", filters.status);
  if (filters?.productId) query.append("productId", filters.productId);

  const url = `/stock-notifications${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new Error("Erro ao buscar solicitações de avise-me");
  }
  return res.json();
}

export async function markStockNotificationAsNotified(id: string): Promise<void> {
  const res = await apiFetch(`/stock-notifications/${id}/notify`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error("Erro ao marcar como notificado");
  }
}

export async function deleteStockNotification(id: string): Promise<void> {
  const res = await apiFetch(`/stock-notifications/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Erro ao remover solicitação");
  }
}
