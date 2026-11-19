import { describe, it, expect } from "vitest";
import { matchesSearch, parseReportType, sortReportProducts } from "./reports-view";
import type { ReportProductRow } from "@/services/reports.service";

const row = (over: Partial<ReportProductRow>): ReportProductRow => ({
  id: "p",
  titulo: "Produto",
  categoria: "Cat",
  unidadesAvulsas: 0,
  unidadesEmCombos: 0,
  unidadesTotais: 0,
  receita: 0,
  receitaLiquida: 0,
  lucro: 0,
  margem: 0,
  semCusto: false,
  estoque: 0,
  ...over,
});

describe("sortReportProducts", () => {
  const rows = [
    row({ id: "a", unidadesAvulsas: 10, unidadesEmCombos: 0, unidadesTotais: 10, receita: 100, lucro: 20, margem: 20 }),
    row({ id: "b", unidadesAvulsas: 1, unidadesEmCombos: 30, unidadesTotais: 31, receita: 90, lucro: 60, margem: 66 }),
    row({ id: "c", unidadesAvulsas: 5, unidadesEmCombos: 0, unidadesTotais: 5, receita: 500, lucro: null, margem: null }),
  ];

  it("por unidades totais conta as de dentro dos boxes", () => {
    expect(sortReportProducts(rows, "total").map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("só avulsos ignora o que saiu em box", () => {
    expect(sortReportProducts(rows, "avulsas").map((r) => r.id)).toEqual(["a", "c", "b"]);
  });

  it("mais lucrativos deixa o produto sem custo por último", () => {
    expect(sortReportProducts(rows, "profit").map((r) => r.id)).toEqual(["b", "a", "c"]);
    expect(sortReportProducts(rows, "margin").map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("por faturamento e sem alterar a lista original", () => {
    const copy = [...rows];
    expect(sortReportProducts(rows, "revenue").map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(rows).toEqual(copy);
  });
});

describe("matchesSearch", () => {
  it("ignora caixa e acento", () => {
    expect(matchesSearch("Café Moído 500g", "cafe moido")).toBe(true);
    expect(matchesSearch("Café Moído 500g", "chá")).toBe(false);
  });

  it("busca vazia mostra tudo", () => {
    expect(matchesSearch("qualquer", "  ")).toBe(true);
  });
});

describe("parseReportType", () => {
  it("aceita só os tipos conhecidos e cai em vendas", () => {
    expect(parseReportType("financeiro")).toBe("financeiro");
    expect(parseReportType("produtos")).toBe("produtos");
    expect(parseReportType("xpto")).toBe("vendas");
    expect(parseReportType(null)).toBe("vendas");
  });
});
