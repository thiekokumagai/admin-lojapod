import { describe, expect, it } from "vitest";
import { isOrderPaid } from "./orderPaid";

describe("isOrderPaid (mapa de entregas e badge da Uber)", () => {
  it("Pix na maquininha (entrega, PENDING) precisa ser cobrado", () => {
    expect(isOrderPaid({ paymentStatus: "PENDING", paymentMethod: "pix", paymentType: "entrega" })).toBe(false);
  });

  it("Pix online pendente NÃO é pago: só PAID vale (mesma regra da API)", () => {
    expect(isOrderPaid({ paymentStatus: "PENDING", paymentMethod: "pix", paymentType: "online" })).toBe(false);
    expect(isOrderPaid({ paymentStatus: "PENDING", paymentMethod: "PIX", paymentType: " Online " })).toBe(false);
    expect(isOrderPaid({ paymentStatus: "PAID", paymentMethod: "pix", paymentType: "online" })).toBe(true);
  });

  it("pedido PAID continua pago em qualquer forma", () => {
    expect(isOrderPaid({ paymentStatus: "PAID", paymentMethod: "pix", paymentType: "entrega" })).toBe(true);
    expect(isOrderPaid({ paymentStatus: "PAID", paymentMethod: "cash", paymentType: "entrega" })).toBe(true);
  });

  it("dinheiro e cartão pendentes precisam ser cobrados", () => {
    for (const paymentMethod of ["cash", "credit", "debit", "meal_voucher", "food_voucher"]) {
      expect(isOrderPaid({ paymentStatus: "PENDING", paymentMethod, paymentType: "entrega" })).toBe(false);
    }
  });

  it("campos ausentes não contam como pago", () => {
    expect(isOrderPaid({})).toBe(false);
    expect(isOrderPaid({ paymentMethod: "pix" })).toBe(false);
    expect(isOrderPaid({ paymentMethod: "pix", paymentType: "online" })).toBe(false);
  });
});
