export type AbcClass = "A" | "B" | "C";

/** Limites da curva ABC (participação acumulada no faturamento). */
export const ABC_LIMITS = { A: 80, B: 95 } as const;

/**
 * Curva ABC pelo faturamento: A = os produtos que somam os primeiros 80% do total,
 * B = até 95%, C = o resto. A classe de um produto olha a participação acumulada ANTES
 * dele, então o produto que cruza os 80% ainda é A.
 *
 * `total` é o faturamento de referência (normalmente o total do período). Sem total
 * positivo, nada é classificado.
 */
export function classifyAbc<T extends { id: string; totalRevenue: number }>(
  items: T[],
  total: number,
): Map<string, AbcClass> {
  const result = new Map<string, AbcClass>();
  if (!(total > 0)) return result;

  let cumulative = 0;
  for (const item of [...items].sort((a, b) => b.totalRevenue - a.totalRevenue)) {
    const before = (cumulative / total) * 100;
    result.set(item.id, before < ABC_LIMITS.A ? "A" : before < ABC_LIMITS.B ? "B" : "C");
    cumulative += item.totalRevenue;
  }
  return result;
}

/** Participação (0–100) de `value` no `total`; 0 sem total. */
export const sharePct = (value: number, total: number) =>
  total > 0 ? Math.min(100, (value / total) * 100) : 0;
