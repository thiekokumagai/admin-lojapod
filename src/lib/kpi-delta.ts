export interface KpiDelta {
  text: string;
  direction: "up" | "down" | "flat";
  /** true = melhorou, false = piorou, null = estável. */
  good: boolean | null;
  previousText: string;
}

/**
 * Variação contra o período anterior. "percent" = variação relativa (vendas, pedidos…);
 * "points" = diferença em pontos percentuais (margem, conversão). `invert` quando cair é
 * bom (carrinhos abandonados).
 */
export function computeDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
  opts: { kind: "percent" | "points"; format: (v: number) => string; invert?: boolean },
): KpiDelta | null {
  if (current == null || previous == null) return null;

  let diff: number;
  let text: string;
  if (opts.kind === "points") {
    diff = Math.round((current - previous) * 10) / 10;
    text = `${Math.abs(diff).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.`;
  } else {
    if (previous === 0) {
      if (current === 0) return null;
      return { text: "novo", direction: "up", good: !opts.invert, previousText: opts.format(0) };
    }
    diff = ((current - previous) / Math.abs(previous)) * 100;
    const abs = Math.abs(diff);
    text = `${abs.toLocaleString("pt-BR", { maximumFractionDigits: abs >= 10 ? 0 : 1 })}%`;
  }

  if (Math.abs(diff) < 0.05) {
    return { text: "0%", direction: "flat", good: null, previousText: opts.format(previous) };
  }
  const direction = diff > 0 ? "up" : "down";
  return {
    text,
    direction,
    good: direction === "up" ? !opts.invert : !!opts.invert,
    previousText: opts.format(previous),
  };
}
