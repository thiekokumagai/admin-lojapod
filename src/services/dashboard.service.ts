import { apiFetch } from "./api";

export interface DashboardKPIs {
  totalVendas: number;
  totalPedidos: number;
  ticketMedio: number;
  totalProdutosVendidos: number;
  produtosAtivos: number;
  produtosInativos: number;
  visitas: number;
  conversao: number;
  tempoMedio: number;
  abandonos: number;
  qtdTotalEstoque?: number;
  custoProdAtivos?: number;
  vendaTotalEstoque?: number;
}

export interface DashboardChartItem {
  name: string;
  vendas: number;
}

export interface BestSellerItem {
  id: string;
  title: string;
  categoryTitle: string;
  quantity: number;
  totalRevenue: number;
  imageUrl?: string;
}

export interface DashboardStatsResponse {
  stats: DashboardKPIs;
  chartData: DashboardChartItem[];
  bestSellers: BestSellerItem[];
}

export async function getDashboardStats(
  startDate?: string,
  endDate?: string,
  categoryId?: string
): Promise<DashboardStatsResponse> {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (categoryId) queryParams.append("categoryId", categoryId);

  const response = await apiFetch(`/dashboard/stats?${queryParams.toString()}`);
  return response.json();
}

export interface OpportunityCard {
  id: string;
  type: 'trending_up' | 'trending_down' | 'low_margin' | 'stagnant' | 'high_potential';
  title: string;
  subtitle: string;
  badge: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'purple';
  productId: string;
  productTitle: string;
  categoryName: string;
  metricLabel: string;
  metricValue: string;
  actionText: string;
  actionUrl: string;
}

export interface StockRiskKPIs {
  criticalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  stagnantCount: number;
  stagnantCapital: number;
  totalActiveProducts: number;
  totalStockQuantity: number;
  totalStockCost: number;
}

export interface DashboardOpportunitiesResponse {
  kpis: StockRiskKPIs;
  criticalProducts: Array<{
    id: string;
    title: string;
    category: string;
    stock: number;
    minStock: number;
    coverageDays: number | null;
    dailyRunRate: number;
    costPrice: number;
    price: number;
  }>;
  stagnantProducts: Array<{
    id: string;
    title: string;
    category: string;
    stock: number;
    daysWithoutSales: number;
    costPrice: number;
    totalStagnantValue: number;
  }>;
  opportunities: OpportunityCard[];
}

export async function getDashboardOpportunities(): Promise<DashboardOpportunitiesResponse> {
  const response = await apiFetch('/dashboard/opportunities');
  return response.json();
}
