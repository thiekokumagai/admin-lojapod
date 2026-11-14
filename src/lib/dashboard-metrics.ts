import type { BestSellerItem, BestSellerSort } from "@/services/dashboard.service";
import { formatBRL, formatInt, formatPct } from "@/lib/dashboard-format";

export const SORT_OPTIONS: { id: BestSellerSort; label: string }[] = [
  { id: "quantity", label: "Qtd." },
  { id: "revenue", label: "Faturamento" },
  { id: "profit", label: "Lucro" },
  { id: "margin", label: "Margem" },
];

/** Valor principal do produto no critério escolhido. null = sem custo (lucro/margem). */
export function metricOf(item: BestSellerItem, sort: BestSellerSort): number | null {
  switch (sort) {
    case "revenue":
      return item.totalRevenue;
    case "profit":
      return item.lucro;
    case "margin":
      return item.margem;
    default:
      return item.quantity;
  }
}

export function formatMetric(value: number | null, sort: BestSellerSort): string {
  if (value === null) return "Sem custo";
  if (sort === "quantity") return `${formatInt(value)} un.`;
  if (sort === "margin") return formatPct(value);
  return formatBRL(value);
}
