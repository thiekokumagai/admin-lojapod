import { describe, it, expect } from "vitest";
import {
  ORDER_BUMP_LOCATION_OPTIONS,
  normalizeOrderBumpLocation,
  orderBumpLocationLabel,
} from "./order-bump-location";

describe("order-bump-location", () => {
  it("rótulos da listagem", () => {
    expect(orderBumpLocationLabel("CART")).toBe("Carrinho");
    expect(orderBumpLocationLabel("PRODUCT")).toBe("Tela do produto");
    expect(orderBumpLocationLabel("BOTH")).toBe("Carrinho + tela do produto");
  });

  it("oferta antiga (sem o campo) vale carrinho", () => {
    expect(orderBumpLocationLabel(undefined)).toBe("Carrinho");
    expect(orderBumpLocationLabel(null)).toBe("Carrinho");
    expect(normalizeOrderBumpLocation("qualquer")).toBe("CART");
  });

  it("o seletor oferece os 3 lugares, na ordem carrinho, tela do produto, os dois", () => {
    expect(ORDER_BUMP_LOCATION_OPTIONS.map((o) => o.value)).toEqual(["CART", "PRODUCT", "BOTH"]);
    expect(ORDER_BUMP_LOCATION_OPTIONS.map((o) => o.label)).toEqual([
      "Só no carrinho",
      "Só na tela do produto",
      "Carrinho e tela do produto",
    ]);
  });
});
