import type { OrderStatus } from "@/types/order";

// Mesmo texto que a API devolve ao recusar o cancelamento de um pedido entregue.
export const CANNOT_CANCEL_COMPLETED_ORDER_MESSAGE =
  "Este pedido já foi entregue e não pode ser cancelado.";

/** Pedido entregue não pode mais ser cancelado (a API também recusa). */
export function isOrderCancelBlocked(status?: OrderStatus | string | null): boolean {
  return status === "COMPLETED";
}
