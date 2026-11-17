import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

// Nada de API: serviço de auth, roteador, cache e toasts são mocks.
const updatePassword = vi.fn();
const clearSession = vi.fn();
vi.mock("@/services/auth.service", () => ({
  updatePassword: (payload: unknown) => updatePassword(payload),
  clearSession: () => clearSession(),
}));

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

const clearCache = vi.fn();
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ clear: clearCache }) }));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}));

function setup() {
  const onOpenChange = vi.fn();
  render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);
  const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;
  const fill = (current: string, next: string, confirm: string) => {
    fireEvent.change(field(/^Senha Atual/), { target: { value: current } });
    fireEvent.change(field(/^Nova Senha/), { target: { value: next } });
    fireEvent.change(field(/^Confirmar Nova Senha/), { target: { value: confirm } });
  };
  const submit = () => fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  return { onOpenChange, field, fill, submit };
}

beforeEach(() => {
  updatePassword.mockReset();
  updatePassword.mockResolvedValue({ success: true, sessionsRevoked: true });
  clearSession.mockClear();
  clearCache.mockClear();
  navigate.mockClear();
  toastError.mockClear();
  toastSuccess.mockClear();
});

describe("ChangePasswordDialog", () => {
  it("os 3 campos têm olho que alterna password/text e começam ocultos", () => {
    const { field } = setup();
    const cases: Array<[RegExp, string]> = [
      [/^Senha Atual/, "senha atual"],
      [/^Nova Senha/, "nova senha"],
      [/^Confirmar Nova Senha/, "confirmação da nova senha"],
    ];
    for (const [label, name] of cases) {
      expect(field(label).type).toBe("password");
      fireEvent.change(field(label), { target: { value: "valor-digitado-1" } });
      fireEvent.click(screen.getByRole("button", { name: `Mostrar ${name}` }));
      expect(field(label).type).toBe("text");
      expect(field(label).value).toBe("valor-digitado-1");
      fireEvent.click(screen.getByRole("button", { name: `Ocultar ${name}` }));
      expect(field(label).type).toBe("password");
    }
  });

  it("sucesso: manda atual + nova + confirmação, encerra a sessão local e vai para o login", async () => {
    const { fill, submit, onOpenChange } = setup();
    fill("senha-antiga-123", "senha-nova-456", "senha-nova-456");
    submit();

    await waitFor(() => expect(updatePassword).toHaveBeenCalledTimes(1));
    expect(updatePassword).toHaveBeenCalledWith({
      currentPassword: "senha-antiga-123",
      newPassword: "senha-nova-456",
      confirmPassword: "senha-nova-456",
    });
    // não existe userId no que é enviado
    expect(Object.keys(updatePassword.mock.calls[0][0])).not.toContain("userId");
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login", { replace: true }));
    expect(clearSession).toHaveBeenCalled();
    expect(clearCache).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("Entre novamente"));
  });

  it("senha fraca (menos de 8): avisa e não envia", () => {
    const { fill, submit } = setup();
    fill("senha-antiga-123", "1234567", "1234567");
    submit();
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining("pelo menos 8"));
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("nova igual à atual e confirmação diferente: não envia", () => {
    const { fill, submit } = setup();
    fill("senha-antiga-123", "senha-antiga-123", "senha-antiga-123");
    submit();
    expect(toastError).toHaveBeenLastCalledWith(expect.stringContaining("diferente da senha atual"));

    fill("senha-antiga-123", "senha-nova-456", "senha-nova-4567");
    submit();
    expect(toastError).toHaveBeenLastCalledWith(expect.stringContaining("não coincidem"));
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("senha atual errada (400 do servidor): mostra a mensagem, mantém a sessão e não vai para o login", async () => {
    updatePassword.mockRejectedValue(new Error("A senha atual está incorreta."));
    const { fill, submit } = setup();
    fill("errada-errada", "senha-nova-456", "senha-nova-456");
    submit();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("A senha atual está incorreta."));
    expect(clearSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("limite de tentativas (429): mostra a mensagem do servidor", async () => {
    updatePassword.mockRejectedValue(new Error("Muitas tentativas. Aguarde um instante e tente de novo."));
    const { fill, submit } = setup();
    fill("senha-antiga-123", "senha-nova-456", "senha-nova-456");
    submit();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining("Muitas tentativas")));
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("nenhuma senha aparece nos avisos", async () => {
    updatePassword.mockRejectedValue(new Error("A senha atual está incorreta."));
    const { fill, submit } = setup();
    fill("segredo-atual-xyz", "segredo-novo-abc", "segredo-novo-abc");
    submit();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    for (const [message] of toastError.mock.calls) {
      expect(message).not.toContain("segredo-atual-xyz");
      expect(message).not.toContain("segredo-novo-abc");
    }
  });
});
