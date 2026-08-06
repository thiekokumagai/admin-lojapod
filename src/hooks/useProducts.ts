import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getProducts } from "@/services/product.service";
import type { ProductListParams } from "@/types/product";

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
  });
}

export function useInfiniteProducts(params?: ProductListParams) {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", params],
    queryFn: ({ pageParam = 1 }) => getProducts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}