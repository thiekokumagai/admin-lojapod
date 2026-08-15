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

    return fetch(`${import.meta.env.VITE_ADMIN_API}${endpoint}`, {
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
    throw new Error(message);
  }

  return response;
}
