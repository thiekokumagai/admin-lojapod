import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OrderDetailDrawer from "./OrderDetailDrawer";
import React from "react";
import { useOrderDetails } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";

// Mock React Router
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("@/services/uber.service", () => ({
  dispatchSingleOrderUber: vi.fn(),
  getUberDirectStatus: vi.fn().mockResolvedValue({ enabled: false, hasCredentials: false }),
  refreshUberDeliveryStatus: vi.fn(),
}));

// Mock hooks
vi.mock("@/hooks/useOrders", () => ({
  useOrderDetails: vi.fn(() => ({ data: null, isLoading: false })),
  useCancelOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useReceiveOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRevertReceiveOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateOrderStatus: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useReprintOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: vi.fn(() => ({ data: null })),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Mock buildImageUrl utility
vi.mock("@/utils/image-url", () => ({
  buildImageUrl: (url: string) => url,
}));

describe("OrderDetailDrawer", () => {
  const mockOrder = {
    id: "order-1",
    orderNumber: 1234,
    customerName: "John Doe",
    customerPhone: "123456789",
    itemsTotal: 50.0,
    freight: 10.0,
    discount: 0,
    surcharge: 0,
    totalOrder: 60.0,
    totalReceived: 0,
    cardFee: 0,
    paymentType: "Cartão",
    paymentMethod: "Cartão de Crédito",
    street: "Rua A",
    number: "123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    cep: "01000-000",
    complement: "",
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    installments: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "item-1",
        productId: "p1",
        productName: "Product A",
        price: 25.0,
        quantity: 2,
        variation: "Default",
      },
    ],
  };

  const mockSettings = {
    paymentRules: [
      { paymentMethod: "credit", type: "charge", value: 10, parcelaMin: 1, parcelaMax: 12 },
      { paymentMethod: "pix", type: "discount", value: 5, parcelaMin: 0, parcelaMax: 0 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithClient = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it("should not render when isOpen is false", () => {
    const { container } = renderWithClient(
      <OrderDetailDrawer orderId={null} isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should display order details when opened", () => {
    vi.mocked(useOrderDetails).mockReturnValue({ data: mockOrder as any, isLoading: false });
    vi.mocked(useSettings).mockReturnValue({ data: mockSettings as any });

    renderWithClient(
      <OrderDetailDrawer orderId="order-1" isOpen={true} onClose={() => {}} />
    );

    // Verify order customer details are displayed
    expect(screen.getByText("Pedido #1234")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
  });

  describe("forma de pagamento em português (pedido já pago, campo só de leitura)", () => {
    const formaDePagamento = () => {
      const label = screen.getByText("Forma de pagamento");
      return label.parentElement as HTMLElement;
    };

    it.each([
      ["credit", "Cartão de Crédito"],
      ["Credit", "Cartão de Crédito"],
      ["debit", "Cartão de Débito"],
      ["cash", "Dinheiro"],
      ["Cash", "Dinheiro"],
      ["pix", "Pix"],
      ["meal_voucher", "Vale refeição"],
      ["food_voucher", "Vale alimentação"],
    ])("%s aparece como %s", (method, label) => {
      vi.mocked(useOrderDetails).mockReturnValue({
        data: { ...mockOrder, paymentMethod: method, paymentStatus: "PAID", totalReceived: 60 } as never,
        isLoading: false,
      });
      vi.mocked(useSettings).mockReturnValue({ data: mockSettings as never });

      renderWithClient(<OrderDetailDrawer orderId="order-1" isOpen={true} onClose={() => {}} />);

      expect(formaDePagamento().textContent).toContain(label);
      expect(formaDePagamento().textContent).not.toMatch(/credit|debit|cash|voucher|_/i);
    });

    it("valor desconhecido: texto legível, não o código cru", () => {
      vi.mocked(useOrderDetails).mockReturnValue({
        data: { ...mockOrder, paymentMethod: "gift_card", paymentStatus: "PAID", totalReceived: 60 } as never,
        isLoading: false,
      });
      vi.mocked(useSettings).mockReturnValue({ data: mockSettings as never });

      renderWithClient(<OrderDetailDrawer orderId="order-1" isOpen={true} onClose={() => {}} />);

      expect(formaDePagamento().textContent).toContain("Gift card");
      expect(formaDePagamento().textContent).not.toContain("gift_card");
    });
  });

  describe("tipo de pagamento online pendente (antes do pagamento)", () => {
    it.each([
      ["INFINITEPAY", "Online (InfinitePay)"],
      ["MERCADOPAGO", "Online (Mercado Pago)"],
      [null, "Online"],
    ])("cartão online pendente com gateway %s exibe %s e não 'Na Entrega'", (gateway, expectedLabel) => {
      vi.mocked(useOrderDetails).mockReturnValue({
        data: {
          ...mockOrder,
          paymentType: "online",
          paymentMethod: "credit",
          paymentStatus: "PENDING",
          onlineGateway: gateway,
        } as never,
        isLoading: false,
      });
      vi.mocked(useSettings).mockReturnValue({ data: mockSettings as never });

      renderWithClient(<OrderDetailDrawer orderId="order-1" isOpen={true} onClose={() => {}} />);

      const pagamentoRow = screen.getByText("Pagamento").parentElement as HTMLElement;
      expect(pagamentoRow.textContent).toContain(expectedLabel);
      expect(pagamentoRow.textContent).not.toContain("Na Entrega");
    });
  });
});
