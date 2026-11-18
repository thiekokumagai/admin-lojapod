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

/**
 * O servidor recusou o refresh token (ou não há sessão): a sessão acabou de verdade.
 * Qualquer outra falha (rede fora, 5xx, 429) é temporária e NÃO pode apagar a sessão.
 */
export class SessionExpiredError extends Error {
  constructor(message = "Sessão expirada.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * 409/503 do /auth/refresh = disputa de gravação no servidor: nada foi gasto e o refresh token
 * continua valendo. Tenta de novo (pausas em ms, uma por tentativa extra) antes de desistir,
 * sempre sem apagar a sessão.
 */
export const REFRESH_RETRY_DELAYS_MS = [300, 900];

async function runRefresh(staleAccessToken?: string | null): Promise<AuthSession> {
  for (let attempt = 0; ; attempt++) {
    const session = getAuthSession();

    if (!session?.refreshToken) {
      throw new SessionExpiredError();
    }

    // Outra aba/janela já renovou enquanto esperávamos a vez: o refresh token é de uso único
    // (rotação), então reaproveita a sessão nova em vez de gastar o token de novo.
    if (staleAccessToken && session.accessToken !== staleAccessToken) {
      setAccessToken(session.accessToken);
      return session;
    }

    let response: Response;
    try {
      response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${session.refreshToken}`,
        },
      });
    } catch {
      throw new Error("Sem conexão para renovar a sessão. Tente novamente.");
    }

    if ((response.status === 409 || response.status === 503) && attempt < REFRESH_RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAYS_MS[attempt]));
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      // Outra aba pode ter rotacionado o token entre a nossa leitura e a resposta.
      const latest = getAuthSession();
      if (latest && latest.refreshToken !== session.refreshToken) {
        setAccessToken(latest.accessToken);
        return latest;
      }
      throw new SessionExpiredError("Não foi possível renovar a sessão.");
    }

    if (!response.ok) {
      throw new Error("Não foi possível renovar a sessão agora. Tente novamente.");
    }

    const data = (await response.json()) as AuthResponse;
    persistSession(data);
    return data;
  }
}

/**
 * Renova a sessão. O lock do navegador (Web Locks) serializa abas e janelas do mesmo site:
 * sem ele, duas abas gastavam o mesmo refresh token e a segunda derrubava a sessão de todas.
 */
export function refreshTokens(staleAccessToken?: string | null): Promise<AuthSession> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return runRefresh(staleAccessToken);
  return locks.request("admin-auth-refresh", () => runRefresh(staleAccessToken));
}

/** Troca a senha do próprio usuário logado. O servidor encerra as sessões abertas depois da troca. */
export async function updatePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
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

/** Tempo máximo esperando o servidor no "Sair": rede lenta não pode travar a saída. */
export const LOGOUT_TIMEOUT_MS = 2000;

/**
 * "Sair": avisa o servidor para revogar o refresh token DESTE aparelho (os outros continuam
 * logados) e só então limpa o storage. Se a rede falhar, sai do mesmo jeito.
 */
export async function logout() {
  const session = getAuthSession();
  try {
    if (session?.refreshToken) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), LOGOUT_TIMEOUT_MS);
      try {
        await fetch(`${getApiBaseUrl()}/auth/logout`, {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${session.refreshToken}`,
          },
          signal: controller.signal,
          keepalive: true,
        });
      } finally {
        clearTimeout(timer);
      }
    }
  } catch {
    // sem rede / servidor fora: sai assim mesmo
  } finally {
    clearSession();
  }
}
