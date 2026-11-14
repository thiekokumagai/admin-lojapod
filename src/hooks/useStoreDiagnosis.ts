import { useQuery } from "@tanstack/react-query";
import { getStoreDiagnosis } from "@/services/dashboard.service";

export function useStoreDiagnosis(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["store-diagnosis", startDate, endDate],
    queryFn: () => getStoreDiagnosis(startDate, endDate),
    staleTime: 60_000,
  });
}
