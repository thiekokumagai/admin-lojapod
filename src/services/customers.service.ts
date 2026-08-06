import { apiFetch } from './api';

export interface CustomerAddress {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  complement?: string | null;
  isDefault: boolean;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  addresses: CustomerAddress[];
  orders?: any[];
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const customersService = {
  getCustomers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const response = await apiFetch(`/customers${query ? `?${query}` : ''}`);
    return response.json() as Promise<PaginatedCustomers>;
  },

  getCustomerById: async (id: string) => {
    const response = await apiFetch(`/customers/${id}`);
    return response.json() as Promise<Customer>;
  },

  createCustomer: async (data: { name: string; phone: string }) => {
    const response = await apiFetch(`/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Customer>;
  },

  updateCustomer: async (id: string, data: { name?: string; phone?: string }) => {
    const response = await apiFetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Customer>;
  },

  updateAddress: async (customerId: string, addressId: string, data: Partial<CustomerAddress>) => {
    const response = await apiFetch(`/customers/${customerId}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Customer>;
  },

  addAddress: async (customerId: string, data: Partial<CustomerAddress>) => {
    const response = await apiFetch(`/customers/${customerId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Customer>;
  }
};
