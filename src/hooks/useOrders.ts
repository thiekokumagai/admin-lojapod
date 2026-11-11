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
  orderNumberOrOptions?: string | Omit<import("@tanstack/react-query").UseQueryOptions<any, any, any, any>, 'queryKey' | 'queryFn'>,
  options?: Omit<import("@tanstack/react-query").UseQueryOptions<any, any, any, any>, 'queryKey' | 'queryFn'>
) {
  const actualOrderNumber = typeof orderNumberOrOptions === 'string' ? orderNumberOrOptions : undefined;
  const actualOptions = typeof orderNumberOrOptions === 'object' ? orderNumberOrOptions : options;

  return useQuery({
    queryKey: ["orders", { search, status, startDate, endDate, page, limit, paymentStatus, orderNumber: actualOrderNumber }],
    queryFn: () => getOrders(search, status, startDate, endDate, page, limit, paymentStatus, actualOrderNumber),
    ...actualOptions
  });
}

export function useInfiniteOrders(
  search?: string, 
  status?: string, 
  startDate?: string, 
  endDate?: string,
  limit: number = 20,
  paymentStatus?: string,
  orderNumber?: string,
  options?: any
) {
  return useInfiniteQuery({
    queryKey: ["orders", "infinite", { search, status, startDate, endDate, limit, paymentStatus, orderNumber }],
    queryFn: ({ pageParam = 1 }) => getOrders(search, status, startDate, endDate, pageParam, limit, paymentStatus, orderNumber),
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

export const UPDATE_ORDER_STATUS_MUTATION_KEY = ["orders", "update-status"] as const;

type OrderStatusPayload = { status?: OrderStatus; paymentStatus?: PaymentStatus };

// Aplica o patch em qualquer formato de cache de pedidos (lista paginada, infinita ou detalhe)
function patchOrdersCache(data: any, id: string, payload: OrderStatusPayload): any {
  if (!data) return data;
  const patchList = (list: any[]) =>
    list.map((o) => (o?.id === id ? { ...o, ...payload } : o));

  if (Array.isArray(data.pages)) {
    return {
      ...data,
      pages: data.pages.map((p: any) =>
        p && Array.isArray(p.data) ? { ...p, data: patchList(p.data) } : p
      ),
    };
  }
  if (Array.isArray(data.data)) {
    return { ...data, data: patchList(data.data) };
  }
  if (Array.isArray(data)) {
    return patchList(data);
  }
  if (data.id === id) {
    return { ...data, ...payload };
  }
  return data;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: UPDATE_ORDER_STATUS_MUTATION_KEY,
    mutationFn: ({ id, payload }: { id: string; payload: OrderStatusPayload }) =>
      updateOrderStatus(id, payload),
    // Atualização otimista: muda o visual na hora e a API roda em segundo plano
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["orders"] });
      queryClient.setQueriesData({ queryKey: ["orders"] }, (old: any) =>
        patchOrdersCache(old, id, payload)
      );
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      // Desfaz o visual se a API falhar
      context?.snapshot?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      // Só revalida quando não houver outras mudanças pendentes,
      // evitando que um refetch "desfaça" visualmente um card ainda em andamento
      if (queryClient.isMutating({ mutationKey: UPDATE_ORDER_STATUS_MUTATION_KEY }) <= 1) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
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
