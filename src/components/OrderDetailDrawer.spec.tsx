import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OrderDetailDrawer from "./OrderDetailDrawer";
import React from "react";
import { useOrderDetails } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";

// Mock hooks
vi.mock("@/hooks/useOrders", () => ({
  useOrderDetails: vi.fn(() => ({ data: null, isLoading: false })),
  useCancelOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useReceiveOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRevertReceiveOrder: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateOrderStatus: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <OrderDetailDrawer orderId={null} isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should display order details when opened", () => {
    vi.mocked(useOrderDetails).mockReturnValue({ data: mockOrder as any, isLoading: false });
    vi.mocked(useSettings).mockReturnValue({ data: mockSettings as any });

    render(
      <OrderDetailDrawer orderId="order-1" isOpen={true} onClose={() => {}} />
    );

    // Verify order customer details are displayed
    expect(screen.getByText("Pedido #1234")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
  });
});
