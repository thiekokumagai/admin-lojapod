import { describe, it, expect } from "vitest";
import { getPresetRange, describeRange, toLocalDateStr } from "./dashboard-range";
import { metricOf, formatMetric, SORT_OPTIONS } from "./dashboard-metrics";
import { pickAttentionItems } from "./dashboard-attention";
import { formatBRL, formatCompact } from "./dashboard-format";
import type { BestSellerItem, DiagnosisItem } from "@/services/dashboard.service";

describe("dashboard-range", () => {
  const now = new Date(2026, 10, 14, 15, 30); // 14/11/2026 15:30 local

  it("hoje: início e fim no mesmo dia, em data local (não UTC)", () => {
    expect(getPresetRange("today", now)).toEqual({ start: "2026-11-14", end: "2026-11-14" });
  });

  it("7 e 30 dias terminam hoje e contam hoje", () => {
    expect(getPresetRange("7days", now)).toEqual({ start: "2026-11-08", end: "2026-11-14" });
    expect(getPresetRange("30days", now)).toEqual({ start: "2026-10-16", end: "2026-11-14" });
  });

  it("6 meses e ano", () => {
    expect(getPresetRange("6months", now).start).toBe("2026-05-14");
    expect(getPresetRange("year", now).start).toBe("2025-11-14");
  });

  it("toLocalDateStr completa com zeros", () => {
    expect(toLocalDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("describeRange: rótulo e datas curtas", () => {
    expect(describeRange("today", { start: "2026-11-14", end: "2026-11-14" })).toBe("Hoje");
    expect(describeRange("7days", { start: "2026-11-08", end: "2026-11-14" })).toBe("Últimos 7 dias · 08/11 a 14/11");
    expect(describeRange("custom", { start: "2026-01-02", end: "2026-01-20" })).toBe("Período personalizado · 02/01 a 20/01");
    expect(describeRange("custom", null)).toBe("");
  });
});

const item = (over: Partial<BestSellerItem>): BestSellerItem => ({
  id: "p",
  title: "P",
  categoryTitle: "C",
  quantity: 3,
  totalRevenue: 150,
  receitaLiquida: 150,
  lucro: 60,
  margem: 40,
  semCusto: false,
  ...over,
});

describe("dashboard-metrics", () => {
  it("tem os 4 critérios de ordenação", () => {
    expect(SORT_OPTIONS.map((o) => o.id)).toEqual(["quantity", "revenue", "profit", "margin"]);
  });

  it("metricOf devolve o valor do critério; sem custo é null em lucro e margem", () => {
    const p = item({});
    expect(metricOf(p, "quantity")).toBe(3);
    expect(metricOf(p, "revenue")).toBe(150);
    expect(metricOf(p, "profit")).toBe(60);
    expect(metricOf(p, "margin")).toBe(40);
    const noCost = item({ lucro: null, margem: null });
    expect(metricOf(noCost, "profit")).toBeNull();
    expect(metricOf(noCost, "margin")).toBeNull();
  });

  it("formatMetric: unidades, moeda, % e 'Sem custo'", () => {
    expect(formatMetric(1200, "quantity")).toBe("1.200 un.");
    expect(formatMetric(12.5, "revenue")).toBe(formatBRL(12.5));
    expect(formatMetric(39.4, "margin")).toBe("39,4%");
    expect(formatMetric(null, "profit")).toBe("Sem custo");
  });
});

const diag = (id: string, severity: DiagnosisItem["severity"]): DiagnosisItem => ({
  id,
  severity,
  title: id,
  detail: "",
  amount: null,
  estimated: false,
});

describe("pickAttentionItems", () => {
  it("só crítico e atenção, na ordem recebida, no máximo 3", () => {
    const items = [diag("a", "critical"), diag("b", "ok"), diag("c", "info"), diag("d", "warning"), diag("e", "warning"), diag("f", "warning")];
    expect(pickAttentionItems(items).map((i) => i.id)).toEqual(["a", "d", "e"]);
  });

  it("sem itens devolve lista vazia", () => {
    expect(pickAttentionItems(undefined)).toEqual([]);
    expect(pickAttentionItems([diag("x", "ok")])).toEqual([]);
  });
});

describe("dashboard-format", () => {
  it("formatBRL sempre com 2 casas (ticket médio 118,6909 não vira R$ 118,691)", () => {
    expect(formatBRL(118.6909)).toBe("R$ 118,69");
    expect(formatBRL(5)).toBe("R$ 5,00");
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
    expect(formatBRL(0.005 + 10)).toBe("R$ 10,01");
  });

  it("formatCompact abrevia a partir de mil", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(12500)).toBe("12,5 mil");
    expect(formatCompact(1000)).toBe("1 mil");
  });
});
