import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MercadoPagoSettingsForm } from "./MercadoPagoSettingsForm";

// Nada de API: hooks de configurações e toast são mocks.
const toast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({ toast: (args: unknown) => toast(args) }));
vi.mock("@/lib/auth", () => ({
  getAuthSession: () => ({ user: { storeId: "store-1" } }),
  getUserRole: () => "ADMIN",
}));

const mutateAsync = vi.fn();
let currentSettings: unknown;
vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: currentSettings, isLoading: false }),
  useUpdateSettings: () => ({ mutateAsync, isPending: false }),
}));

const savedFromServer = {
  paymentGateways: {
    infinitepay: { enabled: false },
    mercadopago: {
      enabled: true,
      acceptPix: true,
      acceptCreditCard: true,
      publicKey: "TEST-public",
      accessToken: "APP_USR-token-salvo",
      webhookSecret: "whsec_salva",
      maxInstallments: 6,
      pixExpirationMinutes: 30,
      accessTokenSet: true,
      webhookSecretSet: true,
    },
  },
};

beforeEach(() => {
  toast.mockClear();
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue({});
  currentSettings = savedFromServer;
});

describe("MercadoPagoSettingsForm", () => {
  it("carrega com os campos de segredo preenchidos com os valores salvos e ocultos por padrão", () => {
    render(<MercadoPagoSettingsForm />);
    const token = screen.getByLabelText(/^Access Token/) as HTMLInputElement;
    const secret = screen.getByLabelText(/^Chave secreta do webhook/) as HTMLInputElement;
    expect(token.value).toBe("APP_USR-token-salvo");
    expect(token.type).toBe("password");
    expect(secret.value).toBe("whsec_salva");
    expect(secret.type).toBe("password");
    expect((screen.getByLabelText(/Public Key/) as HTMLInputElement).value).toBe("TEST-public");
  });

  it("salvar sem alterar token/segredo envia os valores salvos e preserva os outros gateways", async () => {
    render(<MercadoPagoSettingsForm />);
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const sent = mutateAsync.mock.calls[0][0].paymentGateways;
    expect(sent.infinitepay).toEqual({ enabled: false });
    expect(sent.mercadopago).toMatchObject({
      enabled: true,
      acceptPix: true,
      acceptCreditCard: true,
      publicKey: "TEST-public",
      accessToken: "APP_USR-token-salvo",
      webhookSecret: "whsec_salva",
      maxInstallments: 6,
    });
  });

  it("token novo digitado é enviado e o campo permanece preenchido com o novo valor", async () => {
    render(<MercadoPagoSettingsForm />);
    const token = screen.getByLabelText(/^Access Token/) as HTMLInputElement;
    fireEvent.change(token, { target: { value: "  TEST-novo-token  " } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].paymentGateways.mercadopago.accessToken).toBe("TEST-novo-token");
    expect(token.value).toBe("  TEST-novo-token  ");
  });

  it("remover o token salvo envia null ao salvar", async () => {
    render(<MercadoPagoSettingsForm />);
    fireEvent.click(screen.getByRole("button", { name: "Remover o token salvo" }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].paymentGateways.mercadopago.accessToken).toBeNull();
  });

  it("parcelas só de 1x a 12x", () => {
    render(<MercadoPagoSettingsForm />);
    const select = screen.getByLabelText(/Parcelas máximas/) as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => Number(o.value));
    expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("não deixa ligar sem public key, sem token inicial ou sem nenhuma forma de pagamento", async () => {
    currentSettings = { paymentGateways: { mercadopago: { enabled: true, acceptPix: true, acceptCreditCard: true, publicKey: "" } } };
    const { unmount } = render(<MercadoPagoSettingsForm />);
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));
    expect(toast.mock.calls[0][0].description).toContain("Public Key");

    fireEvent.change(screen.getByLabelText(/Public Key/), { target: { value: "TEST-public" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));
    expect(toast.mock.calls[1][0].description).toContain("Access Token");

    fireEvent.change(screen.getByLabelText(/^Access Token/), { target: { value: "TEST-token" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));
    expect(toast.mock.calls[2][0].description).toContain("webhook");

    fireEvent.change(screen.getByLabelText(/^Chave secreta do webhook/), { target: { value: "segredo" } });
    fireEvent.click(screen.getByLabelText(/Aceitar Pix/));
    fireEvent.click(screen.getByLabelText(/Aceitar cartão/));
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));
    expect(toast.mock.calls[3][0].description).toContain("Pix ou cartão");

    expect(mutateAsync).not.toHaveBeenCalled();
    unmount();
  });

  it("mostra a URL do webhook com o storeId da loja", () => {
    render(<MercadoPagoSettingsForm />);
    expect(screen.getByText(/\/payments\/webhook\/mercadopago\?storeId=store-1/)).toBeInTheDocument();
  });
});
