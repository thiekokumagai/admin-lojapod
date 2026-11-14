import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, DollarSign, Package, RefreshCw, Sparkles, XCircle } from "lucide-react";
import type { DashboardKPIs } from "@/services/dashboard.service";
import { useDashboardOpportunities } from "@/hooks/useDashboard";

interface StockTabProps {
  stats: DashboardKPIs | null;
  loading: boolean;
  /** Recarrega também os números de estoque que vêm do /dashboard/stats. */
  onRefreshStats: () => void;
}

/** Estoque & Risco: situação ATUAL do estoque (não depende do período escolhido no topo). */
export function StockTab({ stats, loading, onRefreshStats }: StockTabProps) {
  const navigate = useNavigate();
  const opportunitiesQuery = useDashboardOpportunities(true);
  const opportunitiesData = opportunitiesQuery.data ?? null;
  const loadingOpportunities = opportunitiesQuery.isPending;

  const refreshStock = () => {
    void opportunitiesQuery.refetch();
    onRefreshStats();
  };

  const inventoryCards = [
    {
      label: "Produtos Ativos",
      value: stats ? stats.produtosAtivos : 0,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Qtd. Total Estoque",
      value: stats ? (stats.qtdTotalEstoque || 0) : 0,
      icon: Package,
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      label: "Custo Prod. Ativos",
      value: stats ? `R$ ${(stats.custoProdAtivos || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ 0,00",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Produtos Inativos",
      value: stats ? stats.produtosInativos : 0,
      icon: XCircle,
      color: "text-slate-600 bg-slate-200",
    },
    {
      label: "Venda Total Estoque",
      value: stats ? `R$ ${(stats.vendaTotalEstoque || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ 0,00",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStock}
          disabled={opportunitiesQuery.isFetching}
          className="rounded-xl border border-border gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${opportunitiesQuery.isFetching ? "animate-spin" : ""}`} />
          Atualizar estoque
        </Button>
      </div>

      {/* Inventory KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {inventoryCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <Card key={idx} className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${card.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
                  <p className="text-xs text-muted-foreground font-medium leading-tight">{card.label}</p>
                  {loading ? (
                    <div className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold leading-tight tabular-nums text-foreground [overflow-wrap:anywhere]">{card.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controle de Risco & Estoque */}
      <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Controle de Risco & Estoque
                </h2>
                <span className="text-xs text-muted-foreground font-medium">• Ações Imediatas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Monitore os gargalos de estoque e tome decisões de compra ou queima com 1 clique.
              </p>
            </div>

            <Button
              onClick={() => navigate("/investimentos/analise-compras")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all self-start lg:self-auto"
            >
              <span>Ver reposição completa</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* 🔴 Produtos Críticos */}
            <button
              onClick={() => navigate("/produtos?status=critical")}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 text-left transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔴</span>
                <div>
                  <p className="text-xs font-bold text-rose-950 group-hover:underline">
                    {opportunitiesData?.kpis.criticalCount ?? "--"} produtos podem acabar
                  </p>
                  <p className="text-[11px] text-rose-700 font-medium">Abre produtos críticos</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 🟠 Abaixo do Mínimo */}
            <button
              onClick={() => navigate("/produtos?status=low_stock")}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 text-left transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🟠</span>
                <div>
                  <p className="text-xs font-bold text-amber-950 group-hover:underline">
                    {opportunitiesData?.kpis.lowStockCount ?? "--"} abaixo do mínimo
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium">Abre reposição rápida</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 📦 Capital Parado */}
            <button
              onClick={() => navigate("/produtos?status=stagnant")}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-left transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:underline">
                    R$ {(opportunitiesData?.kpis.stagnantCapital ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })} parados
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">Abre produtos parados (+45d)</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* ⛔ Zerados */}
            <button
              onClick={() => navigate("/produtos?status=out_of_stock")}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-neutral-100/70 hover:bg-neutral-200/70 border border-neutral-200 text-left transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⛔</span>
                <div>
                  <p className="text-xs font-bold text-neutral-900 group-hover:underline">
                    {opportunitiesData?.kpis.outOfStockCount ?? "--"} produtos zerados
                  </p>
                  <p className="text-[11px] text-neutral-600 font-medium">Abre produtos sem estoque</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sugestões & Oportunidades */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Sugestões & Oportunidades do Dia
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Alocação de Capital
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                O sistema analisa suas margens e saídas para indicar onde vale a pena colocar dinheiro.
              </p>
            </div>
          </div>
        </div>

        {loadingOpportunities ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse border border-border" />
            ))}
          </div>
        ) : opportunitiesQuery.isError && !opportunitiesData ? (
          <Card className="border border-rose-200 bg-rose-50/60 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-xs font-medium text-rose-900">
              Não foi possível carregar as sugestões. {opportunitiesQuery.error?.message}
            </p>
            <Button size="sm" variant="outline" onClick={refreshStock} className="rounded-xl gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar de novo
            </Button>
          </Card>
        ) : !opportunitiesData?.opportunities || opportunitiesData.opportunities.length === 0 ? (
          <Card className="border border-dashed border-border rounded-2xl p-6 text-center text-xs text-muted-foreground">
            Nenhuma oportunidade urgente identificada no momento. Seu catálogo está com giro equilibrado.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {opportunitiesData.opportunities.map((item) => (
              <Card
                key={item.id}
                className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group bg-card"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        item.variant === "purple"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : item.variant === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.variant === "warning"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : item.variant === "danger"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[120px]">
                      {item.categoryName}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.subtitle}</p>
                  </div>

                  <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">{item.metricLabel}: </span>
                      <span className="font-bold text-foreground">{item.metricValue}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(item.actionUrl)}
                      className="text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 p-0 h-auto flex items-center gap-1"
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
