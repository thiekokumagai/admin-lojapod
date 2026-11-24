import { io, type Socket } from "socket.io-client";
import { getAccessToken, getApiBaseUrl, refreshAccessToken } from "@/services/api";

/** Intervalo mínimo entre duas renovações pedidas pelo socket (evita laço se o servidor seguir recusando). */
const RENEW_COOLDOWN_MS = 60_000;

export function getSocketUrl(): string {
  return getApiBaseUrl().replace(/\/api$/, "") || "http://localhost:3000";
}

/**
 * Socket do painel. Entra com o access token (o mesmo do HTTP) e o servidor só manda eventos da loja do token.
 * O token é lido a cada (re)conexão, então uma renovação feita pelo apiFetch já vale na próxima reconexão.
 * Se o servidor responder `session.invalid` (token vencido), renova a sessão e reconecta uma vez.
 */
export function createStoreSocket(namespace = ""): Socket {
  // `namespace` (ex.: "/scale") usa a mesma autenticação em outro canal do servidor
  const socket = io(`${getSocketUrl()}${namespace}`, {
    auth: (cb) => cb({ accessToken: getAccessToken() ?? undefined }),
  });

  let lastRenewAt = 0;
  socket.on("session.invalid", async () => {
    const now = Date.now();
    if (now - lastRenewAt < RENEW_COOLDOWN_MS) return;
    lastRenewAt = now;
    try {
      await refreshAccessToken(getAccessToken());
      socket.disconnect().connect();
    } catch {
      // Sessão expirada de vez: a próxima chamada do apiFetch leva ao login.
    }
  });

  return socket;
}
