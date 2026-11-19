import { apiFetch } from "./api";
import type { DashboardChartItem } from "./dashboard.service";

/** Filtros aceitos pela API de relatórios; cada relatório usa só os que fazem sentido. */
export interface ReportFilters {
  startDate: string;
  endDate: string;
  categoryId?: string;
  paymentMethod?: string;
  deliveryModality?: string;
  status?: string;
  paymentStatus?: string;
  idleDays?: number;
}

export interface ReportBucket {
  chave: string;
  nome: string;
  pedidos: number;
  valor: number;
  percentual: number;
}

export interface SalesReportOrder {
  numero: number;
  data: string;
  cliente: string;
  total: number;
  pagamento: string;
  statusPagamento: "PAID" | "PENDING";
  status: string;
  entrega: string;
}

export interface SalesReport {
  periodo: { inicio: string; fim: string; dias: number };
  resumo: {
    pedidos: number;
    faturamento: number;
    ticketMedio: number;
    itensVendidos: number;
    freteCobrado: number;
    descontos: number;
    taxaCartao: number;
    pedidosPagos: number;
    recebido: number;
    aReceber: number;
    /** null quando o filtro de status já escolhe um status. */
    cancelados: { pedidos: number; valor: number } | null;
  };
  comparacao: { faturamento: number; pedidos: number; ticketMedio: number } | null;
  serie: DashboardChartItem[];
  porPagamento: ReportBucket[];
  porEntrega: ReportBucket[];
  porStatus: ReportBucket[];
  pedidos: SalesReportOrder[];
  listaTruncada: boolean;
}

export interface FinancialReport {
  periodo: { inicio: string; fim: string; dias: number };
  resultado: {
    pedidos: number;
    faturamento: number;
    receitaItens: number;
    descontos: number;
    receitaLiquidaItens: number;
    custoProdutos: number;
    taxaCartao: number;
    lucroBruto: number;
    margemBruta: number | null;
    custosFixos: number;
    custosFixosProporcionais: boolean;
    lucroLiquido: number;
    margemLiquida: number;
    pontoEquilibrioReceita: number | null;
    pontoEquilibrioPedidos: number | null;
    receitaSemCusto: number;
  };
  custosFixosPorItem: { name: string; value: number }[];
  frete: { cobrado: number; pago: number; saldo: number; pedidosComFretePago: number };
  recebimentos: {
    recebido: number;
    aReceber: number;
    cancelados: { pedidos: number; valor: number } | null;
  };
  porPagamento: { nome: string; pedidos: number; valor: number; taxaCartao: number; percentual: number }[];
  caixa: {
    entradas: number;
    saidas: number;
    saldo: number;
    saidasPorCategoria: { categoria: string; valor: number }[];
  };
  serie: DashboardChartItem[];
}

export interface ReportProductRow {
  id: string;
  titulo: string;
  categoria: string;
  imagem?: string;
  unidadesAvulsas: number;
  unidadesEmCombos: number;
  unidadesTotais: number;
  receita: number;
  receitaLiquida: number;
  /** null = nenhuma venda com custo cadastrado. */
  lucro: number | null;
  margem: number | null;
  semCusto: boolean;
  estoque: number | null;
}

export interface ReportComboRow {
  id: string;
  titulo: string;
  categoria: string;
  imagem?: string;
  quantidade: number;
  receita: number;
  receitaLiquida: number;
  lucro: number | null;
  margem: number | null;
  semCusto: boolean;
  composicao: string | null;
}

export interface ReportIdleProduct {
  id: string;
  titulo: string;
  categoria: string;
  imagem?: string;
  estoque: number;
  preco: number | null;
  custoUnitario: number | null;
  capitalParado: number | null;
  ultimaVenda: string | null;
  nuncaVendeu: boolean;
  diasSemVender: number;
}

export interface ProductsReport {
  periodo: { inicio: string; fim: string };
  resumo: {
    /** Unidades reais de produto: avulsas + as que saíram dentro de boxes. */
    unidadesTotais: number;
    unidadesAvulsas: number;
    unidadesEmCombos: number;
    combosVendidos: number;
    /** Como o Dashboard conta: cada box vale 1. */
    itensContandoBoxComoUm: number;
    produtosDistintos: number;
    receita: number;
    lucro: number;
    margem: number | null;
    produtosSemCusto: number;
  };
  produtos: ReportProductRow[];
  combos: ReportComboRow[];
  listaTruncada: boolean;
  parados: {
    diasSemVender: number;
    quantidade: number;
    capitalParado: number;
    semCusto: number;
    itens: ReportIdleProduct[];
  };
}

function toQuery(filters: ReportFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") params.append(key, String(value));
  });
  return params.toString();
}

export async function getSalesReport(filters: ReportFilters): Promise<SalesReport> {
  const response = await apiFetch(`/reports/sales?${toQuery(filters)}`);
  return response.json();
}

export async function getFinancialReport(filters: ReportFilters): Promise<FinancialReport> {
  const response = await apiFetch(`/reports/financial?${toQuery(filters)}`);
  return response.json();
}

export async function getProductsReport(filters: ReportFilters): Promise<ProductsReport> {
  const response = await apiFetch(`/reports/products?${toQuery(filters)}`);
  return response.json();
}
