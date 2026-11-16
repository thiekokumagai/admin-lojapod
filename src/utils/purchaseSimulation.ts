export interface PurchaseItem {
  id_produto?: string;
  descricao?: string;
  variacao?: string | null;
  categoria?: string | null;
  media_mensal?: number;
  estoque_atual?: number;
  quantidade_sugerida?: number;
  valor_custo?: number;
  valor_total_sugerido?: number;
  prioridade?: string;
}

export type PurchaseSortDirection = "asc" | "desc";

export interface PurchaseSortConfig {
  key: string;
  direction: PurchaseSortDirection;
}

/** Colunas que o usuário pode escolher para ordenar a simulação. */
export const PURCHASE_SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "descricao", label: "Nome" },
  { key: "categoria", label: "Categoria" },
  { key: "valor_custo", label: "Custo unitário" },
  { key: "valor_total_sugerido", label: "Total" },
  { key: "quantidade_sugerida", label: "Quantidade" },
];

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

function compareValues(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

/**
 * Ordena sem mexer na lista original. Itens sem valor ficam sempre no fim.
 * Empate em categoria (ou em qualquer coluna) desempata pelo nome, para a lista ficar previsível.
 */
export function sortPurchaseItems<T extends PurchaseItem>(items: T[], sort: PurchaseSortConfig | null): T[] {
  const copy = [...items];
  if (!sort) return copy;
  const sign = sort.direction === "asc" ? 1 : -1;
  return copy.sort((a, b) => {
    const av = (a as Record<string, unknown>)[sort.key];
    const bv = (b as Record<string, unknown>)[sort.key];
    const aEmpty = av === null || av === undefined || av === "";
    const bEmpty = bv === null || bv === undefined || bv === "";
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
    const main = compareValues(av, bv) * sign;
    if (main !== 0) return main;
    return compareValues(a.descricao, b.descricao);
  });
}

export function formatBRL(value: number | undefined | null): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

const NO_CATEGORY_LABEL = "Sem categoria";

/**
 * Texto para o WhatsApp só com os itens escolhidos, sem preço, agrupado por categoria:
 *
 *   Categoria
 *   Nome variação - quantidade
 *
 * Categorias na ordem em que aparecem primeiro na lista recebida; "Sem categoria" sempre por último.
 * Dentro de cada categoria vale a ordem recebida (a da tela).
 */
export function buildPurchaseMessage(items: PurchaseItem[]): string {
  if (items.length === 0) return "";
  const groups = new Map<string, string[]>();
  let noCategoryLines: string[] | null = null;

  for (const item of items) {
    const qty = Number(item.quantidade_sugerida) || 0;
    const name = [item.descricao, item.variacao].filter(Boolean).join(" ") || "Item";
    const line = `${name} - ${qty}`;
    const category = (item.categoria ?? "").trim();
    if (!category) {
      (noCategoryLines ??= []).push(line);
      continue;
    }
    const lines = groups.get(category);
    if (lines) lines.push(line);
    else groups.set(category, [line]);
  }

  const blocks = [...groups.entries()].map(([category, lines]) => [category, ...lines].join("\n"));
  if (noCategoryLines) blocks.push([NO_CATEGORY_LABEL, ...noCategoryLines].join("\n"));
  return blocks.join("\n\n");
}
