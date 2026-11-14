import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getStoreDiagnosis } from "@/services/dashboard.service";
import type { DashboardRange } from "@/hooks/useDashboard";

/** Diagnóstico do período do Dashboard (o mesmo filtro de todas as abas). */
export function useStoreDiagnosis(range: DashboardRange | null, enabled = true) {
  return useQuery({
    queryKey: ["store-diagnosis", range?.start, range?.end],
    queryFn: () => getStoreDiagnosis(range!.start, range!.end),
    enabled: enabled && !!range,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
