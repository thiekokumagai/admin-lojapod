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
  /** Lucro bruto = itens - descontos - custo - taxa de cartão (frete fora). Só itens com custo cadastrado. */
  lucroBruto: number;
  /** null quando não há venda com custo cadastrado. */
  margemBruta: number | null;
  custoProdutosVendidos: number;
  descontosConcedidos: number;
  taxaCartao: number;
  receitaItens: number;
  receitaComCusto: number;
}

export interface DashboardMissingCost {
  count: number;
  receitaLiquida: number;
  produtos: { id: string; title: string }[];
}

export type BestSellerSort = "quantity" | "revenue" | "profit" | "margin";

export interface DashboardChartItem {
  name: string;
  vendas: number;
  /** Lucro bruto do ponto (só itens com custo cadastrado). */
  lucro: number;
  /** Faturamento do ponto equivalente no período anterior; ausente sem comparação. */
  vendasAnterior?: number;
}

export interface BestSellerVariation {
  /** Texto da variação gravado no pedido (ex.: "P / Azul") ou "Sem variação". */
  label: string;
  quantity: number;
  totalRevenue: number;
}

export interface BestSellerItem {
  id: string;
  title: string;
  categoryTitle: string;
  quantity: number;
  totalRevenue: number;
  imageUrl?: string;
  /** Receita líquida (após descontos) das vendas com custo; base da margem. */
  receitaLiquida: number;
  /** null = nenhuma venda com custo cadastrado. */
  lucro: number | null;
  margem: number | null;
  semCusto: boolean;
  /** Vendas por variação (só quando o produto vendeu com variação); soma = quantity/totalRevenue. */
  variacoes?: BestSellerVariation[];
}

/**
 * Mesmos KPIs no período anterior equivalente: mesmo tamanho e cortado no mesmo ponto
 * (ex.: "Hoje" às 14h compara com ontem até 14h).
 */
export interface DashboardComparison {
  inicio: string;
  fim: string;
  totalVendas: number;
  totalPedidos: number;
  ticketMedio: number;
  totalProdutosVendidos: number;
  lucroBruto: number;
  margemBruta: number | null;
  visitas: number;
  conversao: number;
  abandonos: number;
}

export interface DashboardStatsResponse {
  stats: DashboardKPIs;
  /** null quando não há período anterior. Ausente em versões antigas da API. */
  comparacao?: DashboardComparison | null;
  semCusto: DashboardMissingCost;
  chartData: DashboardChartItem[];
  bestSellers: BestSellerItem[];
}

export async function getDashboardStats(
  startDate?: string,
  endDate?: string,
  categoryId?: string,
  sortBy: BestSellerSort = "quantity",
  options: { limit?: number; compare?: boolean } = {}
): Promise<DashboardStatsResponse> {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (categoryId) queryParams.append("categoryId", categoryId);
  queryParams.append("sortBy", sortBy);
  if (options.limit) queryParams.append("limit", String(options.limit));
  if (options.compare === false) queryParams.append("compare", "false");

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

export type DiagnosisSeverity = "critical" | "warning" | "info" | "ok";

export interface DiagnosisItem {
  id: string;
  severity: DiagnosisSeverity;
  title: string;
  detail: string;
  /** Quanto custou (ou pode custar) no período, em R$. null = sem valor em R$. */
  amount: number | null;
  /** true quando o valor é uma estimativa/potencial, não algo já perdido. */
  estimated: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

export interface StoreDiagnosisResponse {
  periodo: { dias: number };
  resultado: {
    lucroBruto: number;
    custosFixos: number;
    lucroLiquido: number;
    custosFixosProporcionais: boolean;
    pontoEquilibrioReceita: number | null;
    pontoEquilibrioPedidos: number | null;
    receitaLiquidaItens: number;
    pedidos: number;
  };
  custosFixosPorItem: { name: string; value: number }[];
  itens: DiagnosisItem[];
}

export async function getStoreDiagnosis(
  startDate: string,
  endDate: string
): Promise<StoreDiagnosisResponse> {
  const queryParams = new URLSearchParams({ startDate, endDate });
  const response = await apiFetch(`/dashboard/diagnosis?${queryParams.toString()}`);
  return response.json();
}
