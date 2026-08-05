import { apiFetch } from "./api";

export interface Coupon {
  id: string;
  title: string;
  status: boolean;
  type: "VALUE" | "PERCENTAGE" | "FREE_SHIPPING";
  value?: number;
  validUntilDate?: string;
  startTime?: string;
  endTime?: string;
  maxUses?: number;
  currentUses: number;
  minOrderValue?: number;
  applyToPromotionalItems: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getCoupons = async (): Promise<Coupon[]> => {
  const response = await apiFetch("/coupons");
  return response.json();
};

export const createCoupon = async (payload: Partial<Coupon>): Promise<Coupon> => {
  const response = await apiFetch("/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const updateCoupon = async (id: string, payload: Partial<Coupon>): Promise<Coupon> => {
  const response = await apiFetch(`/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const toggleCouponStatus = async (id: string): Promise<Coupon> => {
  const response = await apiFetch(`/coupons/${id}/toggle-status`, {
    method: "PATCH",
  });
  return response.json();
};
