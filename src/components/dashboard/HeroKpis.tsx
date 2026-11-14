import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, PiggyBank, Percent } from "lucide-react";
import type { DashboardChartItem, DashboardComparison, DashboardKPIs } from "@/services/dashboard.service";
import { computeDelta, type KpiDelta } from "@/lib/kpi-delta";
import { formatBRL, formatPct } from "@/lib/dashboard-format";
import { KpiDeltaLine } from "./KpiDeltaLine";
import { Sparkline } from "./Sparkline";

interface HeroKpisProps {
  stats: DashboardKPIs | null;
  prev: DashboardComparison | null;
  chartData: DashboardChartItem[];
  loading: boolean;
  comparisonLabel: string;
}

interface HeroCard {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone: string;
  color: string;
  delta: KpiDelta | null;
  spark?: number[];
  /** 0–100: mostra uma barra de progresso (margem). */
  bar?: number | null;
}

/** Os 3 números que respondem "como estou indo": faturamento, lucro e margem. */
export function HeroKpis({ stats, prev, chartData, loading, comparisonLabel }: HeroKpisProps) {
  const cards: HeroCard[] = [
    {
      key: "faturamento",
      label: "Faturamento",
      value: formatBRL(stats?.totalVendas ?? 0),
      hint: stats ? `${stats.totalPedidos.toLocaleString("pt-BR")} pedidos no período` : undefined,
      icon: DollarSign,
      tone: "text-primary bg-primary/10",
      color: "hsl(var(--primary))",
      delta: computeDelta(stats?.totalVendas, prev?.totalVendas, { kind: "percent", format: formatBRL }),
      spark: chartData.map((p) => p.vendas),
    },
    {
      key: "lucro",
      label: "Lucro bruto",
      value: formatBRL(stats?.lucroBruto ?? 0),
      hint: "Vendas − descontos − custo − taxa de cartão",
      icon: PiggyBank,
      tone: "text-emerald-600 bg-emerald-100",
      color: "#059669",
      delta: computeDelta(stats?.lucroBruto, prev?.lucroBruto, { kind: "percent", format: formatBRL }),
      spark: chartData.map((p) => p.lucro),
    },
    {
      key: "margem",
      label: "Margem bruta",
      // null = sem venda com custo cadastrado; "--" em vez de uma margem falsa
      value: stats?.margemBruta != null ? formatPct(stats.margemBruta) : "--",
      hint:
        stats?.margemBruta != null
          ? "Sobre as vendas com custo cadastrado"
          : "Cadastre o custo dos produtos para calcular",
      icon: Percent,
      tone: "text-sky-600 bg-sky-100",
      color: "#0284c7",
      delta: computeDelta(stats?.margemBruta, prev?.margemBruta, { kind: "points", format: formatPct }),
      bar: stats?.margemBruta ?? null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4" data-testid="hero-kpis">
      {cards.map((card) => {
        const Icon = card.icon;
        const bar = card.bar == null ? null : Math.max(0, Math.min(100, card.bar));
        return (
          <Card key={card.key} className="border border-border rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg shrink-0 ${card.tone}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
              </div>

              {loading ? (
                <div className="h-9 w-40 bg-muted animate-pulse rounded-lg" />
              ) : (
                <p className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight tabular-nums text-foreground [overflow-wrap:anywhere]">
                  {card.value}
                </p>
              )}

              {!loading && card.delta && <KpiDeltaLine delta={card.delta} label={comparisonLabel} />}
              {!loading && card.hint && <p className="text-[11px] text-muted-foreground leading-tight">{card.hint}</p>}

              {!loading && card.spark && <Sparkline values={card.spark} color={card.color} id={card.key} />}
              {!loading && bar !== null && (
                <div
                  className="h-2 w-full rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={bar}
                  aria-label="Margem bruta"
                >
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${bar}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
