import { useQuery } from "@tanstack/react-query";
import { getProductItems } from "@/services/product.service";

export function useProductItems(productId: string) {
  return useQuery({
    queryKey: ["product-items", productId],
    queryFn: () => getProductItems(productId),
    enabled: !!productId,
  });
}