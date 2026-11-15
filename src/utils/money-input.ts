/** "33,33", "R$ 1.234,50" ou "33.33" => número com 2 casas; vazio/inválido/negativo => null. */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
