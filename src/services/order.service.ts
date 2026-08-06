import { apiFetch } from "./api";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";

export interface PaginatedOrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getOrders(
  search?: string, 
  status?: string, 
  startDate?: string, 
  endDate?: string,
  page?: number,
  limit?: number,
  paymentStatus?: string
): Promise<PaginatedOrdersResponse> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status && status !== "ALL") params.append("status", status);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (page) params.append("page", page.toString());
  if (limit) params.append("limit", limit.toString());
  if (paymentStatus && paymentStatus !== "ALL") params.append("paymentStatus", paymentStatus);


  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/orders${query}`);
  return response.json();
}

export async function createOrder(payload: any): Promise<Order> {
  const response = await apiFetch(`/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}


export async function updateOrder(id: string, payload: any): Promise<Order> {
  const response = await apiFetch(`/orders/${id}/update-full`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function getOrderById(id: string): Promise<Order> {
  const response = await apiFetch(`/orders/${id}`);
  return response.json();
}

export async function cancelOrder(id: string): Promise<Order> {
  const response = await apiFetch(`/orders/${id}/cancel`, {
    method: "POST",
  });
  return response.json();
}

export async function receiveOrder(id: string, payload: {
  paymentMethod?: string;
  paymentType?: string;
  paymentDiscount?: number;
  installmentSurcharge?: number;
  couponDiscount?: number;
  couponFreightDiscount?: number;
  receiptDiscount?: number;
  receiptSurcharge?: number;
  totalReceived: number;
  installments?: number;
  cardFee?: number;
}): Promise<Order> {
  const response = await apiFetch(`/orders/${id}/receive`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function revertReceiveOrder(id: string): Promise<Order> {
  const response = await apiFetch(`/orders/${id}/revert-receive`, {
    method: "POST",
  });
  return response.json();
}

export async function updateOrderStatus(id: string, payload: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}): Promise<Order> {
  const response = await apiFetch(`/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function markOrderPrinted(id: string): Promise<void> {
  await apiFetch(`/orders/${id}/print`, {
    method: "PATCH",
  });
}

export async function reprintOrder(id: string): Promise<void> {
  await apiFetch(`/orders/${id}/reprint`, {
    method: "POST",
  });
}
