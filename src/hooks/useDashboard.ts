import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getDashboardOpportunities,
  getDashboardStats,
  type BestSellerSort,
} from "@/services/dashboard.service";
import { getCategories } from "@/services/category.service";

export interface DashboardRange {
  start: string;
  end: string;
}

export const DEFAULT_RANKING_SORT: BestSellerSort = "quantity";
/** Aba Estoque: atualiza sozinha a cada minuto (só com a aba aberta e a janela visível). */
export const STOCK_AUTO_REFRESH_MS = 60_000;
/** Quantos produtos a aba "Produtos" busca (máximo aceito pela API). */
export const PRODUCTS_TABLE_LIMIT = 100;

/**
 * KPIs, gráfico e estoque do período. Sem categoria: na API a categoria também filtra as
 * contagens de produtos/estoque, e esses cards devem mostrar a loja inteira.
 * `keepPreviousData` mantém os números na tela enquanto o próximo período carrega
 * (sem skeleton piscando) e o React Query descarta respostas de filtros antigos.
 */
export function useDashboardStats(range: DashboardRange | null, refetchInterval: number | false = false) {
  return useQuery({
    queryKey: ["dashboard-stats", range?.start, range?.end],
    queryFn: () => getDashboardStats(range!.start, range!.end, undefined, DEFAULT_RANKING_SORT),
    enabled: !!range,
    staleTime: 60_000,
    refetchInterval,
    placeholderData: keepPreviousData,
  });
}

/**
 * Ranking "Mais Vendidos" com categoria/ordenação. Na combinação padrão (todas as
 * categorias + quantidade) o ranking já vem em `useDashboardStats`, então não busca de novo.
 */
export function useDashboardRanking(
  range: DashboardRange | null,
  categoryId: string | undefined,
  sortBy: BestSellerSort,
) {
  const isDefault = !categoryId && sortBy === DEFAULT_RANKING_SORT;
  return useQuery({
    queryKey: ["dashboard-ranking", range?.start, range?.end, categoryId ?? "all", sortBy],
    queryFn: () => getDashboardStats(range!.start, range!.end, categoryId, sortBy, { compare: false }),
    select: (res) => res.bestSellers,
    enabled: !!range && !isDefault,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Tabela da aba "Produtos": todos os produtos do período (até PRODUCTS_TABLE_LIMIT),
 * ordenados por faturamento; a ordenação da tela é feita no cliente.
 */
export function useDashboardProducts(range: DashboardRange | null, categoryId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard-products", range?.start, range?.end, categoryId ?? "all"],
    queryFn: () =>
      getDashboardStats(range!.start, range!.end, categoryId, "revenue", {
        limit: PRODUCTS_TABLE_LIMIT,
        compare: false,
      }),
    select: (res) => res.bestSellers,
    enabled: enabled && !!range,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useDashboardOpportunities(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard-opportunities"],
    queryFn: getDashboardOpportunities,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useDashboardCategories() {
  return useQuery({
    queryKey: ["dashboard-categories"],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  });
}
