import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardChartItem } from "@/services/dashboard.service";
import { formatBRL, formatCompact } from "@/lib/dashboard-format";

interface SalesProfitChartProps {
  data: DashboardChartItem[];
  loading: boolean;
  /** Texto da legenda do período anterior (ex.: "vs. ontem"). */
  comparisonLabel: string;
}

const LEGEND = [
  { key: "vendas", label: "Faturamento", swatch: "bg-primary/40" },
  { key: "lucro", label: "Lucro", swatch: "bg-emerald-700" },
] as const;

/** Faturamento (barras) × lucro (linha), com o período anterior pontilhado quando existe. */
export function SalesProfitChart({ data, loading, comparisonLabel }: SalesProfitChartProps) {
  const hasPrevious = data.some((p) => p.vendasAnterior !== undefined);
  const hasSales = data.some((p) => p.vendas > 0);

  return (
    <Card className="border border-border rounded-2xl shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-bold text-foreground">Faturamento × Lucro</h2>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground" aria-label="Legenda do gráfico">
            {LEGEND.map((l) => (
              <li key={l.key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${l.swatch}`} aria-hidden="true" />
                {l.label}
              </li>
            ))}
            {hasPrevious && (
              <li className="flex items-center gap-1.5">
                <span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden="true" />
                Faturamento {comparisonLabel}
              </li>
            )}
          </ul>
        </div>

        <div className="h-64 sm:h-80 w-full">
          {loading ? (
            <div className="h-full w-full bg-muted animate-pulse rounded-2xl flex items-center justify-center text-xs text-muted-foreground">
              Carregando gráfico...
            </div>
          ) : !hasSales ? (
            <div className="h-full w-full border border-dashed rounded-2xl flex flex-col items-center justify-center text-sm text-muted-foreground gap-1">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
              Sem dados de vendas neste período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={formatCompact}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number, name: string) => [formatBRL(value), name]}
                />
                <Bar dataKey="vendas" name="Faturamento" fill="hsl(var(--primary))" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  name="Lucro"
                  stroke="#047857"
                  strokeWidth={2.5}
                  dot={data.length <= 12}
                  activeDot={{ r: 4 }}
                />
                {hasPrevious && (
                  <Line
                    type="monotone"
                    dataKey="vendasAnterior"
                    name={`Faturamento ${comparisonLabel}`}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
