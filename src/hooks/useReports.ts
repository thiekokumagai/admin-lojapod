import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getFinancialReport,
  getProductsReport,
  getSalesReport,
  type ReportFilters,
} from "@/services/reports.service";

const STALE_MS = 60_000;

/** Cada relatório só consulta com a aba aberta (`enabled`); trocar filtro mantém a tela anterior esmaecida. */
export function useSalesReport(filters: ReportFilters | null, enabled: boolean) {
  return useQuery({
    queryKey: ["report-sales", filters],
    queryFn: () => getSalesReport(filters!),
    enabled: enabled && !!filters,
    staleTime: STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useFinancialReport(filters: ReportFilters | null, enabled: boolean) {
  return useQuery({
    queryKey: ["report-financial", filters],
    queryFn: () => getFinancialReport(filters!),
    enabled: enabled && !!filters,
    staleTime: STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useProductsReport(filters: ReportFilters | null, enabled: boolean) {
  return useQuery({
    queryKey: ["report-products", filters],
    queryFn: () => getProductsReport(filters!),
    enabled: enabled && !!filters,
    staleTime: STALE_MS,
    placeholderData: keepPreviousData,
  });
}
