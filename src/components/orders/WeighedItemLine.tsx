import { formatWeighedLine } from "@/lib/weight";
import { cn } from "@/lib/utils";

/** "0,645 kg × R$ 69,90/kg" abaixo do nome do item vendido por peso. Não renderiza nada nos outros itens. */
export function WeighedItemLine({
  item,
  className,
}: {
  item: { weightKg?: number | string | null; unitPricePerKg?: number | string | null; weightSource?: string | null };
  className?: string;
}) {
  const kg = Number(item.weightKg);
  const perKg = Number(item.unitPricePerKg);
  if (!(kg > 0) || !(perKg > 0)) return null;
  return (
    <span className={cn("block text-xs text-slate-500 font-medium mt-0.5 tabular-nums", className)}>
      {formatWeighedLine(kg, perKg)}
      {item.weightSource === "MANUAL" && " · peso digitado"}
    </span>
  );
}
