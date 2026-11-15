/**
 * Regras da rota "Atribuída" no mapa de entregas (DeliveryMapPage).
 *
 * A rota é um lançamento de taxa (FEE) do motoboy com os pedidos ligados a ele. O mapa só carrega
 * PENDING/CONFIRMED (e só os últimos 200 pedidos), então ele NÃO enxerga os pedidos DISPATCHED/COMPLETED
 * da mesma rota. Por isso estas decisões usam a lista COMPLETA de pedidos do lançamento
 * (vinda de GET /couriers/:id), nunca só o que o mapa tem na tela.
 */

const NOT_STARTED = ["PENDING", "CONFIRMED"];

export interface RouteOrderStatus {
  status?: string | null;
}

export interface RouteAnalysis {
  /** Temos a lista completa de pedidos do lançamento. Sem isso, nada é decidido (esconde). */
  known: boolean;
  /** Todos os pedidos do lançamento estão cancelados. */
  allCancelled: boolean;
  /** Algum pedido não cancelado já saiu/foi entregue (DISPATCHED, COMPLETED ou status desconhecido). */
  started: boolean;
  /** Pode excluir o lançamento pelo mapa: só rota 100% cancelada, com a lista completa conhecida. */
  canDelete: boolean;
}

export function analyzeRoute(orders?: RouteOrderStatus[] | null): RouteAnalysis {
  if (!orders || orders.length === 0) {
    return { known: false, allCancelled: false, started: false, canDelete: false };
  }
  const allCancelled = orders.every((o) => o.status === "CANCELLED");
  // Tudo que não é "ainda não saiu" (PENDING/CONFIRMED) nem cancelado conta como motoboy que já saiu ou entregou,
  // inclusive um status que a gente não conhece: na dúvida, não deixa apagar.
  const started = orders.some((o) => o.status !== "CANCELLED" && !NOT_STARTED.includes(o.status ?? ""));
  // Excluir só quando TODOS os pedidos estão cancelados. Rota com pedido PENDING/CONFIRMED não se apaga pelo mapa
  // (cancele os pedidos e ajuste a taxa), e com DISPATCHED/COMPLETED a API também recusa.
  return { known: true, allCancelled, started, canDelete: allCancelled };
}

/**
 * O aviso por socket de um pedido só muda o que o mapa mostra das rotas se o pedido tem rota
 * (courierTransactionId) ou se é o aviso de rota criada/atualizada/excluída (id "route_*").
 */
export function affectsCourierRoutes(order: { id?: unknown; courierTransactionId?: unknown } | null | undefined): boolean {
  if (!order) return false;
  if (order.courierTransactionId) return true;
  return typeof order.id === "string" && order.id.startsWith("route_");
}

/** Rota feita só de cancelados só aparece no mapa quando TODOS os pedidos dela são conhecidos e cancelados. */
export function shouldShowCancelledOnlyRoute(analysis: RouteAnalysis): boolean {
  return analysis.known && analysis.allCancelled;
}
