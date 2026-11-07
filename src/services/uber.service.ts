import { apiFetch } from "./api";

export interface UberDirectStatusResponse {
  enabled: boolean;
  autoDispatch: boolean;
  environment: string;
  hasCredentials: boolean;
  batchSize: number;
  maxAngleDelta: number;
}

export async function getUberDirectStatus(): Promise<UberDirectStatusResponse> {
  const response = await apiFetch(`/uber/status`);
  return response.json();
}

export async function dispatchSingleOrderUber(orderId: string): Promise<{
  success: boolean;
  deliveryId: string;
  trackingUrl: string;
  status: string;
}> {
  const response = await apiFetch(`/uber/orders/${orderId}/dispatch`, {
    method: "POST",
  });
  return response.json();
}

export async function dispatchUberBatchedRoutes(orderIds?: string[]): Promise<{
  message: string;
  results: Array<{
    success: boolean;
    deliveryId?: string;
    trackingUrl?: string;
    orderNumbers?: number[];
    error?: string;
  }>;
}> {
  const response = await apiFetch(`/uber/dispatch-routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderIds }),
  });
  return response.json();
}


export async function testUberAuth(): Promise<{
  ok: boolean;
  environment: string;
  message?: string;
  error?: string;
}> {
  const response = await apiFetch(`/uber/test-auth`);
  return response.json();
}

export async function refreshUberDeliveryStatus(orderId: string): Promise<{
  status: string;
  trackingUrl?: string | null;
  fee?: number | null;
}> {
  const response = await apiFetch(`/uber/orders/${orderId}/status`);
  return response.json();
}
