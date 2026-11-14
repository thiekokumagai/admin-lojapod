import { Card, CardContent } from "@/components/ui/card";
import { Clock, MousePointerClick, Package, ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import type { DashboardComparison, DashboardKPIs } from "@/services/dashboard.service";
import { computeDelta, type KpiDelta } from "@/lib/kpi-delta";
import { formatBRL, formatInt, formatPct } from "@/lib/dashboard-format";
import { KpiDeltaLine } from "./KpiDeltaLine";

interface SecondaryMetricsProps {
  stats: DashboardKPIs | null;
  prev: DashboardComparison | null;
  loading: boolean;
  comparisonLabel: string;
}

interface Metric {
  label: string;
  value: string;
  icon: React.ElementType;
  delta?: KpiDelta | null;
}

/** Faixa compacta com o que é útil mas não decide sozinho: pedidos, ticket, visitas, conversão… */
export function SecondaryMetrics({ stats, prev, loading, comparisonLabel }: SecondaryMetricsProps) {
  const metrics: Metric[] = [
    {
      label: "Pedidos",
      value: stats ? formatInt(stats.totalPedidos) : "0",
      icon: ShoppingBag,
      delta: computeDelta(stats?.totalPedidos, prev?.totalPedidos, { kind: "percent", format: formatInt }),
    },
    {
      label: "Ticket médio",
      value: formatBRL(stats?.ticketMedio ?? 0),
      icon: TrendingUp,
      delta: computeDelta(stats?.ticketMedio, prev?.ticketMedio, { kind: "percent", format: formatBRL }),
    },
    {
      label: "Itens vendidos",
      value: stats ? formatInt(stats.totalProdutosVendidos) : "0",
      icon: Package,
      delta: computeDelta(stats?.totalProdutosVendidos, prev?.totalProdutosVendidos, { kind: "percent", format: formatInt }),
    },
    {
      label: "Visitas",
      value: stats ? formatInt(stats.visitas) : "--",
      icon: Users,
      delta: computeDelta(stats?.visitas, prev?.visitas, { kind: "percent", format: formatInt }),
    },
    {
      label: "Conversão",
      value: stats ? formatPct(stats.conversao) : "--",
      icon: MousePointerClick,
      delta: computeDelta(stats?.conversao, prev?.conversao, { kind: "points", format: formatPct }),
    },
    {
      label: "Tempo médio",
      value: stats ? `${stats.tempoMedio} min` : "--",
      icon: Clock,
    },
    {
      label: "Carrinhos abandonados",
      value: stats ? formatInt(stats.abandonos) : "--",
      icon: ShoppingCart,
      delta: computeDelta(stats?.abandonos, prev?.abandonos, { kind: "percent", format: formatInt, invert: true }),
    },
  ];

  return (
    <Card className="border border-border rounded-2xl shadow-sm" data-testid="secondary-metrics">
      <CardContent className="p-3 sm:p-4">
        {/* Celular: 2 colunas, uma métrica embaixo da outra (sem rolagem lateral) */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="min-w-0 space-y-1">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground leading-tight">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{m.label}</span>
                </dt>
                <dd className="space-y-0.5">
                  {loading ? (
                    <span className="block h-5 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <>
                      <span className="block text-base font-bold tabular-nums text-foreground [overflow-wrap:anywhere]">
                        {m.value}
                      </span>
                      {m.delta && <KpiDeltaLine delta={m.delta} label={comparisonLabel} />}
                    </>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
