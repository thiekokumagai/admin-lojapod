import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderPaymentBadge } from "./OrderPaymentBadge";

describe("OrderPaymentBadge", () => {
  it("pedido entregue (concluído) e pago mostra PAGO", () => {
    render(<OrderPaymentBadge status="COMPLETED" paymentStatus="PAID" />);
    expect(screen.getByText("PAGO")).toBeInTheDocument();
  });

  it("pedido entregue (concluído) e não pago mostra NÃO PAGO", () => {
    render(<OrderPaymentBadge status="COMPLETED" paymentStatus="PENDING" />);
    expect(screen.getByText("NÃO PAGO")).toBeInTheDocument();
  });

  it("sem paymentStatus conta como não pago", () => {
    render(<OrderPaymentBadge status="PENDING" />);
    expect(screen.getByText("NÃO PAGO")).toBeInTheDocument();
  });

  it("cancelado e não pago não mostra selo; cancelado e pago mostra PAGO", () => {
    const { container, rerender } = render(<OrderPaymentBadge status="CANCELLED" paymentStatus="PENDING" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<OrderPaymentBadge status="CANCELLED" paymentStatus="PAID" />);
    expect(screen.getByText("PAGO")).toBeInTheDocument();
  });
});
