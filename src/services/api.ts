import { clearSession, refreshTokens, restoreAuthSession } from "@/services/auth.service";

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const getAccessToken = () => accessToken;

export function getApiBaseUrl(): string {
  let base = import.meta.env.VITE_ADMIN_API || "http://localhost:3000/api";
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    // Se o frontend está sendo acessado por IP da rede local (ex: celular 192.168.x.x) e a URL configurada aponta para localhost
    if (host !== "localhost" && host !== "127.0.0.1" && base.includes("localhost")) {
      base = base.replace("localhost", host);
    }
  }
  return base;
}

restoreAuthSession();

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshTokens()
      .then((session) => session.accessToken)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const makeRequest = async (tokenOverride?: string) => {
    const headers = new Headers(options.headers ?? undefined);

    if (!headers.has("accept")) {
      headers.set("accept", "application/json");
    }

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const token = tokenOverride ?? accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let response = await makeRequest();

  if (response.status === 401) {
    try {
      const nextAccessToken = await refreshAccessToken();
      response = await makeRequest(nextAccessToken);
    } catch {
      clearSession();
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || `Erro na API: ${response.status}`;

    if (response.status === 403 && (message.includes("Loja Inativa") || errorData.message === "Loja Inativa")) {
      if (window.location.pathname !== "/suspended") {
        window.location.href = "/suspended";
      }
    }

    throw new Error(message);
  }

  return response;
}
