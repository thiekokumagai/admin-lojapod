import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  MousePointerClick,
  Clock,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getDashboardStats,
  getDashboardOpportunities,
  DashboardKPIs,
  DashboardChartItem,
  BestSellerItem,
  DashboardOpportunitiesResponse,
} from "@/services/dashboard.service";
import { getCategories } from "@/services/category.service";
import type { CategoryList } from "@/types/category";
import { buildImageUrl } from "@/utils/image-url";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { OnboardingWidget } from "@/components/admin/OnboardingWidget";
import { useOrders } from "@/hooks/useOrders";

type FilterType = "today" | "7days" | "30days" | "6months" | "year" | "custom";

export default function DashboardPage() {
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: ordersData, isLoading: isLoadingOrders } = useOrders(undefined, undefined, undefined, undefined, 1, 1);
  const [filter, setFilter] = useState<FilterType>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardKPIs | null>(null);
  const [chartData, setChartData] = useState<DashboardChartItem[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);

  const navigate = useNavigate();
  const [opportunitiesData, setOpportunitiesData] = useState<DashboardOpportunitiesResponse | null>(null);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);

  const fetchOpportunities = useCallback(async () => {
    setLoadingOpportunities(true);
    try {
      const res = await getDashboardOpportunities();
      setOpportunitiesData(res);
    } catch (err) {
      console.error("Erro ao carregar oportunidades de estoque", err);
    } finally {
      setLoadingOpportunities(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);
  const [categories, setCategories] = useState<CategoryList[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Load categories once on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Erro ao carregar categorias", err);
      }
    }
    loadCategories();
  }, []);

  // Helper to compute ISO dates based on filter
  const getFilterDates = useCallback((
    currentFilter: FilterType,
    startStr: string,
    endStr: string
  ) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (currentFilter === "today") {
      return { start: startOfToday.toISOString(), end: endOfToday.toISOString() };
    } else if (currentFilter === "7days") {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 6);
      return { start: start.toISOString(), end: endOfToday.toISOString() };
    } else if (currentFilter === "30days") {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 29);
      return { start: start.toISOString(), end: endOfToday.toISOString() };
    } else if (currentFilter === "6months") {
      const start = new Date(startOfToday);
      start.setMonth(start.getMonth() - 6);
      return { start: start.toISOString(), end: endOfToday.toISOString() };
    } else if (currentFilter === "year") {
      const start = new Date(startOfToday);
      start.setFullYear(start.getFullYear() - 1);
      return { start: start.toISOString(), end: endOfToday.toISOString() };
    } else if (currentFilter === "custom") {
      if (!startStr || !endStr) return null;
      // Parse local dates input
      const start = new Date(startStr + "T00:00:00");
      const end = new Date(endStr + "T23:59:59");
      return { start: start.toISOString(), end: end.toISOString() };
    }
    return null;
  }, []);

  // Fetch dashboard stats from backend
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const dates = getFilterDates(filter, customStart, customEnd);
      if (filter === "custom" && !dates) {
        setLoading(false);
        return; // Wait until custom dates are completed
      }

      const res = await getDashboardStats(
        dates?.start,
        dates?.end,
        selectedCategory === "all" ? undefined : selectedCategory
      );

      setStats(res.stats);
      setChartData(res.chartData);
      setBestSellers(res.bestSellers);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard", err);
    } finally {
      setLoading(false);
    }
  }, [filter, customStart, customEnd, selectedCategory, getFilterDates]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle standard range clicks
  const handleRangeClick = (type: FilterType) => {
    setFilter(type);
    if (type !== "custom") {
      setShowCustomRange(false);
    } else {
      setShowCustomRange(true);
    }
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchDashboard();
    }
  };

  // Define KPI cards with icons and dynamic values
  const row1Cards = [
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
      value: stats ? `R$ ${(stats.custoProdAtivos || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00",
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
      value: stats ? `R$ ${(stats.vendaTotalEstoque || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-100",
    },
  ];

  const row2Cards = [
    {
      label: "Total Vendas",
      value: stats ? `R$ ${(stats.totalVendas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Pedidos no Período",
      value: stats ? stats.totalPedidos : 0,
      icon: ShoppingBag,
      color: "text-sky-600 bg-sky-100",
    },
    {
      label: "Ticket Médio",
      value: stats ? `R$ ${(stats.ticketMedio || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Produtos Vendidos",
      value: stats ? stats.totalProdutosVendidos : 0,
      icon: Package,
      color: "text-amber-600 bg-amber-100",
    },
  ];

  const row3Cards = [
    {
      label: "Visitas",
      value: stats?.visitas ?? "--",
      icon: Users,
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      label: "Conversão",
      value: stats ? `${stats.conversao}%` : "--",
      icon: MousePointerClick,
      color: "text-rose-600 bg-rose-100",
    },
    {
      label: "Tempo Médio",
      value: stats ? `${stats.tempoMedio} min` : "--",
      icon: Clock,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Carrinhos Abandonados",
      value: stats?.abandonos ?? "--",
      icon: ShoppingCart,
      color: "text-amber-600 bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium">Monitore o desempenho das suas vendas em tempo real.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Date Filters Panel matching the user attached UI */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted rounded-xl border border-border">
            {[
              { id: "today", label: "Hoje" },
              { id: "7days", label: "7 dias" },
              { id: "30days", label: "30 dias" },
              { id: "6months", label: "6 meses" },
              { id: "year", label: "Ano" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleRangeClick(tab.id as FilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => handleRangeClick("custom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                filter === "custom"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              }`}
            >
              <Calendar className="h-3 w-3" />
              Filtrar por data
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchDashboard}
            disabled={loading}
            className="rounded-xl border border-border"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Onboarding Widget */}
      {(!loading && !isLoadingSettings && !isLoadingOrders) && (
        <OnboardingWidget 
          hasConfiguredStore={!!(settings?.logoUrl || settings?.pixKey || (settings?.cep && settings?.cep !== ""))}
          hasCategory={categories.length > 0}
          hasProduct={(stats?.produtosAtivos || 0) + (stats?.produtosInativos || 0) > 0}
          hasOrder={ordersData && ordersData.meta ? ordersData.meta.total > 0 : false}
        />
      )}

      {/* Custom Date Form Block */}
      {showCustomRange && (
        <Card className="bg-card border border-border rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleCustomDateSubmit} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data Final</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto rounded-xl">
                Aplicar Filtro
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards Section */}
      <div className="space-y-4">
        {/* Row 1 - 5 items */}
        {/* Central Acionável de Risco e Reposição de Estoque */}
        <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Controle de Risco & Estoque
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    • Ações Imediatas
                  </span>
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
                    <p className="text-[11px] text-rose-700 font-medium">
                      Abre produtos críticos
                    </p>
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
                    <p className="text-[11px] text-amber-700 font-medium">
                      Abre reposição rápida
                    </p>
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
                    <p className="text-[11px] text-slate-600 font-medium">
                      Abre produtos parados (+45d)
                    </p>
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
                    <p className="text-[11px] text-neutral-600 font-medium">
                      Abre produtos sem estoque
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Seção: 💡 Oportunidades do Dia & Decisão de Capital */}
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
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {item.subtitle}
                      </p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {row1Cards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <Card key={idx} className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    {loading ? (
                      <div className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <p className="text-xl font-bold text-foreground">{card.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>  
        {/* Row 2 - 4 items */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
          {row2Cards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <Card key={`r2-${idx}`} className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    {loading ? (
                      <div className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <p className="text-xl font-bold text-foreground">{card.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Row 3 - 4 items */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
          {row3Cards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <Card key={`r3-${idx}`} className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    {loading ? (
                      <div className="h-6 w-24 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <p className="text-xl font-bold text-foreground">{card.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Chart and Best Selling Products Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <Card className="lg:col-span-2 border border-border rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-base font-bold text-foreground mb-4">Evolução das Vendas</h2>
            <div className="h-80 w-full">
              {loading ? (
                <div className="h-full w-full bg-muted animate-pulse rounded-2xl flex items-center justify-center text-xs text-muted-foreground">
                  Carregando gráfico...
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full w-full border border-dashed rounded-2xl flex flex-col items-center justify-center text-sm text-muted-foreground gap-1">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  Sem dados de vendas neste período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(v: number) => [`R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Vendas"]}
                    />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Best Selling Products Column */}
        <Card className="border border-border rounded-2xl shadow-sm">
          <CardContent className="p-5 flex flex-col h-full">
            {/* Header + category filter dropdown */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-bold text-foreground">Mais Vendidos</h2>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-muted text-foreground border border-border rounded-lg text-xs font-semibold px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-32"
              >
                <option value="all">Categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            {/* List / Table of Products */}
            <div className="flex-1 space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 bg-muted rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-28 bg-muted rounded" />
                      <div className="h-2.5 w-16 bg-muted rounded" />
                    </div>
                    <div className="h-3 w-8 bg-muted rounded" />
                  </div>
                ))
              ) : bestSellers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 py-10 border border-dashed rounded-xl">
                  <Package className="h-6 w-6 text-muted-foreground/40" />
                  Nenhum produto vendido neste período
                </div>
              ) : (
                bestSellers.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-xl transition-colors"
                  >
                    {item.imageUrl ? (
                      <img
                        src={buildImageUrl(item.imageUrl)}
                        alt={item.title}
                        className="h-10 w-10 rounded-xl object-cover border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.categoryTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">{item.quantity} un.</p>
                      <p className="text-[10px] text-muted-foreground">
                        R$ {(item.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
