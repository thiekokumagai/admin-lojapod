import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MercadoPagoSettingsForm } from "./MercadoPagoSettingsForm";
import { PaymentGatewaysSettingsForm } from "./PaymentGatewaysSettingsForm";

// Nada de API: configurações, toast e teste de conexão são mocks.
vi.mock("@/components/ui/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getAuthSession: () => ({ user: { storeId: "store-1" } }),
  getUserRole: () => "ADMIN",
}));
vi.mock("@/services/payments.service", () => ({ testInfinitePayConnection: vi.fn() }));

const mutateAsync = vi.fn();
let currentSettings: unknown;
vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ data: currentSettings, isLoading: false }),
  useUpdateSettings: () => ({ mutateAsync, isPending: false }),
}));

// O que a API devolve para ADMIN: os segredos reais preenchidos, flag isSet e os 4 últimos caracteres
const fromServer = {
  paymentGateways: {
    infinitepay: {
      enabled: true,
      acceptCreditCard: true,
      handle: "loja-x",
      assuredInstallments: 1,
      apiKey: "inchk_cdef",
      apiKeySet: true,
      apiKeyLast4: "cdef",
    },
    mercadopago: {
      enabled: true,
      acceptPix: true,
      acceptCreditCard: true,
      publicKey: "TEST-public",
      accessToken: "APP_USR-9876",
      webhookSecret: "whsec_7777",
      maxInstallments: 3,
      pixExpirationMinutes: 30,
      accessTokenSet: true,
      accessTokenLast4: "9876",
      webhookSecretSet: true,
      webhookSecretLast4: "7777",
    },
  },
};

beforeEach(() => {
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue({});
  currentSettings = fromServer;
});

const sentGateways = () => mutateAsync.mock.calls[0][0].paymentGateways;

