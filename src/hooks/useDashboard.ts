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

/**
 * KPIs, gráfico e estoque do período. Sem categoria: na API a categoria também filtra as
 * contagens de produtos/estoque, e esses cards devem mostrar a loja inteira.
 * `keepPreviousData` mantém os números na tela enquanto o próximo período carrega
 * (sem skeleton piscando) e o React Query descarta respostas de filtros antigos.
 */
export function useDashboardStats(range: DashboardRange | null) {
  return useQuery({
    queryKey: ["dashboard-stats", range?.start, range?.end],
    queryFn: () => getDashboardStats(range!.start, range!.end, undefined, DEFAULT_RANKING_SORT),
    enabled: !!range,
    staleTime: 60_000,
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
    queryFn: () => getDashboardStats(range!.start, range!.end, categoryId, sortBy),
    select: (res) => res.bestSellers,
    enabled: !!range && !isDefault,
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
