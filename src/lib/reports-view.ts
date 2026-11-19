import type { ReportProductRow } from "@/services/reports.service";

export type ReportType = "vendas" | "financeiro" | "produtos";

export const REPORT_TYPES: { id: ReportType; label: string; description: string }[] = [
  { id: "vendas", label: "Vendas", description: "Pedidos, faturamento, ticket médio e formas de pagamento" },
  { id: "financeiro", label: "Financeiro", description: "Lucro, custos fixos, frete, recebimentos e caixa" },
  { id: "produtos", label: "Produtos", description: "Ranking, mais lucrativos, boxes e produtos parados" },
];

export function parseReportType(value: string | null): ReportType {
  return REPORT_TYPES.some((t) => t.id === value) ? (value as ReportType) : "vendas";
}

/** Formas de pagamento do filtro (a API compara pelo nome em português, qualquer grafia). */
export const PAYMENT_FILTER_OPTIONS = [
  { value: "pix", label: "Pix" },
  { value: "credit", label: "Cartão de crédito" },
  { value: "debit", label: "Cartão de débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "pix_terminal", label: "Pix na maquininha" },
  { value: "credit_online", label: "Cartão de crédito (online)" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "infinitepay", label: "InfinitePay" },
  { value: "meal_voucher", label: "Vale refeição" },
  { value: "food_voucher", label: "Vale alimentação" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "PENDING", label: "Pendente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "DISPATCHED", label: "Saiu para entrega" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
];

export const DELIVERY_FILTER_OPTIONS = [
  { value: "DELIVERY", label: "Entrega" },
  { value: "STORE_PICKUP", label: "Retirada na loja" },
];

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: "PAID", label: "Pago" },
  { value: "PENDING", label: "A receber" },
];

export const IDLE_DAYS_OPTIONS = [15, 30, 60, 90];

export type ProductSort = "total" | "avulsas" | "revenue" | "profit" | "margin";

export const PRODUCT_SORT_OPTIONS: { id: ProductSort; label: string }[] = [
  { id: "total", label: "Mais vendidos" },
  { id: "avulsas", label: "Só avulsos" },
  { id: "revenue", label: "Faturamento" },
  { id: "profit", label: "Mais lucrativos" },
  { id: "margin", label: "Maior margem" },
];

function sortValue(row: ReportProductRow, sort: ProductSort): number | null {
  switch (sort) {
    case "avulsas":
      return row.unidadesAvulsas;
    case "revenue":
      return row.receita;
    case "profit":
      return row.lucro;
    case "margin":
      return row.margem;
    default:
      return row.unidadesTotais;
  }
}

/**
 * Ordena do maior para o menor. Produto sem custo (lucro/margem nulos) vai para o fim;
 * empates desempatam por unidades totais. Não altera a lista original.
 */
export function sortReportProducts(rows: ReportProductRow[], sort: ProductSort): ReportProductRow[] {
  return [...rows].sort((a, b) => {
    const va = sortValue(a, sort);
    const vb = sortValue(b, sort);
    if (va === null && vb === null) return b.unidadesTotais - a.unidadesTotais;
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va || b.unidadesTotais - a.unidadesTotais;
  });
}

/** Produto sem texto de busca passa; a busca ignora caixa e acento. */
export function matchesSearch(text: string, term: string): boolean {
  if (!term.trim()) return true;
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return norm(text).includes(norm(term.trim()));
}