describe("Mercado Pago: olho e segredo salvo", () => {
  it("os campos de segredo começam preenchidos com o valor salvo e ocultos; o olho revela o valor salvo em texto claro", () => {
    render(<MercadoPagoSettingsForm />);
    const token = screen.getByLabelText(/^Access Token/) as HTMLInputElement;
    const secret = screen.getByLabelText(/^Chave secreta do webhook/) as HTMLInputElement;
    expect(token.type).toBe("password");
    expect(token.value).toBe("APP_USR-9876");
    expect(secret.type).toBe("password");
    expect(secret.value).toBe("whsec_7777");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar Access Token" }));
    expect(token.type).toBe("text");
    expect(token.value).toBe("APP_USR-9876");
    expect(secret.type).toBe("password"); // o olho é de cada campo

    fireEvent.click(screen.getByRole("button", { name: "Mostrar chave secreta do webhook" }));
    expect(secret.type).toBe("text");
    expect(secret.value).toBe("whsec_7777");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar Access Token" }));
    expect(token.type).toBe("password");
  });

  it('mostra "salvo ••••, termina em XXXX" com os 4 últimos devolvidos pela API', () => {
    render(<MercadoPagoSettingsForm />);
    expect(screen.getByTestId("mp-access-token-hint")).toHaveTextContent("Token salvo ••••");
    expect(screen.getByTestId("mp-access-token-hint")).toHaveTextContent("termina em 9876");
    expect(screen.getByTestId("mp-webhook-secret-hint")).toHaveTextContent("termina em 7777");
    expect(screen.getByTestId("mp-access-token-hint")).toHaveTextContent("Deixe em branco para manter");
  });

  it("segredo curto salvo: avisa que está salvo, sem sufixo", () => {
    currentSettings = {
      paymentGateways: { mercadopago: { ...fromServer.paymentGateways.mercadopago, accessTokenLast4: null } },
    };
    render(<MercadoPagoSettingsForm />);
    const hint = screen.getByTestId("mp-access-token-hint");
    expect(hint).toHaveTextContent("Token salvo ••••");
    expect(hint).not.toHaveTextContent("termina em");
  });

  it("salvar sem alterar manda os segredos salvos (o servidor mantém)", async () => {
    render(<MercadoPagoSettingsForm />);
    fireEvent.click(screen.getByRole("button", { name: /Salvar Mercado Pago/ }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(sentGateways().mercadopago).toMatchObject({ accessToken: "APP_USR-9876", webhookSecret: "whsec_7777" });
  });
});

describe("InfinitePay: olho e chave salva", () => {
  it("o campo vem preenchido com a chave salva e o olho alterna para texto claro", () => {
    render(<PaymentGatewaysSettingsForm />);
    const key = screen.getByLabelText(/^API Key \/ Access Token/) as HTMLInputElement;
    expect(key.value).toBe("inchk_cdef");
    expect(key.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar API Key da InfinitePay" }));
    expect(key.type).toBe("text");
    expect(key.value).toBe("inchk_cdef");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar API Key da InfinitePay" }));
    expect(key.type).toBe("password");
  });

  it("mostra o passo a passo das credenciais ao abrir", () => {
    render(<PaymentGatewaysSettingsForm />);
    fireEvent.click(screen.getByText("Como pegar as credenciais da InfinitePay"));
    expect(screen.getByText(/Checkout Integrado/, { selector: "li" })).toBeInTheDocument();
  });

  it('indica "chave salva, termina em cdef"', () => {
    render(<PaymentGatewaysSettingsForm />);
    const hint = screen.getByTestId("ip-api-key-hint");
    expect(hint).toHaveTextContent("Chave salva ••••");
    expect(hint).toHaveTextContent("termina em cdef");
  });

  it("salvar sem alterar manda apiKey salva e preserva o bloco do Mercado Pago", async () => {
    render(<PaymentGatewaysSettingsForm />);
    fireEvent.click(screen.getByRole("button", { name: /Salvar Integração/ }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());

    const sent = sentGateways();
    expect(sent.infinitepay).toMatchObject({ enabled: true, handle: "loja-x", apiKey: "inchk_cdef" });
    expect(sent.mercadopago).toBeDefined();
  });

  it("chave nova digitada é enviada", async () => {
    render(<PaymentGatewaysSettingsForm />);
    fireEvent.change(screen.getByLabelText(/^API Key \/ Access Token/), { target: { value: "  inchk_nova  " } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Integração/ }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(sentGateways().infinitepay.apiKey).toBe("inchk_nova");
  });

  it('"Remover a chave salva" manda apiKey nulo e dá para desistir', async () => {
    render(<PaymentGatewaysSettingsForm />);
    fireEvent.click(screen.getByRole("button", { name: "Remover a chave salva" }));
    expect(screen.getByTestId("ip-api-key-hint")).toHaveTextContent("será removida");

    fireEvent.click(screen.getByRole("button", { name: "Manter a chave salva" }));
    expect(screen.getByTestId("ip-api-key-hint")).toHaveTextContent("Chave salva");

    fireEvent.click(screen.getByRole("button", { name: "Remover a chave salva" }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar Integração/ }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(sentGateways().infinitepay.apiKey).toBeNull();
  });

  it("sem chave salva não aparece a opção de remover", () => {
    currentSettings = {
      paymentGateways: { infinitepay: { enabled: true, acceptCreditCard: true, handle: "x", apiKeySet: false, apiKeyLast4: null } },
    };
    render(<PaymentGatewaysSettingsForm />);
    expect(screen.queryByRole("button", { name: "Remover a chave salva" })).toBeNull();
  });
});

describe("Credenciais de pagamento sem preenchimento automático do navegador", () => {
  // "off" é ignorado pelo Chrome em campo de senha; "one-time-code" impede senha/usuário salvos.
  const expectNoAutofill = (el: HTMLElement) => {
    expect(el).toHaveAttribute("autocomplete", "one-time-code");
    expect(el).toHaveAttribute("data-1p-ignore", "true");
    expect(el).toHaveAttribute("data-lpignore", "true");
    expect(el).toHaveAttribute("data-bwignore", "true");
    expect(el).toHaveAttribute("data-form-type", "other");
  };

  it("InfinitePay: InfiniteTag e API Key", () => {
    render(<PaymentGatewaysSettingsForm />);
    expectNoAutofill(screen.getByPlaceholderText("Ex: minha_loja"));
    expectNoAutofill(screen.getByLabelText(/^API Key \/ Access Token/));
  });

  it("Mercado Pago: Public Key, Access Token e chave secreta do webhook", () => {
    render(<MercadoPagoSettingsForm />);
    expectNoAutofill(screen.getByLabelText(/Public Key/));
    expectNoAutofill(screen.getByLabelText(/^Access Token/));
    expectNoAutofill(screen.getByLabelText(/^Chave secreta do webhook/));
  });

  describe("navegador com máscara CSS (Chrome, Edge, Safari)", () => {
    // O Chrome só oferece senha/usuário salvos quando há type="password" na página.
    beforeEach(() => {
      vi.stubGlobal("CSS", { supports: () => true });
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("Mercado Pago: nenhum campo de senha; segredos mascarados por CSS e o olho ainda funciona", () => {
      const { container } = render(<MercadoPagoSettingsForm />);
      expect(container.querySelector('input[type="password"]')).toBeNull();
      const token = screen.getByLabelText(/^Access Token/) as HTMLInputElement;
      expect(token.type).toBe("text");
      expect(token).toHaveAttribute("data-secret-mask", "true");
      fireEvent.click(screen.getByRole("button", { name: "Mostrar Access Token" }));
      expect(token).not.toHaveAttribute("data-secret-mask");
      expect(token.type).toBe("text");
      expect(token.value).toBe("APP_USR-9876");
    });

    it("InfinitePay: API Key sem type=password e mascarada", () => {
      const { container } = render(<PaymentGatewaysSettingsForm />);
      expect(container.querySelector('input[type="password"]')).toBeNull();
      const key = screen.getByLabelText(/^API Key \/ Access Token/) as HTMLInputElement;
      expect(key.type).toBe("text");
      expect(key).toHaveAttribute("data-secret-mask", "true");
    });
  });
});
