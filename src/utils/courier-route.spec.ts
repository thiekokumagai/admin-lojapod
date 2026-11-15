import { describe, expect, it } from "vitest";
import { affectsCourierRoutes, analyzeRoute, shouldShowCancelledOnlyRoute } from "./courier-route";

const orders = (...statuses: (string | undefined)[]) => statuses.map((status) => ({ status }));

describe("analyzeRoute", () => {
  it("sem lista de pedidos (ou fora dos carregados): desconhecido, não decide e não deixa excluir", () => {
    for (const input of [undefined, null, []]) {
      const a = analyzeRoute(input);
      expect(a).toEqual({ known: false, allCancelled: false, started: false, canDelete: false });
      expect(shouldShowCancelledOnlyRoute(a)).toBe(false);
    }
  });

  it("todos cancelados: mostra o cartão só de cancelados e permite excluir", () => {
    const a = analyzeRoute(orders("CANCELLED", "CANCELLED"));
    expect(a).toMatchObject({ known: true, allCancelled: true, started: false, canDelete: true });
    expect(shouldShowCancelledOnlyRoute(a)).toBe(true);
  });

  it("cancelado + DISPATCHED (motoboy já saiu): sem cartão órfão e sem excluir", () => {
    const a = analyzeRoute(orders("CANCELLED", "DISPATCHED"));
    expect(a).toMatchObject({ allCancelled: false, started: true, canDelete: false });
    expect(shouldShowCancelledOnlyRoute(a)).toBe(false);
  });

  it("cancelado + COMPLETED (já entregue): sem cartão órfão e sem excluir", () => {
    const a = analyzeRoute(orders("CANCELLED", "COMPLETED", "PENDING"));
    expect(a).toMatchObject({ allCancelled: false, started: true, canDelete: false });
    expect(shouldShowCancelledOnlyRoute(a)).toBe(false);
  });

  it("rota com pedido PENDING/CONFIRMED NÃO tem Excluir no mapa (só rota 100% cancelada)", () => {
    expect(analyzeRoute(orders("PENDING", "CONFIRMED"))).toMatchObject({ started: false, allCancelled: false, canDelete: false });
    const withCancelled = analyzeRoute(orders("CONFIRMED", "CANCELLED"));
    expect(withCancelled).toMatchObject({ allCancelled: false, started: false, canDelete: false });
    expect(shouldShowCancelledOnlyRoute(withCancelled)).toBe(false);
  });

  it("status desconhecido ou ausente conta como já saiu (na dúvida, bloqueia)", () => {
    expect(analyzeRoute(orders("ALGO_NOVO"))).toMatchObject({ started: true, canDelete: false });
    expect(analyzeRoute(orders(undefined, "CANCELLED"))).toMatchObject({ started: true, canDelete: false });
  });
});

describe("affectsCourierRoutes (quando o mapa precisa rebuscar as rotas)", () => {
  it("pedido com rota, ou aviso de rota criada/atualizada/excluída: sim", () => {
    expect(affectsCourierRoutes({ id: "o1", courierTransactionId: "tx1" })).toBe(true);
    for (const id of ["route_updated", "route_deleted"]) expect(affectsCourierRoutes({ id })).toBe(true);
  });

  it("pedido sem rota (ou aviso vazio): não rebusca", () => {
    expect(affectsCourierRoutes({ id: "o1", courierTransactionId: null })).toBe(false);
    expect(affectsCourierRoutes({ id: "o1" })).toBe(false);
    expect(affectsCourierRoutes(undefined)).toBe(false);
    expect(affectsCourierRoutes(null)).toBe(false);
  });
});
