import { AUTH_STORAGE_KEY } from "@/lib/auth";
import {
  SessionExpiredError,
  clearSession,
  refreshTokens,
  restoreAuthSession,
} from "@/services/auth.service";

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
    const host = window.location.hostname.toLowerCase();
    // Se o painel está em *.podipedir.com.br (ex: admin.podipedir.com.br), mantém a API no mesmo domínio-base
    // para que o cookie HttpOnly de refresh token seja first-party
    if (
      (host === "podipedir.com.br" || host.endsWith(".podipedir.com.br")) &&
      base.includes("api.lojapod.com")
    ) {
      base = base.replace("api.lojapod.com", "api.podipedir.com.br");
    } else if (
      (host === "lojapod.com" || host.endsWith(".lojapod.com")) &&
      base.includes("api.podipedir.com.br")
    ) {
      base = base.replace("api.podipedir.com.br", "api.lojapod.com");
    } else if (host !== "localhost" && host !== "127.0.0.1" && base.includes("localhost")) {
      // Se o frontend está sendo acessado por IP da rede local (ex: celular 192.168.x.x) e a URL configurada aponta para localhost
      base = base.replace("localhost", host);
    }
  }
  return base;
}

restoreAuthSession();

// Outra aba renovou ou encerrou a sessão: acompanha para não usar um access token velho.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === AUTH_STORAGE_KEY || event.key === null) restoreAuthSession();
  });
}

export async function refreshAccessToken(staleAccessToken: string | null) {
  if (!refreshPromise) {
    refreshPromise = refreshTokens(staleAccessToken)
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

  const sentToken = accessToken;
  let response = await makeRequest();

  if (response.status === 401) {
    let nextAccessToken: string;
    try {
      nextAccessToken = await refreshAccessToken(sentToken);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        clearSession();
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }
      // Rede fora / servidor instável: mantém a sessão, o usuário só tenta de novo.
      throw error;
    }
    response = await makeRequest(nextAccessToken);
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

    const apiError = new Error(message) as Error & { status?: number; data?: unknown };
    apiError.status = response.status;
    apiError.data = errorData;
    throw apiError;
  }

  return response;
}
