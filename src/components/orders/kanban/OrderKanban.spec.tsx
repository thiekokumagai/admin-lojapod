import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { OrderKanbanBoard } from "./OrderKanbanBoard";
import { OrderKanbanCard } from "./OrderKanbanCard";
import { Order } from "@/types/order";
import { getTodayRangeUtc } from "@/utils/date-timezone";

const mockTimezone = "America/Campo_Grande";
const { todayYmd, startDateIso } = getTodayRangeUtc(mockTimezone);

// Helper to create mock order
function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    orderNumber: 101,
    customerName: "João Silva",
    customerPhone: "67999999999",
    itemsTotal: 50.0,
    freight: 10.0,
    totalOrder: 60.0,
    totalReceived: 60.0,
    paymentMethod: "PIX",
    paymentType: "pix",
    street: "Rua das Flores",
    number: "123",
    neighborhood: "Centro",
    city: "Campo Grande",
    state: "MS",
    cep: "79000-000",
    complement: null,
    status: "PENDING",
    paymentStatus: "PENDING",
    createdAt: startDateIso, // Today 00:00 local time
    updatedAt: startDateIso,
    items: [],
    ...overrides,
  };
}

describe("OrderKanbanCard", () => {
  it("should render order details correctly (number, customer, value, delivery, payment)", () => {
    const order = createMockOrder({
      orderNumber: 1024,
      customerName: "Maria Santos",
      totalOrder: 85.5,
      deliveryModality: "STORE_PICKUP",
      paymentStatus: "PAID",
      paymentMethod: "PIX",
      observation: "Sem gelo",
    });

    const onSelectOrder = vi.fn();
    const onUpdateStatus = vi.fn();

    render(
      <OrderKanbanCard
        order={order}
        timeZone={mockTimezone}
        onSelectOrder={onSelectOrder}
        onUpdateStatus={onUpdateStatus}
      />
    );

    expect(screen.getByText("#1024")).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("Retirada no Local")).toBeInTheDocument();
    expect(screen.getByText("Pago")).toBeInTheDocument();
    expect(screen.getByText("Pix")).toBeInTheDocument();
    expect(screen.getByText("OBS")).toBeInTheDocument();
  });

  it("should render quick action button 'Separar' for PENDING status and trigger update", () => {
    const order = createMockOrder({ status: "PENDING" });
    const onSelectOrder = vi.fn();
    const onUpdateStatus = vi.fn();

    render(
      <OrderKanbanCard
        order={order}
        timeZone={mockTimezone}
        onSelectOrder={onSelectOrder}
        onUpdateStatus={onUpdateStatus}
      />
    );

    const button = screen.getByRole("button", { name: /Separar/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onUpdateStatus).toHaveBeenCalledWith("ord-1", "CONFIRMED");
    expect(onSelectOrder).not.toHaveBeenCalled();
  });

  it("should render quick action button 'Enviar' for CONFIRMED status", () => {
    const order = createMockOrder({ status: "CONFIRMED" });
    const onUpdateStatus = vi.fn();

    render(
      <OrderKanbanCard
        order={order}
        timeZone={mockTimezone}
        onSelectOrder={vi.fn()}
        onUpdateStatus={onUpdateStatus}
      />
    );

    const button = screen.getByRole("button", { name: /Enviar/i });
    fireEvent.click(button);
    expect(onUpdateStatus).toHaveBeenCalledWith("ord-1", "DISPATCHED");
  });

  it("should render quick action button 'Entregar' for DISPATCHED status", () => {
    const order = createMockOrder({ status: "DISPATCHED" });
    const onUpdateStatus = vi.fn();

    render(
      <OrderKanbanCard
        order={order}
        timeZone={mockTimezone}
        onSelectOrder={vi.fn()}
        onUpdateStatus={onUpdateStatus}
      />
    );

    const button = screen.getByRole("button", { name: /Entregar/i });
    fireEvent.click(button);
    expect(onUpdateStatus).toHaveBeenCalledWith("ord-1", "COMPLETED");
  });

  it("should trigger onSelectOrder when clicking the card", () => {
    const order = createMockOrder();
    const onSelectOrder = vi.fn();

    render(
      <OrderKanbanCard
        order={order}
        timeZone={mockTimezone}
        onSelectOrder={onSelectOrder}
        onUpdateStatus={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("João Silva"));
    expect(onSelectOrder).toHaveBeenCalledWith("ord-1");
  });
});

describe("OrderKanbanBoard", () => {
  it("should group orders into the 4 columns and exclude orders not from today", () => {
    const todayOrder1 = createMockOrder({ id: "1", status: "PENDING" });
    const todayOrder2 = createMockOrder({ id: "2", status: "CONFIRMED" });
    const todayOrder3 = createMockOrder({ id: "3", status: "DISPATCHED" });
    const todayOrder4 = createMockOrder({ id: "4", status: "COMPLETED" });

    // Yesterday order that must be excluded by frontend safety check
    const yesterdayDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const oldOrder = createMockOrder({ id: "old", status: "PENDING", createdAt: yesterdayDate });

    render(
      <OrderKanbanBoard
        orders={[todayOrder1, todayOrder2, todayOrder3, todayOrder4, oldOrder]}
        isLoading={false}
        timeZone={mockTimezone}
        todayYmd={todayYmd}
        onSelectOrder={vi.fn()}
        onUpdateStatus={vi.fn()}
        updatingOrderId={null}
      />
    );

    // Columns are rendered
    expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Separado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enviado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Entregue").length).toBeGreaterThan(0);
  });

  it("should sort orders inside columns from oldest to newest (FIFO)", () => {
    // Two orders created today: older at 10:00, newer at 12:00
    const olderOrder = createMockOrder({
      id: "older",
      orderNumber: 1001,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "PENDING",
      customerName: "Cliente Mais Antigo",
    });
    const newerOrder = createMockOrder({
      id: "newer",
      orderNumber: 1002,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      customerName: "Cliente Mais Novo",
    });

    // Provide them in reverse order (newest first, as backend does)
    render(
      <OrderKanbanBoard
        orders={[newerOrder, olderOrder]}
        isLoading={false}
        timeZone={mockTimezone}
        todayYmd={todayYmd}
        onSelectOrder={vi.fn()}
        onUpdateStatus={vi.fn()}
        updatingOrderId={null}
      />
    );

    const elements = screen.getAllByText(/Cliente Mais/);
    expect(elements[0]).toHaveTextContent("Cliente Mais Antigo");
    expect(elements[1]).toHaveTextContent("Cliente Mais Novo");
  });

  it("should not render stray '0' when cardFee or paymentDiscount are zero or missing", () => {
    const order = createMockOrder({
      paymentDiscount: 0,
      cardFee: 0,
    });

    render(
      <OrderKanbanCard
        order={order}
        timeZone={mockTimezone}
        onSelectOrder={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );

    // Ensure there is no standalone "0" text rendered in the card
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });
});
