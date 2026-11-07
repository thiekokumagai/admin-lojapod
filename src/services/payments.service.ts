import { apiFetch } from "./api";

export async function testInfinitePayConnection(): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  checkoutUrl?: string;
}> {
  const response = await apiFetch(`/payments/test-infinitepay`, { method: "POST" });
  return response.json();
}
