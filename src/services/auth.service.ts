import { getAuthSession, signIn, signOut, type AuthSession, type AuthUser } from "@/lib/auth";
import { clearAccessToken, getApiBaseUrl, setAccessToken } from "./api";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

function persistSession(session: AuthSession) {
  signIn(session);
  setAccessToken(session.accessToken);
}

export async function login(payload: LoginPayload) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const data = (await response.json()) as AuthResponse;
  persistSession(data);
  return data;
}

export async function refreshTokens() {
  const session = getAuthSession();

  if (!session?.refreshToken) {
    throw new Error("Sessão expirada.");
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${session.refreshToken}`,
    },
  });

  if (!response.ok) {
    clearSession();
    throw new Error("Não foi possível renovar a sessão.");
  }

  const data = (await response.json()) as AuthResponse;
  persistSession(data);
  return data;
}

export async function updatePassword(payload: { currentPassword: string; newPassword: string }) {
  const { apiFetch } = await import("./api");
  const response = await apiFetch("/users/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.json();
}

export function restoreAuthSession() {
  const session = getAuthSession();

  if (session?.accessToken) {
    setAccessToken(session.accessToken);
  } else {
    clearAccessToken();
  }

  return session;
}

export function clearSession() {
  signOut();
  clearAccessToken();
}

export const logout = clearSession;
