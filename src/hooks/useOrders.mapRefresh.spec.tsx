import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCancelOrder, useOrders, useUpdateOrderStatus } from "./useOrders";
import { cancelOrder, getOrders, updateOrderStatus } from "@/services/order.service";
import { isActiveDeliveryOrder } from "@/utils/delivery-map";

vi.mock("@/services/order.service", () => ({
  getOrders: vi.fn(),
  getOrderById: vi.fn(),
  cancelOrder: vi.fn(),
  receiveOrder: vi.fn(),
  revertReceiveOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  markOrderPrinted: vi.fn(),
  reprintOrder: vi.fn(),
  updateOrder: vi.fn(),
}));
vi.mock("@/lib/courier-impact-store", () => ({ showCourierImpact: vi.fn() }));

// A mesma chamada que o mapa de entregas faz: useOrders("", "ALL", "", "", 1, 200)
const useMapOrders = () => useOrders("", "ALL", "", "", 1, 200);

const orders = (statusOfB = "PENDING") => ({
  data: [
    { id: "a", orderNumber: 1, status: "PENDING", deliveryModality: "DELIVERY" },
    { id: "b", orderNumber: 2, status: statusOfB, deliveryModality: "DELIVERY" },
  ],
  meta: { total: 2, page: 1, limit: 200, totalPages: 1 },
});

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

type ListData = { data: { id: string; status: string; deliveryModality: string }[] };
const activeIds = (data: ListData) => data.data.filter(isActiveDeliveryOrder).map((o) => o.id);

describe("cancelar na própria aba atualiza a lista de pedidos que o mapa usa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrders).mockResolvedValue(orders() as never);
  });

  it("seletor/kanban: a lista do mapa muda na hora (atualização otimista), antes da API responder", async () => {
    const { client, wrapper } = setup();
    const map = renderHook(() => useMapOrders(), { wrapper });
    await waitFor(() => expect(map.result.current.data).toBeDefined());
    expect(activeIds(map.result.current.data)).toEqual(["a", "b"]);

    // a API demora: o que vale aqui é o que o admin vê enquanto isso
    vi.mocked(updateOrderStatus).mockReturnValue(new Promise(() => {}) as never);
    const status = renderHook(() => useUpdateOrderStatus(), { wrapper });
    status.result.current.mutate({ id: "b", payload: { status: "CANCELLED" } });

    await waitFor(() => expect(activeIds(map.result.current.data)).toEqual(["a"]));
    expect(client.getQueryCache().findAll({ queryKey: ["orders"] }).length).toBeGreaterThan(0);
  });

  it("botão Cancelar (drawer/detalhe): depois do sucesso a query do mapa é invalidada e rebuscada", async () => {
    const { wrapper } = setup();
    const map = renderHook(() => useMapOrders(), { wrapper });
    await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(1));

    vi.mocked(cancelOrder).mockResolvedValue({ id: "b", courierImpact: null } as never);
    vi.mocked(getOrders).mockResolvedValue(orders("CANCELLED") as never);
    const cancel = renderHook(() => useCancelOrder(), { wrapper });
    cancel.result.current.mutate("b");

    await waitFor(() => expect(getOrders).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(activeIds(map.result.current.data)).toEqual(["a"]));
  });

  it("pedido cancelado deixa de ser parada em qualquer status que não seja pendente/separado", () => {
    for (const s of ["CANCELLED", "DISPATCHED", "COMPLETED"]) {
      expect(isActiveDeliveryOrder({ status: s, deliveryModality: "DELIVERY" })).toBe(false);
    }
  });
});
