import type { AbandonedCart } from "@/services/abandoned-carts.service";

/**
 * Contadores da página de carrinhos abandonados.
 * - `inList`: todos os carrinhos da lista (chamados ou não).
 * - `toCall`: só os que ainda não foram chamados.
 */
export function summarizeAbandonedCarts(
  carts: Pick<AbandonedCart, "contactedAt" | "totalEstimated">[],
) {
  return {
    inList: carts.length,
    toCall: carts.filter((cart) => !cart.contactedAt).length,
    totalEstimated: carts.reduce((sum, cart) => sum + cart.totalEstimated, 0),
  };
}
