import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DiagnosisItem } from "@/services/dashboard.service";
import { formatBRL } from "@/lib/dashboard-format";
import { pickAttentionItems } from "@/lib/dashboard-attention";

interface AttentionStripProps {
  items: DiagnosisItem[] | undefined;
  loading: boolean;
  /** Abre a aba Diagnóstico. */
  onSeeAll: () => void;
}

/** Faixa "Precisa de atenção": os 3 maiores problemas do Diagnóstico, com atalho para agir. */
export function AttentionStrip({ items, loading, onSeeAll }: AttentionStripProps) {
  const navigate = useNavigate();
  const top = pickAttentionItems(items);

  if (loading) {
    return <div className="h-24 rounded-2xl bg-muted animate-pulse border border-border" data-testid="attention-loading" />;
  }
  // Sem dados do diagnóstico (erro ou ainda nada): não ocupa espaço nem assusta.
  if (!items) return null;

  if (top.length === 0) {
    return (
      <Card className="border border-emerald-200 bg-emerald-50/60 rounded-2xl" data-testid="attention-ok">
        <CardContent className="p-3 sm:p-4 flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          Tudo certo: nenhum alerta importante neste período.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-amber-200 bg-amber-50/50 rounded-2xl" data-testid="attention-strip">
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ShieldAlert className="h-4 w-4 text-amber-600" aria-hidden="true" />
            Precisa de atenção
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={onSeeAll}
            className="h-auto p-0 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-transparent gap-1"
          >
            Ver tudo
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>

        {/* Celular: um embaixo do outro; telas maiores: lado a lado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {top.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.actionUrl ? navigate(item.actionUrl) : onSeeAll())}
              className="w-full text-left rounded-xl border border-border bg-card p-3 space-y-1 hover:shadow-md transition-shadow"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${item.severity === "critical" ? "bg-rose-500" : "bg-amber-500"}`}
                  role="img"
                  aria-label={item.severity === "critical" ? "Crítico" : "Atenção"}
                />
                <span className="text-xs font-bold text-foreground line-clamp-2">{item.title}</span>
              </span>
              {item.amount !== null && (
                <span className="block text-sm font-extrabold tabular-nums text-foreground">
                  {formatBRL(item.amount)}
                  {item.estimated && <span className="ml-1 text-[10px] font-medium text-muted-foreground">estimativa</span>}
                </span>
              )}
              {item.actionLabel && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  {item.actionLabel}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
