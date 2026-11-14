import { useMemo, useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, LayoutDashboard, Package, RefreshCw, Stethoscope, WifiOff } from "lucide-react";
import type { BestSellerSort, DashboardComparison } from "@/services/dashboard.service";
import { useSettings } from "@/hooks/useSettings";
import { useOrders } from "@/hooks/useOrders";
import { OnboardingWidget } from "@/components/admin/OnboardingWidget";
import { DiagnosisTab } from "@/components/admin/DiagnosisTab";
import { AttentionStrip } from "@/components/dashboard/AttentionStrip";
import { HeroKpis } from "@/components/dashboard/HeroKpis";
import { MissingCostNotice } from "@/components/dashboard/MissingCostNotice";
import { PeriodBar } from "@/components/dashboard/PeriodBar";
import { ProductsTab } from "@/components/dashboard/ProductsTab";
import { SalesProfitChart } from "@/components/dashboard/SalesProfitChart";
import { SecondaryMetrics } from "@/components/dashboard/SecondaryMetrics";
import { StockTab } from "@/components/dashboard/StockTab";
import { TopProducts } from "@/components/dashboard/TopProducts";
import {
  DEFAULT_RANKING_SORT,
  STOCK_AUTO_REFRESH_MS,
  useDashboardCategories,
  useDashboardRanking,
  useDashboardStats,
  type DashboardRange,
} from "@/hooks/useDashboard";
import { useStoreDiagnosis } from "@/hooks/useStoreDiagnosis";
import { COMPARISON_LABEL, describeRange, getPresetRange, type FilterType } from "@/lib/dashboard-range";

type ActiveTab = "resumo" | "produtos" | "estoque" | "diagnostico";

const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: "resumo", label: "Resumo", icon: LayoutDashboard },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "estoque", label: "Estoque", icon: AlertTriangle },
  { id: "diagnostico", label: "Diagnóstico", icon: Stethoscope },
];

// Que consultas cada aba recarrega no botão "Atualizar".
const REFRESH_KEYS: Record<Exclude<ActiveTab, "estoque">, string[]> = {
  resumo: ["dashboard-stats", "dashboard-ranking", "store-diagnosis"],
  produtos: ["dashboard-stats", "dashboard-products"],
  diagnostico: ["store-diagnosis"],
};
const isDashboardQuery = (key: unknown) =>
  typeof key === "string" && (key.startsWith("dashboard-") || key === "store-diagnosis");

