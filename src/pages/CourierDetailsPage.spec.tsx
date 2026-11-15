import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import CourierDetailsPage from "./CourierDetailsPage";
import { couriersService } from "@/services/couriers.service";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "courier-1" }),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("@/services/couriers.service", () => ({
  couriersService: {
    getCourier: vi.fn(),
    deleteTransaction: vi.fn(),
    updateCourier: vi.fn(),
  },
}));

describe("CourierDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(couriersService.getCourier).mockResolvedValue({
      id: "courier-1",
      name: "Gui",
      phone: "66999301566",
      isActive: true,
      balance: 40,
      transactions: [
        { id: "fee-1", courierId: "courier-1", type: "FEE", amount: "10", description: "Corrida 1", date: new Date().toISOString() },
        { id: "fee-2", courierId: "courier-1", type: "FEE", amount: "30", description: "Corrida 2", date: new Date().toISOString() },
        { id: "payment-1", courierId: "courier-1", type: "PAYMENT", amount: "10", description: "Pagamento", date: new Date().toISOString() },
        { id: "fee-3", courierId: "courier-1", type: "FEE", amount: "10", description: "Corrida 3", date: new Date().toISOString() },
      ],
    });
  });

  it("sums decimal-string transaction amounts instead of concatenating them", async () => {
    render(<CourierDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
    });

    expect(screen.getAllByText("R$ 10,00").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("mostra o motivo que a API dá quando recusa excluir a rota (pedido já enviado/entregue)", async () => {
    const message = "Não é possível excluir esta rota: ela tem pedido já enviado ou entregue (#101).";
    vi.mocked(couriersService.deleteTransaction).mockRejectedValue(new Error(message));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { container } = render(<CourierDetailsPage />);
    // a lista aparece duas vezes (cartões no celular e tabela no desktop)
    await waitFor(() => expect(screen.getAllByText("Corrida 1").length).toBeGreaterThan(0));

    const trash = container.querySelector('button svg[class*="trash"]')?.closest("button");
    expect(trash).toBeTruthy();
    fireEvent.click(trash!);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(toast.success).not.toHaveBeenCalled();
  });

  describe("pedido cancelado dentro da rota", () => {
    const order = (over: Record<string, unknown>) => ({
      id: "o",
      orderNumber: 1,
      customerName: "Cliente",
      totalOrder: "0",
      totalReceived: "0",
      paymentType: "entrega",
      paymentMethod: "cash",
      paymentStatus: "PENDING",
      amountProvided: null,
      changeAmount: null,
      status: "CONFIRMED",
      ...over,
    });

    const now = () => new Date().toISOString();

    beforeEach(() => {
      vi.mocked(couriersService.getCourier).mockResolvedValue({
        id: "courier-1",
        name: "Gui",
        phone: "66999301566",
        isActive: true,
        balance: 25,
        transactions: [
          {
            id: "fee-1",
            courierId: "courier-1",
            type: "FEE",
            amount: "25",
            description: "Taxa Rota 1 (3 paradas)",
            date: now(),
            orders: [
              // ativo, dinheiro, R$ 30 com R$ 5 de troco
              order({ id: "o1", orderNumber: 101, totalOrder: "30", changeAmount: "5", status: "DISPATCHED" }),
              // cancelado, dinheiro, R$ 50 com R$ 10 de troco: não pode entrar em nada
              order({ id: "o2", orderNumber: 102, totalOrder: "50", changeAmount: "10", status: "CANCELLED" }),
              // ativo, pago online, R$ 20
              order({ id: "o3", orderNumber: 103, totalOrder: "20", totalReceived: "20", paymentType: "online", paymentMethod: "pix", paymentStatus: "PAID", status: "CONFIRMED" }),
            ],
          },
        ],
      });
    });

    const sectionOf = (title: RegExp) => screen.getByText(title).closest("div.border")!.parentElement!;

    it("mostra o pedido cancelado na lista com a etiqueta 'Cancelado' e o valor riscado", async () => {
      render(<CourierDetailsPage />);
      await waitFor(() => expect(screen.getAllByTestId("cancelled-order").length).toBeGreaterThan(0));

      // lista mobile + tabela desktop renderizam o mesmo pedido
      for (const item of screen.getAllByTestId("cancelled-order")) {
        expect(item).toHaveTextContent("#102");
        expect(item).toHaveTextContent("Cancelado");
        expect(item.querySelector(".line-through")).toHaveTextContent("R$ 50,00");
      }
      // os pedidos ativos não ganham a etiqueta
      expect(screen.queryAllByText("Cancelado").length).toBe(screen.getAllByTestId("cancelled-order").length);
    });

    it("não conta o cancelado em total a cobrar, forma de pagamento, troco nem quantidade de pedidos", async () => {
      render(<CourierDetailsPage />);
      await waitFor(() => expect(screen.getByText(/Cobrado na entrega/)).toBeInTheDocument());

      const onDelivery = sectionOf(/Cobrado na entrega/);
      expect(onDelivery).toHaveTextContent("R$ 30,00"); // só o pedido ativo (50 do cancelado fora)
      expect(onDelivery).not.toHaveTextContent("R$ 80,00");
      expect(onDelivery).toHaveTextContent("Dinheiro (1)");
      expect(onDelivery).toHaveTextContent("R$ 5,00"); // troco só do pedido ativo
      expect(onDelivery).not.toHaveTextContent("R$ 15,00");

      expect(sectionOf(/Já pago online/)).toHaveTextContent("R$ 20,00");

      // 2 pedidos na conferência (o cancelado fica de fora) e aviso de 1 cancelado
      expect(screen.getByText("(2 pedidos)")).toBeInTheDocument();
      expect(screen.getByText("1 cancelado fora da conta")).toBeInTheDocument();
    });

    it("rota com todos os pedidos cancelados não conta como entrega", async () => {
      vi.mocked(couriersService.getCourier).mockResolvedValue({
        id: "courier-1",
        name: "Gui",
        phone: "66999301566",
        isActive: true,
        balance: 10,
        transactions: [
          {
            id: "fee-1",
            courierId: "courier-1",
            type: "FEE",
            amount: "10",
            description: "Taxa Rota 1 (1 parada)",
            date: now(),
            orders: [order({ id: "o9", orderNumber: 109, totalOrder: "40", status: "CANCELLED" })],
          },
        ],
      });
      render(<CourierDetailsPage />);
      await waitFor(() => expect(screen.getByText("Qtd de Entregas")).toBeInTheDocument());

      expect(screen.getByText("Qtd de Entregas").closest("div.rounded-2xl")).toHaveTextContent("0");
      expect(screen.getByText("Todos os pedidos vinculados a este motoboy no período foram cancelados.")).toBeInTheDocument();
      expect(screen.getAllByTestId("cancelled-order").length).toBeGreaterThan(0);
    });
  });
});
