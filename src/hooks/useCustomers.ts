import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { customersService } from '../services/customers.service';

export function useCustomers(search?: string, page: number = 1, limit: number = 10, isBlocked?: boolean | string) {
  return useQuery({
    queryKey: ['customers', { search, page, limit, isBlocked }],
    queryFn: () => customersService.getCustomers({ search, page, limit, isBlocked }),
  });
}

export function useInfiniteCustomers(search?: string, limit: number = 20, isBlocked?: boolean | string) {
  return useInfiniteQuery({
    queryKey: ['customers', 'infinite', { search, limit, isBlocked }],
    queryFn: ({ pageParam = 1 }) => customersService.getCustomers({ search, page: pageParam, limit, isBlocked }),
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useCustomerDetails(id: string | null) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => id ? customersService.getCustomerById(id) : null,
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; phone?: string; isBlocked?: boolean } }) =>
      customersService.updateCustomer(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
    },
  });
}

export function useToggleBlockCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersService.toggleBlockCustomer(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
}
