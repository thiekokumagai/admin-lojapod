import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCancelOrder, useUpdateOrderStatus } from "./useOrders";
import { cancelOrder, updateOrderStatus } from "@/services/order.service";
import { showCourierImpact } from "@/lib/courier-impact-store";
import type { CourierImpact } from "@/types/courier-impact";

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

const impact: CourierImpact = {
  kind: "CANCELLED",
  transactionId: "tx1",
  courierId: "c1",
  courierName: "Gui",
  orderNumber: 101,
  amount: 50,
  activeOrdersBefore: 3,
  shareAmount: 16.67,
  suggestedAmount: 33.33,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>
);

describe("cancelar/reativar pedido de rota abre o modal da taxa do motoboy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancelar pelo botão (drawer / detalhe do pedido)", async () => {
    vi.mocked(cancelOrder).mockResolvedValue({ id: "o1", courierImpact: impact } as never);
    const { result } = renderHook(() => useCancelOrder(), { wrapper });
    result.current.mutate("o1");
    await waitFor(() => expect(showCourierImpact).toHaveBeenCalledWith(impact));
  });

  it("cancelar ou reativar pelo seletor de status / kanban", async () => {
    vi.mocked(updateOrderStatus).mockResolvedValue({ id: "o1", courierImpact: { ...impact, kind: "REACTIVATED" } } as never);
    const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper });
    result.current.mutate({ id: "o1", payload: { status: "PENDING" } });
    await waitFor(() => expect(showCourierImpact).toHaveBeenCalledWith(expect.objectContaining({ kind: "REACTIVATED" })));
  });

  it("pedido fora de rota (courierImpact nulo ou ausente): nada abre", async () => {
    vi.mocked(cancelOrder).mockResolvedValue({ id: "o1", courierImpact: null } as never);
    const { result } = renderHook(() => useCancelOrder(), { wrapper });
    result.current.mutate("o1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(showCourierImpact).toHaveBeenCalledWith(null);
  });
});
