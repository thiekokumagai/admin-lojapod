export const formatBRL = (v: number) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatInt = (v: number) => v.toLocaleString("pt-BR");
export const formatPct = (v: number) => `${v.toLocaleString("pt-BR")}%`;

/** Eixo do gráfico: 12.500 -> "12,5 mil", para caber no celular. */
export const formatCompact = (v: number) =>
  Math.abs(v) >= 1000
    ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : String(v);
