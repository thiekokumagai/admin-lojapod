import { apiFetch } from './api';

export const importsService = {
  importCategories: async () => {
    const response = await apiFetch('/imports/vendizap/categories', { method: 'POST' });
    return response.json();
  },

  importProducts: async () => {
    const response = await apiFetch('/imports/vendizap/products', { method: 'POST' });
    return response.json();
  },

  fixProductCategories: async () => {
    const response = await apiFetch('/imports/vendizap/products/fix-categories', { method: 'POST' });
    return response.json();
  },

  importProductImages: async () => {
    const response = await apiFetch('/imports/vendizap/products/images', { method: 'POST' });
    return response.json();
  },

  importProductVariations: async () => {
    const response = await apiFetch('/imports/vendizap/products/variations', { method: 'POST' });
    return response.json();
  },

  importOrders: async () => {
    const response = await apiFetch('/imports/vendizap/orders', { method: 'POST' });
    return response.json();
  },

  clearDatabase: async () => {
    const response = await apiFetch('/imports/vendizap/clear', { method: 'DELETE' });
    return response.json();
  },

  importWpCashRegisters: async () => {
    const response = await apiFetch('/imports/wordpress/cash-registers', { method: 'POST' });
    return response.json();
  },

  importWpProductCosts: async () => {
    const response = await apiFetch('/imports/wordpress/product-costs', { method: 'POST' });
    return response.json();
  }
};
