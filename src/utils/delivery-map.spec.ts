import { describe, expect, it } from "vitest";
import {
  buildMarkers,
  inactiveOrderIds,
  isActiveDeliveryOrder,
  makeRefreshGate,
  pruneIdSet,
  pruneRoutes,
} from "./delivery-map";

const order = (id: string, status: string, deliveryModality = "DELIVERY") => ({ id, status, deliveryModality });

describe("isActiveDeliveryOrder", () => {
  it("só entrega pendente ou separada é parada", () => {
    expect(isActiveDeliveryOrder(order("1", "PENDING"))).toBe(true);
    expect(isActiveDeliveryOrder(order("1", "CONFIRMED"))).toBe(true);
    for (const s of ["CANCELLED", "DISPATCHED", "COMPLETED"]) expect(isActiveDeliveryOrder(order("1", s))).toBe(false);
    expect(isActiveDeliveryOrder(order("1", "PENDING", "STORE_PICKUP"))).toBe(false);
  });
});

describe("buildMarkers (marcadores nascem da lista ATUAL de pedidos)", () => {
  const coords = { a: { lat: 1, lng: 2 }, b: { lat: 3, lng: 4 }, c: { lat: 5, lng: 6 } };

  it("pedido cancelado some na hora: já não está na lista de ativos, mesmo com coordenada guardada", () => {
    const active = [{ id: "a", status: "PENDING" }, { id: "c", status: "CONFIRMED" }]; // b foi cancelado
    expect(buildMarkers(active, coords).map((m) => m.id)).toEqual(["a", "c"]);
  });

  it("último pedido cancelado: lista vazia => nenhum marcador (era o bug: nada limpava)", () => {
    expect(buildMarkers([], coords)).toEqual([]);
  });

  it("usa os dados MAIS NOVOS do pedido (ex.: rota atribuída) com as coordenadas guardadas", () => {
    const [m] = buildMarkers([{ id: "a", courierTransactionId: "tx1" }], coords);
    expect(m).toMatchObject({ id: "a", courierTransactionId: "tx1", lat: 1, lng: 2 });
  });

  it("pedido ainda sem coordenada não vira marcador", () => {
    expect(buildMarkers([{ id: "z" }], coords)).toEqual([]);
  });
});

describe("inactiveOrderIds", () => {
  it("lista só pedidos CONHECIDOS que não são mais parada", () => {
    const ids = inactiveOrderIds([
      order("p", "PENDING"),
      order("c", "CANCELLED"),
      order("d", "DISPATCHED"),
      order("r", "PENDING", "STORE_PICKUP"),
    ]);
    expect([...ids].sort()).toEqual(["c", "d", "r"]);
  });

  it("pedido que não veio na página carregada não é tratado como removido", () => {
    expect(inactiveOrderIds([order("p", "PENDING")]).has("fora-da-pagina")).toBe(false);
  });

  it("sem dados: vazio", () => {
    expect(inactiveOrderIds(undefined).size).toBe(0);
    expect(inactiveOrderIds(null).size).toBe(0);
  });
});

describe("pruneIdSet", () => {
  it("tira os removidos da seleção", () => {
    const next = pruneIdSet(new Set(["a", "b", "c"]), new Set(["b"]));
    expect([...next]).toEqual(["a", "c"]);
  });

  it("devolve o mesmo conjunto quando nada muda (sem renderização à toa)", () => {
    const s = new Set(["a"]);
    expect(pruneIdSet(s, new Set(["x"]))).toBe(s);
    expect(pruneIdSet(s, new Set())).toBe(s);
  });
});

describe("pruneRoutes (rota em montagem, ainda não salva)", () => {
  const route = (id: number, ...stops: [string, number][]) => ({
    id,
    returnToStore: false,
    optimizedOrders: stops.map(([sid, orderNumber]) => ({ id: sid, orderNumber })),
  });

  it("pedido cancelado sai da parada; as outras ficam e a rota é marcada para recalcular o trajeto", () => {
    const routes = [route(1, ["a", 101], ["b", 102], ["c", 103])];
    const r = pruneRoutes(routes, new Set(["b"]));
    expect(r.changed).toBe(true);
    expect(r.routes[0].optimizedOrders.map((o) => o.id)).toEqual(["a", "c"]);
    expect(r.removedStops).toEqual([{ routeId: 1, orderId: "b", orderNumber: 102 }]);
    expect(r.changedRouteIds).toEqual([1]);
    expect(r.routes[0].returnToStore).toBe(false); // demais campos da rota preservados
  });

  it("rota que ficou sem nenhuma parada some", () => {
    const r = pruneRoutes([route(1, ["a", 101]), route(2, ["b", 102])], new Set(["a"]));
    expect(r.routes.map((x) => x.id)).toEqual([2]);
    expect(r.changedRouteIds).toEqual([]);
    expect(r.removedStops).toHaveLength(1);
  });

  it("só mexe nas rotas afetadas; as outras seguem a mesma referência", () => {
    const untouched = route(2, ["x", 201]);
    const r = pruneRoutes([route(1, ["a", 101], ["b", 102]), untouched], new Set(["a"]));
    expect(r.routes[1]).toBe(untouched);
    expect(r.changedRouteIds).toEqual([1]);
  });

  it("nada para remover: mesma lista, sem alteração", () => {
    const routes = [route(1, ["a", 101])];
    const r = pruneRoutes(routes, new Set(["zzz"]));
    expect(r.changed).toBe(false);
    expect(r.routes).toBe(routes);
  });
});

describe("makeRefreshGate (aba volta ao foco)", () => {
  it("libera uma rebusca por intervalo (visibilitychange e focus juntos contam uma vez)", () => {
    let t = 1000;
    const gate = makeRefreshGate(3000, () => t);
    expect(gate()).toBe(true);
    t += 50; // focus logo depois do visibilitychange
    expect(gate()).toBe(false);
    t += 3000;
    expect(gate()).toBe(true);
  });
});
