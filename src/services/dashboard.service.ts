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
