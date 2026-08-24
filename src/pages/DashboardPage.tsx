import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp, Package, Calendar, RefreshCw, CheckCircle, XCircle, Users, MousePointerClick, Clock, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDashboardStats, DashboardKPIs, DashboardChartItem, BestSellerItem } from "@/services/dashboard.service";
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
  const kpiCards = [
    {
      label: "Total Vendas",
      value: stats ? `R$ ${stats.totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00",
      icon: DollarSign,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Pedidos no Período",
      value: stats ? stats.totalPedidos : 0,
      icon: ShoppingBag,
      color: "text-info bg-info/10",
    },
    {
      label: "Ticket Médio",
      value: stats ? `R$ ${stats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0,00",
      icon: TrendingUp,
      color: "text-success bg-success/10",
    },
    {
      label: "Produtos Vendidos",
      value: stats ? stats.totalProdutosVendidos : 0,
      icon: Package,
      color: "text-warning bg-warning/10",
    },
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

  const inventoryCards = [
    {
      label: "Produtos Ativos",
      value: stats ? stats.produtosAtivos : 0,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Produtos Inativos",
      value: stats ? stats.produtosInativos : 0,
      icon: XCircle,
      color: "text-slate-600 bg-slate-200",
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

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        {inventoryCards.map((card, idx) => {
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

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
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
                      formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Vendas"]}
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
                        R$ {item.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