export default function DashboardPage() {
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: ordersData, isLoading: isLoadingOrders } = useOrders(undefined, undefined, undefined, undefined, 1, 1);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("resumo");

  // Um só período para todas as abas.
  const [filter, setFilter] = useState<FilterType>("today");
  // Datas digitadas no formulário; só viram filtro ao clicar em "Aplicar Filtro".
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustom, setAppliedCustom] = useState<DashboardRange | null>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [rankingSort, setRankingSort] = useState<BestSellerSort>(DEFAULT_RANKING_SORT);

  const range = useMemo<DashboardRange | null>(
    () => (filter === "custom" ? appliedCustom : getPresetRange(filter)),
    [filter, appliedCustom],
  );

  // Na aba Estoque os números de estoque (que vêm do /stats) se atualizam sozinhos.
  const statsQuery = useDashboardStats(range, activeTab === "estoque" ? STOCK_AUTO_REFRESH_MS : false);
  const categoryId = selectedCategory === "all" ? undefined : selectedCategory;
  const rankingQuery = useDashboardRanking(range, categoryId, rankingSort);
  const diagnosisQuery = useStoreDiagnosis(range, activeTab === "resumo");
  const { data: categories = [] } = useDashboardCategories();

  const statsRes = statsQuery.data;
  const stats = statsRes?.stats ?? null;
  const chartData = statsRes?.chartData ?? [];
  const missingCost = statsRes?.semCusto ?? null;
  const prev: DashboardComparison | null = statsRes?.comparacao ?? null;
  const comparisonLabel = COMPARISON_LABEL[filter];

  // Sem nenhum dado ainda (primeira carga): skeleton. Trocando de período: mantém os
  // números anteriores esmaecidos até chegar a resposta nova.
  const loading = !!range && statsQuery.isPending;
  const isStale = statsQuery.isPlaceholderData;
  const awaitingCustomDates = filter === "custom" && !appliedCustom;

  const isDefaultRanking = !categoryId && rankingSort === DEFAULT_RANKING_SORT;
  const bestSellers = (isDefaultRanking ? statsRes?.bestSellers : rankingQuery.data) ?? statsRes?.bestSellers ?? [];
  const rankingUpdating = !isDefaultRanking && (rankingQuery.isPending || rankingQuery.isPlaceholderData);

  const handleFilterChange = (type: FilterType) => {
    setFilter(type);
    setShowCustomRange(type === "custom");
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      setAppliedCustom({ start: customStart.split("T")[0], end: customEnd.split("T")[0] });
    }
  };

  const refresh = () => {
    if (activeTab === "estoque") return;
    REFRESH_KEYS[activeTab].forEach((key) => void queryClient.invalidateQueries({ queryKey: [key] }));
  };
  const refreshing = useIsFetching({ predicate: (q) => isDashboardQuery(q.queryKey[0]) }) > 0;

  const showPeriod = activeTab !== "estoque";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Cabeçalho: título e período. O filtro vale para todas as abas. */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">
            {showPeriod
              ? `${describeRange(filter, range) || "Escolha um período"} · desempenho das suas vendas`
              : "Situação atual do estoque"}
          </p>
        </div>
        {showPeriod && (
          <PeriodBar
            filter={filter}
            onFilterChange={handleFilterChange}
            showCustomRange={showCustomRange}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
            onApplyCustom={handleApplyCustom}
            refreshing={refreshing}
            refreshDisabled={!range || refreshing}
            onRefresh={refresh}
          />
        )}
      </div>

      {/* Onboarding: depende só de já ter dados (não do loading), para não sumir a cada troca de filtro */}
      {stats && !isLoadingSettings && !isLoadingOrders && (
        <OnboardingWidget
          hasConfiguredStore={!!(settings?.logoUrl || settings?.pixKey || (settings?.cep && settings?.cep !== ""))}
          hasCategory={categories.length > 0}
          hasProduct={(stats.produtosAtivos || 0) + (stats.produtosInativos || 0) > 0}
          hasOrder={ordersData && ordersData.meta ? ordersData.meta.total > 0 : false}
        />
      )}

      {/* Abas */}
      <div
        className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-muted rounded-xl border border-border w-full sm:w-fit"
        role="tablist"
        aria-label="Seções do dashboard"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`dashboard-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 rounded-lg text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "estoque" ? (
        <StockTab stats={stats} loading={loading} />
      ) : awaitingCustomDates ? (
        <Card className="border border-dashed border-border rounded-2xl">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Calendar className="h-8 w-8 text-muted-foreground/50" />
            Escolha a data inicial e a final e clique em{" "}
            <span className="font-semibold text-foreground">Aplicar Filtro</span>.
          </CardContent>
        </Card>
      ) : activeTab === "diagnostico" ? (
        <DiagnosisTab range={range} />
      ) : activeTab === "produtos" ? (
        <ProductsTab
          range={range}
          stats={stats}
          missingCost={missingCost}
          categories={categories}
          categoryId={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      ) : statsQuery.isError && !stats ? (
        <Card className="border border-rose-200 bg-rose-50/60 rounded-2xl">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-3 text-center">
            <WifiOff className="h-8 w-8 text-rose-400" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-900">Não foi possível carregar o dashboard</p>
              <p className="text-xs text-rose-700">{statsQuery.error?.message || "Verifique sua conexão e tente de novo."}</p>
            </div>
            <Button size="sm" variant="outline" onClick={refresh} disabled={statsQuery.isFetching} className="rounded-xl gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
              Tentar de novo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Falhou ao atualizar mas há dados anteriores: mantém na tela e avisa */}
          {statsQuery.isError && stats && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-900"
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                <WifiOff className="h-4 w-4 shrink-0" />
                Não foi possível atualizar. Os números abaixo podem estar desatualizados.
              </div>
              <Button size="sm" variant="outline" onClick={refresh} disabled={statsQuery.isFetching} className="rounded-xl gap-2 self-start sm:self-auto">
                <RefreshCw className={`h-3.5 w-3.5 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
                Tentar de novo
              </Button>
            </div>
          )}

          <div
            className={`space-y-4 sm:space-y-6 transition-opacity ${isStale ? "opacity-60" : ""}`}
            aria-busy={statsQuery.isFetching}
          >
            {/* No topo: os números do dia a dia (pedidos, ticket, itens, visitas, conversão...) */}
            <SecondaryMetrics stats={stats} prev={prev} loading={loading} comparisonLabel={comparisonLabel} />

            <HeroKpis stats={stats} prev={prev} chartData={chartData} loading={loading} comparisonLabel={comparisonLabel} />

            {!loading && <MissingCostNotice missingCost={missingCost} />}

            <AttentionStrip
              items={diagnosisQuery.data?.itens}
              loading={diagnosisQuery.isPending && diagnosisQuery.fetchStatus !== "idle"}
              onSeeAll={() => setActiveTab("diagnostico")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <SalesProfitChart data={chartData} loading={loading} comparisonLabel={comparisonLabel} />
              </div>
              <TopProducts
                items={bestSellers}
                totalRevenue={stats?.receitaItens ?? 0}
                sort={rankingSort}
                onSortChange={setRankingSort}
                categories={categories}
                categoryId={selectedCategory}
                onCategoryChange={setSelectedCategory}
                loading={loading}
                updating={rankingUpdating}
                onSeeAll={() => setActiveTab("produtos")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
