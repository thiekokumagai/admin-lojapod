import { apiFetch } from "./api";
import type { UserRole } from "@/lib/auth";

export interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
}

export interface StoreUserPayload {
  name: string;
  email: string;
  password?: string;
  permissions: string[];
}

export const usersService = {
  list: async (): Promise<StoreUser[]> => {
    const response = await apiFetch("/users");
    return response.json();
  },

  create: async (data: StoreUserPayload & { password: string }): Promise<StoreUser> => {
    const response = await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: Partial<StoreUserPayload>): Promise<StoreUser> => {
    const response = await apiFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  remove: async (id: string): Promise<void> => {
    await apiFetch(`/users/${id}`, { method: "DELETE" });
  },
};
