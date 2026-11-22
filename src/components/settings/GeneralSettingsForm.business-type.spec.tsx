import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GeneralSettingsForm } from "./GeneralSettingsForm";

const mockIsSuperAdmin = vi.fn();
const mockMutateAsync = vi.fn();
const mockSettingsData = vi.fn();

vi.mock("@/lib/auth", () => ({
  isSuperAdmin: () => mockIsSuperAdmin(),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    data: mockSettingsData(),
    isLoading: false,
  }),
  useUpdateSettings: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/services/api", () => ({
  apiFetch: vi.fn().mockResolvedValue({
    json: async () => ({}),
  }),
}));

vi.mock("@/services/settings.service", () => ({
  uploadFavicon: vi.fn(),
  uploadSettingsMedia: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

describe("GeneralSettingsForm — Segmento da loja (businessType)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettingsData.mockReturnValue({
      id: "s1",
      storeName: "Restaurante Teste",
      businessType: "FOOD",
      bannerUrls: [],
      phone: "67999999999",
      cep: "79000000",
      street: "Rua 1",
      number: "10",
      neighborhood: "Centro",
      city: "Campo Grande",
      state: "MS",
      hideAddress: false,
      pixEnabled: true,
      payOnDeliveryCash: true,
      payOnDeliveryCardDebit: true,
      payOnDeliveryCardCredit: true,
      payOnDeliveryMealVoucher: false,
      payOnDeliveryFoodVoucher: false,
      paymentRules: [],
    });
  });

  it("admin comum vê seletor de segmento desabilitado e aviso de Super Admin", () => {
    mockIsSuperAdmin.mockReturnValue(false);
    render(<GeneralSettingsForm />);

    const trigger = screen.getByRole("combobox", { name: /Segmento da loja/i });
    expect(trigger).toBeDisabled();
    expect(screen.getByText(/Editável apenas pelo Super Admin/i)).toBeInTheDocument();
  });

  it("super admin abre confirmação ao receber 409 e reenvia com forceDisableCustomizations: true", async () => {
    mockIsSuperAdmin.mockReturnValue(true);

    const conflictErr = Object.assign(new Error("Conflito"), {
      status: 409,
      data: {
        code: "CUSTOMIZABLE_PRODUCTS_EXIST",
        customizableProductsCount: 2,
      },
    });
    mockMutateAsync
      .mockRejectedValueOnce(conflictErr)
      .mockResolvedValueOnce({ businessType: "POD" });

    render(<GeneralSettingsForm />);

    const trigger = screen.getByRole("combobox", { name: /Segmento da loja/i });
    expect(trigger).not.toBeDisabled();

    // Salva e dispara 409 simulado pelo backend
    const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
    fireEvent.click(saveButtons[0]);

    expect(
      await screen.findByText(/Existem 2 produto\(s\) personalizável\(is\)/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Desmarcar e trocar para Vape/i }),
    );

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });
    expect(mockMutateAsync.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        forceDisableCustomizations: true,
      }),
    );
  });

  it("mapeia loja legada ACAI para FOOD (Delivery / Alimentação) no seletor de segmento", async () => {
    mockIsSuperAdmin.mockReturnValue(true);
    mockSettingsData.mockReturnValue({
      storeName: "Açaí Legado",
      businessType: "ACAI",
    });

    render(<GeneralSettingsForm />);

    const trigger = await screen.findByLabelText("Segmento da loja");
    expect(trigger).toHaveTextContent("Delivery / Alimentação");
  });
});
