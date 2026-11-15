import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CourierFeeAdjustDialog from "./CourierFeeAdjustDialog";
import { parseMoneyInput } from "@/utils/money-input";
import { clearCourierImpacts, showCourierImpact } from "@/lib/courier-impact-store";
import { couriersService } from "@/services/couriers.service";
import type { CourierImpact } from "@/types/courier-impact";

vi.mock("@/services/couriers.service", () => ({
  couriersService: { adjustFee: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const cancelled = (over: Partial<CourierImpact> = {}): CourierImpact => ({
  kind: "CANCELLED",
  transactionId: "tx1",
  courierId: "c1",
  courierName: "Gui",
  orderNumber: 101,
  amount: 50,
  activeOrdersBefore: 3,
  shareAmount: 16.67,
  suggestedAmount: 33.33,
  ...over,
});

const renderDialog = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CourierFeeAdjustDialog />
    </QueryClientProvider>,
  );

describe("parseMoneyInput", () => {
  it("aceita vírgula, ponto, R$ e milhar; recusa vazio, negativo e texto", () => {
    expect(parseMoneyInput("33,33")).toBe(33.33);
    expect(parseMoneyInput("33.33")).toBe(33.33);
    expect(parseMoneyInput("R$ 1.234,50")).toBe(1234.5);
    expect(parseMoneyInput("0")).toBe(0);
    expect(parseMoneyInput("33,339")).toBe(33.34);
    for (const bad of ["", "  ", "abc", "-5", "1,2,3"]) expect(parseMoneyInput(bad)).toBeNull();
  });
});

describe("CourierFeeAdjustDialog (cancelou/reativou pedido de rota)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(couriersService.adjustFee).mockResolvedValue({});
  });
  afterEach(() => {
    act(() => clearCourierImpacts());
  });

  it("não aparece sem aviso", () => {
    renderDialog();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancelamento: mostra valor atual e o novo valor sugerido já preenchido (R$ 50 / 3 => 33,33), editável", async () => {
    renderDialog();
    act(() => showCourierImpact(cancelled()));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Pedido #101 cancelado");
    expect(dialog).toHaveTextContent("Gui");
    expect(dialog).toHaveTextContent("R$ 50,00");
    expect(screen.getByLabelText(/Novo valor da taxa/)).toHaveValue("33,33");
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Manter valor" })).toBeInTheDocument();
  });

  it("Aplicar grava o valor sugerido na rota certa e fecha", async () => {
    renderDialog();
    act(() => showCourierImpact(cancelled()));
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(couriersService.adjustFee).toHaveBeenCalledWith("tx1", 33.33));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("o valor pode ser editado antes de aplicar", async () => {
    renderDialog();
    act(() => showCourierImpact(cancelled()));
    const input = await screen.findByLabelText(/Novo valor da taxa/);

    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(couriersService.adjustFee).toHaveBeenCalledWith("tx1", 40));
  });

  it("Manter valor fecha sem gravar nada", async () => {
    renderDialog();
    act(() => showCourierImpact(cancelled()));
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Manter valor" }));

    expect(couriersService.adjustFee).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("valor inválido desabilita o Aplicar", async () => {
    renderDialog();
    act(() => showCourierImpact(cancelled()));
    const input = await screen.findByLabelText(/Novo valor da taxa/);

    fireEvent.change(input, { target: { value: "abc" } });

    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
    expect(screen.getByText(/Informe um valor válido/)).toBeInTheDocument();
  });

  it("todos cancelados: a sugestão é R$ 0,00", async () => {
    renderDialog();
    act(() => showCourierImpact(cancelled({ activeOrdersBefore: 1, shareAmount: 50, suggestedAmount: 0 })));
    expect(await screen.findByLabelText(/Novo valor da taxa/)).toHaveValue("0,00");
  });

  it("reativação: avisa que a taxa não foi recalculada e vem com o valor atual (sem sugestão)", async () => {
    renderDialog();
    act(() =>
      showCourierImpact(
        cancelled({ kind: "REACTIVATED", amount: 33.33, activeOrdersBefore: 3, shareAmount: null, suggestedAmount: null }),
      ),
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("reativado");
    expect(dialog).toHaveTextContent("não voltou sozinha");
    expect(screen.getByLabelText(/Valor da taxa/)).toHaveValue("33,33");
  });

  it("aplicar o mesmo valor que já está na rota não chama a API", async () => {
    renderDialog();
    act(() => showCourierImpact(cancelled({ kind: "REACTIVATED", amount: 33.33, suggestedAmount: null, shareAmount: null })));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(couriersService.adjustFee).not.toHaveBeenCalled();
  });

  it("erro da API mantém o modal aberto para tentar de novo", async () => {
    vi.mocked(couriersService.adjustFee).mockRejectedValue(new Error("Transação não encontrada"));
    renderDialog();
    act(() => showCourierImpact(cancelled()));
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(couriersService.adjustFee).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dois avisos seguidos entram em fila: o segundo aparece depois do primeiro", async () => {
    renderDialog();
    act(() => {
      showCourierImpact(cancelled({ transactionId: "tx1", orderNumber: 101 }));
      showCourierImpact(cancelled({ transactionId: "tx2", orderNumber: 202 }));
    });
    expect(await screen.findByRole("dialog")).toHaveTextContent("#101");

    fireEvent.click(screen.getByRole("button", { name: "Manter valor" }));

    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("#202"));
  });
});
