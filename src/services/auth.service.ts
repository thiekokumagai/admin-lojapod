import { getAuthSession, signIn, signOut, type AuthSession } from "@/lib/auth";
import { clearAccessToken, setAccessToken } from "./api";

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

const API_BASE_URL = import.meta.env.VITE_ADMIN_API;

function persistSession(session: AuthSession) {
  signIn(session);
  setAccessToken(session.accessToken);
}

export async function login(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
