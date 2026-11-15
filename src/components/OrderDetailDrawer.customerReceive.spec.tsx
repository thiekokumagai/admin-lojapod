import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OrderDetailDrawer from "./OrderDetailDrawer";
import { useOrderDetails, useReceiveOrder } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";

// Caminho "detalhes do cliente": o drawer abre com readOnly + allowReceive. Tudo mockado: nada chama API nem recebe de verdade.
vi.mock("react-router-dom", () => ({ useNavigate: vi.fn(() => vi.fn()) }));
vi.mock("@/hooks/useOrders", () => ({
  useOrderDetails: vi.fn(),
  useCancelOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useReceiveOrder: vi.fn(),
  useRevertReceiveOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateOrderStatus: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useReprintOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));
vi.mock("@/hooks/useSettings", () => ({ useSettings: vi.fn(() => ({ data: { paymentRules: [] } })) }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: vi.fn(() => ({ toast: vi.fn() })) }));
vi.mock("@/utils/image-url", () => ({ buildImageUrl: (url: string) => url }));
vi.mock("@/services/uber.service", () => ({
  dispatchSingleOrderUber: vi.fn(),
  getUberDirectStatus: vi.fn().mockResolvedValue({ enabled: false, hasCredentials: false }),
  refreshUberDeliveryStatus: vi.fn(),
}));

const baseOrder = {
  id: "order-1",
  orderNumber: 1234,
  customerName: "John Doe",
  customerPhone: "123456789",
  itemsTotal: 50,
  freight: 10,
  totalOrder: 60,
  totalReceived: 0,
  cardFee: 0,
  paymentType: "entrega",
  paymentMethod: "Dinheiro",
  street: "Rua A",
  number: "123",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  cep: "01000-000",
  complement: "",
  status: "CONFIRMED",
  paymentStatus: "PENDING",
  deliveryModality: "DELIVERY",
  installments: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [{ id: "item-1", productId: "p1", productName: "Product A", price: 25, quantity: 2, variation: "Default" }],
};

const renderDrawer = (props: { readOnly?: boolean; allowReceive?: boolean } = {}, onClose = vi.fn()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OrderDetailDrawer orderId="order-1" isOpen onClose={onClose} {...props} />
    </QueryClientProvider>,
  );

const showOrder = (over: Record<string, unknown> = {}) =>
  vi.mocked(useOrderDetails).mockReturnValue({ data: { ...baseOrder, ...over } as never, isLoading: false } as never);

describe("OrderDetailDrawer aberto a partir dos detalhes do cliente (readOnly + allowReceive)", () => {
  const receive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    receive.mockResolvedValue({});
    vi.mocked(useReceiveOrder).mockReturnValue({ mutateAsync: receive, isPending: false } as never);
    vi.mocked(useSettings).mockReturnValue({ data: { paymentRules: [] } } as never);
    showOrder();
  });

  it("pedido não pago: mostra 'Receber Pagamento' (era o bug: o botão não existia em readOnly)", () => {
    renderDrawer({ readOnly: true, allowReceive: true });
    expect(screen.getByRole("button", { name: "Receber Pagamento" })).toBeInTheDocument();
  });

  it("só libera o receber: continua sem Cancelar Pedido nem Cancelar Recebimento", () => {
    renderDrawer({ readOnly: true, allowReceive: true });
    expect(screen.queryByRole("button", { name: "Cancelar Pedido" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar Recebimento" })).not.toBeInTheDocument();
  });

  it("receber usa o MESMO fluxo da tela de pedidos: mesma mutação, mesma carga e fecha o drawer", async () => {
    const onClose = vi.fn();
    renderDrawer({ readOnly: true, allowReceive: true }, onClose);

    fireEvent.click(screen.getByRole("button", { name: "Receber Pagamento" }));

    await waitFor(() => expect(receive).toHaveBeenCalledTimes(1));
    const { id, payload } = receive.mock.calls[0][0];
    expect(id).toBe("order-1");
    expect(payload).toMatchObject({ paymentMethod: "cash", paymentType: "entrega", totalReceived: 60, installments: 1 });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("os campos de recebimento ficam editáveis (total recebido)", () => {
    renderDrawer({ readOnly: true, allowReceive: true });
    expect(screen.getByDisplayValue("60,00")).toBeEnabled();
  });

  it("somente leitura sem allowReceive (comportamento antigo): sem botão de receber", () => {
    renderDrawer({ readOnly: true });
    expect(screen.queryByRole("button", { name: "Receber Pagamento" })).not.toBeInTheDocument();
  });

  it("pedido já pago: não aparece Receber Pagamento", () => {
    showOrder({ paymentStatus: "PAID", totalReceived: 60 });
    renderDrawer({ readOnly: true, allowReceive: true });
    expect(screen.queryByRole("button", { name: "Receber Pagamento" })).not.toBeInTheDocument();
  });

  it("pedido cancelado: não aparece Receber Pagamento", () => {
    showOrder({ status: "CANCELLED" });
    renderDrawer({ readOnly: true, allowReceive: true });
    expect(screen.queryByRole("button", { name: "Receber Pagamento" })).not.toBeInTheDocument();
  });

  it("tela de pedidos (sem readOnly) segue igual: Receber e Cancelar Pedido, um botão de receber só", () => {
    renderDrawer({});
    expect(screen.getAllByRole("button", { name: "Receber Pagamento" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Cancelar Pedido" })).toBeInTheDocument();
  });
});
