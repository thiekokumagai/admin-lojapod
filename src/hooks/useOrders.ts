import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getOrders, getOrderById, cancelOrder, receiveOrder, revertReceiveOrder, updateOrderStatus, markOrderPrinted, reprintOrder, updateOrder } from "@/services/order.service";
import { OrderStatus, PaymentStatus } from "@/types/order";

export function useOrders(
  search?: string, 
  status?: string, 
  startDate?: string, 
  endDate?: string,
  page?: number,
  limit?: number,
  paymentStatus?: string,
  options?: Omit<import("@tanstack/react-query").UseQueryOptions<any, any, any, any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ["orders", { search, status, startDate, endDate, page, limit, paymentStatus }],
    queryFn: () => getOrders(search, status, startDate, endDate, page, limit, paymentStatus),
    ...options
  });
}

export function useInfiniteOrders(
  search?: string, 
  status?: string, 
  startDate?: string, 
  endDate?: string,
  limit: number = 20,
  paymentStatus?: string,
  options?: any
) {
  return useInfiniteQuery({
    queryKey: ["orders", "infinite", { search, status, startDate, endDate, limit, paymentStatus }],
    queryFn: ({ pageParam = 1 }) => getOrders(search, status, startDate, endDate, pageParam, limit, paymentStatus),
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
    ...options
  });
}

export function useOrderDetails(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-summary"] });
    },
  });
}

export function useReceiveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => receiveOrder(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-summary"] });
    },
  });
}

export function useRevertReceiveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revertReceiveOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-summary"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: OrderStatus; paymentStatus?: PaymentStatus } }) => 
      updateOrderStatus(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-summary"] });
    },
  });
}

export function useMarkOrderAsPrinted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markOrderPrinted(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
    },
  });
}

export function useReprintOrder() {
  return useMutation({
    mutationFn: (id: string) => reprintOrder(id),
  });
}

export function useUpdateOrderFull() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateOrder(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-summary"] });
    },
  });
}
