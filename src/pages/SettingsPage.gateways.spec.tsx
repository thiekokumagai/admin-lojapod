import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentGatewaysSettingsForm } from "@/components/settings/PaymentGatewaysSettingsForm";
import { MercadoPagoSettingsForm } from "@/components/settings/MercadoPagoSettingsForm";

const { getMockRole, setMockRole } = vi.hoisted(() => {
  let role = "ADMIN";
  return {
    getMockRole: () => role,
    setMockRole: (r: string) => {
      role = r;
    },
  };
});

vi.mock("@/lib/auth", () => ({
  getAuthSession: () => ({ user: { storeId: "store-1", role: getMockRole() } }),
  getUserRole: () => getMockRole(),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    data: {
      paymentGateways: {
        infinitepay: { enabled: true },
        mercadopago: { enabled: true, acceptPix: true, publicKey: "pk" },
      },
    },
    isLoading: false,
  }),
  useUpdateSettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/components/ui/use-toast", () => ({ toast: vi.fn() }));

describe("Gateways de pagamento: controle de acesso para funcionário", () => {
  it("funcionário (não-admin): PaymentGatewaysSettingsForm não renderiza", () => {
    setMockRole("USER");
    const { container } = render(<PaymentGatewaysSettingsForm />);
    expect(container.firstChild).toBeNull();
  });

  it("funcionário (não-admin): MercadoPagoSettingsForm não renderiza", () => {
    setMockRole("USER");
    const { container } = render(<MercadoPagoSettingsForm />);
    expect(container.firstChild).toBeNull();
  });

  it("admin: PaymentGatewaysSettingsForm renderiza normalmente", () => {
    setMockRole("ADMIN");
    render(<PaymentGatewaysSettingsForm />);
    expect(screen.getAllByText(/InfinitePay/)[0]).toBeInTheDocument();
  });

  it("admin: MercadoPagoSettingsForm renderiza normalmente", () => {
    setMockRole("ADMIN");
    render(<MercadoPagoSettingsForm />);
    expect(screen.getAllByText(/Mercado Pago/)[0]).toBeInTheDocument();
  });
});
