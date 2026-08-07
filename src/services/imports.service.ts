import { apiFetch } from './api';

export const importsService = {
  clearDatabase: async () => {
    const response = await apiFetch('/imports/clear', { method: 'DELETE' });
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
