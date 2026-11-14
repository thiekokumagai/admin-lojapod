import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { KpiDelta } from "@/lib/kpi-delta";

/** Variação contra o período anterior (▲/▼ + texto), com o valor anterior no tooltip. */
export function KpiDeltaLine({ delta, label }: { delta: KpiDelta; label: string }) {
  const Icon = delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;
  const tone =
    delta.good === null ? "text-muted-foreground" : delta.good ? "text-emerald-600" : "text-rose-600";
  const sign = delta.direction === "up" && delta.text !== "novo" ? "+" : delta.direction === "down" ? "−" : "";
  return (
    <p
      className="flex flex-wrap items-center gap-x-1 text-[11px] leading-tight"
      title={`Período anterior: ${delta.previousText}`}
    >
      <span className={`inline-flex items-center font-semibold tabular-nums ${tone}`}>
        <Icon className="h-3 w-3" aria-hidden="true" />
        {sign}
        {delta.text}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </p>
  );
}
