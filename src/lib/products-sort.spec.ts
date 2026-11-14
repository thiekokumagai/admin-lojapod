import { describe, it, expect } from "vitest";
import { sortProducts } from "./products-sort";
import type { BestSellerItem } from "@/services/dashboard.service";

const p = (id: string, quantity: number, totalRevenue: number, lucro: number | null, margem: number | null): BestSellerItem => ({
  id,
  title: id,
  categoryTitle: "Cat",
  quantity,
  totalRevenue,
  receitaLiquida: totalRevenue,
  lucro,
  margem,
  semCusto: lucro === null,
});

const items = [
  p("A", 10, 100, 10, 10),
  p("B", 2, 400, 200, 50),
  p("C", 1, 10, 9, 90),
  p("D", 1, 1000, null, null),
];
const ids = (list: BestSellerItem[]) => list.map((i) => i.id);

describe("sortProducts", () => {
  it("quantidade", () => expect(ids(sortProducts(items, "quantity"))).toEqual(["A", "B", "D", "C"]));
  it("faturamento", () => expect(ids(sortProducts(items, "revenue"))).toEqual(["D", "B", "A", "C"]));
  it("lucro: sem custo vai para o fim", () => expect(ids(sortProducts(items, "profit"))).toEqual(["B", "A", "C", "D"]));
  it("margem: sem custo vai para o fim", () => expect(ids(sortProducts(items, "margin"))).toEqual(["C", "B", "A", "D"]));

  it("não altera a lista original", () => {
    const copy = [...items];
    sortProducts(items, "revenue");
    expect(items).toEqual(copy);
  });
});
