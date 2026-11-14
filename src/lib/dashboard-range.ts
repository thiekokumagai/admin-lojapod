import type { DashboardRange } from "@/hooks/useDashboard";

export type FilterType = "today" | "7days" | "30days" | "6months" | "year" | "custom";

export const FILTER_OPTIONS: { id: Exclude<FilterType, "custom">; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7days", label: "7 dias" },
  { id: "30days", label: "30 dias" },
  { id: "6months", label: "6 meses" },
  { id: "year", label: "Ano" },
];

export const COMPARISON_LABEL: Record<FilterType, string> = {
  today: "vs. ontem",
  "7days": "vs. 7 dias antes",
  "30days": "vs. 30 dias antes",
  "6months": "vs. 6 meses antes",
  year: "vs. ano anterior",
  custom: "vs. período anterior",
};

// Envia a data LOCAL (YYYY-MM-DD). A API converte para início/fim do dia no fuso da loja.
// Usar toISOString() aqui jogava o fim do dia para o dia seguinte em UTC, fazendo "Hoje"
// virar 2 dias (e perder o gráfico por hora).
export const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function getPresetRange(filter: Exclude<FilterType, "custom">, now: Date = new Date()): DashboardRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  if (filter === "7days") start.setDate(start.getDate() - 6);
  else if (filter === "30days") start.setDate(start.getDate() - 29);
  else if (filter === "6months") start.setMonth(start.getMonth() - 6);
  else if (filter === "year") start.setFullYear(start.getFullYear() - 1);
  return { start: toLocalDateStr(start), end: toLocalDateStr(today) };
}

/** "Hoje", "Últimos 7 dias", "01/11 a 14/11"… para o subtítulo da tela. */
export function describeRange(filter: FilterType, range: DashboardRange | null): string {
  const short = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
  if (filter === "today") return "Hoje";
  if (!range) return "";
  const label =
    filter === "7days" ? "Últimos 7 dias"
    : filter === "30days" ? "Últimos 30 dias"
    : filter === "6months" ? "Últimos 6 meses"
    : filter === "year" ? "Último ano"
    : "Período personalizado";
  return `${label} · ${short(range.start)} a ${short(range.end)}`;
}
