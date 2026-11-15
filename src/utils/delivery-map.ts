/**
 * Regras do mapa de entregas que não dependem do Google Maps (para ficarem testáveis):
 * quais pedidos são paradas, como os marcadores nascem da lista ATUAL de pedidos, e o que sai das
 * rotas em montagem / seleção quando um pedido deixa de estar pendente (cancelado, enviado, retirada...).
 */

export interface Coords {
  lat: number;
  lng: number;
}

interface OrderLike {
  id: string;
  status?: string | null;
  deliveryModality?: string | null;
}

/** Parada do mapa: pedido de entrega ainda pendente ou separado. */
export function isActiveDeliveryOrder(order: Pick<OrderLike, "status" | "deliveryModality">): boolean {
  return (order.status === "PENDING" || order.status === "CONFIRMED") && order.deliveryModality !== "STORE_PICKUP";
}

/**
 * Marcadores = pedidos ativos AGORA com as coordenadas já descobertas.
 * Sai da lista atual de pedidos, então um pedido cancelado some na hora, sem esperar a geocodificação
 * (que é lenta e antes só rodava quando ainda sobrava algum pedido).
 */
export function buildMarkers<T extends { id: string }>(activeOrders: T[], coords: Record<string, Coords>): (T & Coords)[] {
  return activeOrders.flatMap((order) => (coords[order.id] ? [{ ...order, ...coords[order.id] }] : []));
}

/**
 * Pedidos que a lista atual mostra e que NÃO são mais parada (cancelado, enviado, concluído, retirada).
 * Só entram os pedidos conhecidos: um pedido que simplesmente não veio na página carregada (a lista tem limite)
 * não conta como removido, para não tirar uma parada válida de uma rota em montagem.
 */
export function inactiveOrderIds(allOrders: OrderLike[] | undefined | null): Set<string> {
  const ids = new Set<string>();
  (allOrders ?? []).forEach((o) => {
    if (!isActiveDeliveryOrder(o)) ids.add(o.id);
  });
  return ids;
}

/** Tira ids do conjunto; devolve o MESMO conjunto se nada mudou (evita renderização à toa). */
export function pruneIdSet(ids: Set<string>, removed: Set<string>): Set<string> {
  if (removed.size === 0) return ids;
  let changed = false;
  const next = new Set<string>();
  ids.forEach((id) => {
    if (removed.has(id)) changed = true;
    else next.add(id);
  });
  return changed ? next : ids;
}

interface RouteLike {
  id: number;
  optimizedOrders: { id: string; orderNumber?: number }[];
}

export interface PruneRoutesResult<R extends RouteLike> {
  routes: R[];
  changed: boolean;
  /** Paradas que saíram, para avisar o usuário. */
  removedStops: { routeId: number; orderId: string; orderNumber?: number }[];
  /** Rotas que continuam existindo mas perderam parada: o trajeto (Directions) precisa ser recalculado. */
  changedRouteIds: number[];
}

/** Remove das rotas em montagem as paradas cujo pedido deixou de ser parada. Rota que fica vazia some. */
export function pruneRoutes<R extends RouteLike>(routes: R[], removedIds: Set<string>): PruneRoutesResult<R> {
  const removedStops: PruneRoutesResult<R>["removedStops"] = [];
  const changedRouteIds: number[] = [];
  const next: R[] = [];

  routes.forEach((route) => {
    const kept = route.optimizedOrders.filter((o) => !removedIds.has(o.id));
    if (kept.length === route.optimizedOrders.length) {
      next.push(route);
      return;
    }
    route.optimizedOrders
      .filter((o) => removedIds.has(o.id))
      .forEach((o) => removedStops.push({ routeId: route.id, orderId: o.id, orderNumber: o.orderNumber }));
    if (kept.length > 0) {
      next.push({ ...route, optimizedOrders: kept });
      changedRouteIds.push(route.id);
    }
  });

  const changed = removedStops.length > 0;
  return { routes: changed ? next : routes, changed, removedStops, changedRouteIds };
}

/**
 * Porteiro de atualização: libera no máximo uma rebusca por intervalo. Usado quando a aba volta ao foco
 * (visibilitychange e focus costumam disparar juntos).
 */
export function makeRefreshGate(minIntervalMs: number, now: () => number = Date.now): () => boolean {
  let last = -Infinity;
  return () => {
    const t = now();
    if (t - last < minIntervalMs) return false;
    last = t;
    return true;
  };
}
