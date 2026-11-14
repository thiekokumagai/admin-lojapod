import { AlertTriangle } from "lucide-react";
import type { DashboardMissingCost } from "@/services/dashboard.service";
import { formatBRL } from "@/lib/dashboard-format";

/** Aviso: produtos vendidos sem custo cadastrado ficam fora do lucro e da margem. */
export function MissingCostNotice({ missingCost }: { missingCost: DashboardMissingCost | null }) {
  if (!missingCost || missingCost.count === 0) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900" data-testid="missing-cost">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="text-xs space-y-1">
        <p className="font-bold">
          {missingCost.count}{" "}
          {missingCost.count === 1 ? "produto vendido sem custo cadastrado" : "produtos vendidos sem custo cadastrado"}
        </p>
        <p>
          Eles ficam fora do lucro e da margem ({formatBRL(missingCost.receitaLiquida)} em vendas). Cadastre o custo no
          produto para o lucro ficar completo. {missingCost.produtos.slice(0, 5).map((p) => p.title).join(", ")}
          {missingCost.count > 5 ? "…" : ""}
        </p>
        <p className="text-amber-700">
          O lucro usa o custo atual do produto; se o custo mudou, vendas antigas refletem o custo de hoje.
        </p>
      </div>
    </div>
  );
}
