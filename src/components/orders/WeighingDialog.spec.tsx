import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeighingDialog } from "./WeighingDialog";

type ScaleState = {
  status: "connecting" | "online" | "offline";
  devices: { deviceId: string; name: string }[];
  selected: { deviceId: string; name: string } | null;
  reading: { deviceId: string; weightKg: number; stable: boolean; receivedAt: number } | null;
  isFresh: boolean;
};
let scaleState: ScaleState;

vi.mock("@/hooks/useScale", () => ({
  useScale: () => ({ ...scaleState, setDeviceId: vi.fn() }),
}));

const product = { id: "p-kg", title: "Self-service", price: 69.9, tareWeightGrams: 50 };
const offline: ScaleState = { status: "offline", devices: [], selected: null, reading: null, isFresh: false };
const device = { deviceId: "caixa-1", name: "Balança Caixa 1" };

function renderDialog(onConfirm = vi.fn()) {
  render(<WeighingDialog open onOpenChange={vi.fn()} product={product} promoAllowed onConfirm={onConfirm} />);
  return onConfirm;
}
const brl = (text: string | null) => (text ?? "").replace(/ /g, " ");

describe("WeighingDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    scaleState = offline;
  });
  afterEach(() => vi.useRealTimers());

  it("sem balança: cai sozinho para digitar e calcula 700 g − 50 g de tara = R$ 45,44", () => {
    const onConfirm = renderDialog();
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.getByText(/Digite o peso/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Peso na balança"), { target: { value: "700" } });
    expect(brl(screen.getByTestId("weighing-price").textContent)).toBe("R$ 45,44");

    fireEvent.keyDown(screen.getByLabelText("Peso na balança"), { key: "Enter" });
    expect(onConfirm).toHaveBeenCalledWith(
      { weightKg: 0.65, unitPricePerKg: 69.9, price: 45.44, weightSource: "MANUAL" },
      false,
    );
  });

  it("balança com peso estável: Capturar grava como SCALE", () => {
    scaleState = {
      status: "online",
      devices: [device],
      selected: device,
      reading: { deviceId: "caixa-1", weightKg: 0.7, stable: true, receivedAt: Date.now() },
      isFresh: true,
    };
    const onConfirm = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Capturar" }));
    expect(onConfirm).toHaveBeenCalledWith(
      { weightKg: 0.65, unitPricePerKg: 69.9, price: 45.44, weightSource: "SCALE" },
      false,
    );
  });

  it("peso instável: não deixa capturar", () => {
    scaleState = {
      status: "online",
      devices: [device],
      selected: device,
      reading: { deviceId: "caixa-1", weightKg: 0.7, stable: false, receivedAt: Date.now() },
      isFresh: true,
    };
    const onConfirm = renderDialog();
    expect(screen.getByRole("button", { name: "Capturar" })).toBeDisabled();
    expect(screen.getByText("Aguardando o peso estabilizar…")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("peso para de chegar no meio da venda: cai para digitar", () => {
    scaleState = {
      status: "online",
      devices: [device],
      selected: device,
      reading: { deviceId: "caixa-1", weightKg: 0.7, stable: true, receivedAt: Date.now() },
      isFresh: true,
    };
    const { rerender } = render(
      <WeighingDialog open onOpenChange={vi.fn()} product={product} promoAllowed onConfirm={vi.fn()} />,
    );
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.getByRole("button", { name: "Capturar" })).toBeEnabled();

    scaleState = { ...scaleState, isFresh: false };
    rerender(<WeighingDialog open onOpenChange={vi.fn()} product={product} promoAllowed onConfirm={vi.fn()} />);
    expect(screen.getByText(/A balança parou de responder/)).toBeInTheDocument();
    expect(screen.getByLabelText("Peso na balança")).toBeInTheDocument();
  });

  it("operador troca para digitar a qualquer momento; peso menor que a tara não deixa adicionar", () => {
    scaleState = {
      status: "online",
      devices: [device],
      selected: device,
      reading: { deviceId: "caixa-1", weightKg: 0.7, stable: true, receivedAt: Date.now() },
      isFresh: true,
    };
    renderDialog();
    fireEvent.click(screen.getByRole("radio", { name: "Digitar peso" }));
    fireEvent.change(screen.getByLabelText("Peso na balança"), { target: { value: "30" } });
    expect(screen.getByText("O peso é menor que a tara.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
  });

  it("'Adicionar e pesar outro' mantém o modal para a próxima pesagem", () => {
    const onConfirm = renderDialog();
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    fireEvent.change(screen.getByLabelText("Peso na balança"), { target: { value: "350" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar e pesar outro" }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ weightKg: 0.3, price: 20.97 }), true);
    expect(screen.getByLabelText("Peso na balança")).toHaveValue("");
  });
});
