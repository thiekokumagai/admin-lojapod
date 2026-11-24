import { describe, expect, it } from "vitest";
import {
  duplicateWeighedLine,
  formatWeighedLine,
  isValidWeight,
  netWeightKg,
  parseWeightInput,
  weighedPrice,
} from "./weight";

describe("lib/weight (venda por peso)", () => {
  it("exemplo do plano: 0,700 kg bruto − 50 g de tara = 0,650 kg × R$ 69,90 = R$ 45,44", () => {
    const net = netWeightKg(0.7, 50);
    expect(net).toBe(0.65);
    expect(weighedPrice({ weightKg: net, pricePerKg: 69.9, promoAllowed: true })).toEqual({
      unitPricePerKg: 69.9,
      price: 45.44,
    });
  });

  it("lê o peso digitado em g ou kg, com vírgula ou ponto", () => {
    expect(parseWeightInput("650", "g")).toBe(0.65);
    expect(parseWeightInput("0,650", "kg")).toBe(0.65);
    expect(parseWeightInput("1.2", "kg")).toBe(1.2);
    expect(parseWeightInput("", "g")).toBeNull();
    expect(parseWeightInput("abc", "kg")).toBeNull();
    expect(parseWeightInput("0", "g")).toBeNull();
  });

  it("tara maior que o peso dá líquido zero (nunca negativo)", () => {
    expect(netWeightKg(0.03, 50)).toBe(0);
  });

  it("limites de peso iguais aos da API", () => {
    expect(isValidWeight(0.001)).toBe(true);
    expect(isValidWeight(0)).toBe(false);
    expect(isValidWeight(100.1)).toBe(false);
  });

  it("preço promocional por kg só quando a forma de pagamento permite", () => {
    const base = { weightKg: 0.65, pricePerKg: 69.9, promoPricePerKg: 59.9 };
    expect(weighedPrice({ ...base, promoAllowed: true })).toEqual({ unitPricePerKg: 59.9, price: 38.94 });
    expect(weighedPrice({ ...base, promoAllowed: false })).toEqual({ unitPricePerKg: 69.9, price: 45.44 });
  });

  it("formata a linha do cupom", () => {
    expect(formatWeighedLine(0.645, 69.9).replace(/ /g, " ")).toBe("0,645 kg × R$ 69,90/kg");
  });

  it("duplicar pedido copia o peso e usa o preço/kg atual", () => {
    const line = duplicateWeighedLine(
      { productId: "p1", productName: "Self-service", weightKg: 0.5, weightSource: "SCALE" },
      { price: 70 },
    );
    expect(line).toMatchObject({ quantity: 1, weightKg: 0.5, price: 35, unitPricePerKg: 70, weightSource: "SCALE" });
    expect(line.weighingId).toMatch(/^w-/);
  });
});
