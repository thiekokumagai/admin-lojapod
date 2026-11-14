import type { BestSellerItem, BestSellerSort } from "@/services/dashboard.service";

function valueOf(item: BestSellerItem, sort: BestSellerSort): number | null {
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

/**
 * Ordena do maior para o menor no critério escolhido. Produto sem custo (lucro/margem
 * nulos) vai para o fim, como na API; empates desempatam por faturamento.
 * Não altera a lista original.
 */
export function sortProducts(items: BestSellerItem[], sort: BestSellerSort): BestSellerItem[] {
  return [...items].sort((a, b) => {
    const va = valueOf(a, sort);
    const vb = valueOf(b, sort);
    if (va === null && vb === null) return b.totalRevenue - a.totalRevenue;
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va || b.totalRevenue - a.totalRevenue;
  });
}
