import { useQuery } from "@tanstack/react-query";
import { getVariations } from "@/services/variation.service";

export function useVariations() {
  return useQuery({
    queryKey: ["variations"],
    queryFn: getVariations,
  });
}