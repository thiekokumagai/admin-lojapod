import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReceiveOrder } from "./useOrders";
import { receiveOrder } from "@/services/order.service";

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

describe("useReceiveOrder: depois de receber, as listas se atualizam (inclusive a do cliente)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalida pedidos, o pedido, o resumo do caixa e os detalhes do cliente (['customers', id])", async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    vi.mocked(receiveOrder).mockResolvedValue({ id: "o1" } as never);

    const { result } = renderHook(() => useReceiveOrder(), { wrapper });
    result.current.mutate({ id: "o1", payload: { totalReceived: 60 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = spy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown[] }).queryKey));
    expect(keys).toEqual(expect.arrayContaining([
      JSON.stringify(["orders"]),
      JSON.stringify(["orders", "o1"]),
      JSON.stringify(["cash-register-summary"]),
      JSON.stringify(["customers"]), // prefixo de ["customers", id]: refaz a lista de pedidos do cliente
    ]));
  });

  it("a invalidação de ['customers'] alcança os detalhes do cliente aberto", async () => {
    const client = new QueryClient();
    client.setQueryData(["customers", "cust-1"], { id: "cust-1", orders: [{ id: "o1", paymentStatus: "PENDING" }] });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    vi.mocked(receiveOrder).mockResolvedValue({ id: "o1" } as never);

    const { result } = renderHook(() => useReceiveOrder(), { wrapper });
    result.current.mutate({ id: "o1", payload: {} });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(["customers", "cust-1"])?.isInvalidated).toBe(true);
  });
});
