import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import { apiFetch, setAccessToken, getAccessToken } from "./api";
import { REFRESH_RETRY_DELAYS_MS } from "./auth.service";

type Call = { url: string; auth: string | null };

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const stored = () => JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? "null");

function saveSession(accessToken: string, refreshToken: string) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken, refreshToken }));
  setAccessToken(accessToken);
}

describe("apiFetch: 401 -> refresh -> repete", () => {
  let calls: Call[];
  let refreshImpl: (call: Call) => Response | Promise<Response>;

  beforeEach(() => {
    // pausas de retry mínimas para o teste não esperar segundos
    REFRESH_RETRY_DELAYS_MS.splice(0, REFRESH_RETRY_DELAYS_MS.length, 1, 1);
    localStorage.clear();
    calls = [];
    refreshImpl = () => json(200, { accessToken: "access-2", refreshToken: "refresh-2" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        const call: Call = { url, auth: new Headers(init.headers).get("Authorization") };
        calls.push(call);
        if (url.endsWith("/auth/refresh")) return refreshImpl(call);
        return call.auth === "Bearer access-2" ? json(200, { ok: true }) : json(401);
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const refreshCalls = () => calls.filter((c) => c.url.endsWith("/auth/refresh"));

  it("no 401 renova uma vez, repete a requisição com o token novo e guarda a rotação", async () => {
    saveSession("access-1", "refresh-1");

    const res = await apiFetch("/orders");

    expect(res.status).toBe(200);
    expect(refreshCalls()).toHaveLength(1);
    expect(refreshCalls()[0].auth).toBe("Bearer refresh-1");
    expect(stored()).toMatchObject({ accessToken: "access-2", refreshToken: "refresh-2" });
    expect(getAccessToken()).toBe("access-2");
  });

  it("várias requisições juntas com o token vencido gastam o refresh token UMA vez", async () => {
    saveSession("access-1", "refresh-1");

    const results = await Promise.all([apiFetch("/a"), apiFetch("/b"), apiFetch("/c")]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(refreshCalls()).toHaveLength(1);
  });

  it("outra aba já renovou: reaproveita a sessão dela e NÃO gasta o refresh token de novo", async () => {
    // Esta aba ainda tem o access token velho em memória; o storage (compartilhado) já tem o novo.
    setAccessToken("access-1");
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken: "access-2", refreshToken: "refresh-2" }),
    );

    const res = await apiFetch("/orders");

    expect(res.status).toBe(200);
    expect(refreshCalls()).toHaveLength(0);
    expect(stored()).toMatchObject({ refreshToken: "refresh-2" });
  });

  it("o servidor recusa (403) porque outra aba rotacionou no meio: usa a sessão nova, sem logout", async () => {
    saveSession("access-1", "refresh-1");
    refreshImpl = () => {
      // outra aba gravou a rotação enquanto esta requisição estava no ar
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ accessToken: "access-2", refreshToken: "refresh-2" }),
      );
      return json(403);
    };

    const res = await apiFetch("/orders");

    expect(res.status).toBe(200);
    expect(stored()).toMatchObject({ refreshToken: "refresh-2" });
  });

  it("refresh recusado de verdade (403): encerra a sessão", async () => {
    saveSession("access-1", "refresh-1");
    refreshImpl = () => json(403);

    await expect(apiFetch("/orders")).rejects.toThrow(/sessão expirou/i);

    expect(stored()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("rede fora durante o refresh: NÃO desloga", async () => {
    saveSession("access-1", "refresh-1");
    refreshImpl = () => {
      throw new TypeError("Failed to fetch");
    };

    await expect(apiFetch("/orders")).rejects.toThrow(/sem conexão/i);

    expect(stored()).toMatchObject({ accessToken: "access-1", refreshToken: "refresh-1" });
    expect(getAccessToken()).toBe("access-1");
  });

  it.each([429, 500, 502, 503])("servidor instável (%i) no refresh: NÃO desloga", async (status) => {
    saveSession("access-1", "refresh-1");
    refreshImpl = () => json(status);

    await expect(apiFetch("/orders")).rejects.toThrow();

    expect(stored()).toMatchObject({ refreshToken: "refresh-1" });
  });

  it("sem refresh token guardado: encerra a sessão", async () => {
    setAccessToken("access-1");
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: "access-1" }));

    await expect(apiFetch("/orders")).rejects.toThrow(/sessão expirou/i);
  });

  describe("B2: disputa no servidor (409/503) não desloga e tenta de novo", () => {
    it.each([409, 503])("%i uma vez e depois ok: renova e repete a requisição", async (status) => {
      saveSession("access-1", "refresh-1");
      let n = 0;
      refreshImpl = () =>
        ++n === 1 ? json(status) : json(200, { accessToken: "access-2", refreshToken: "refresh-2" });

      const res = await apiFetch("/orders");

      expect(res.status).toBe(200);
      expect(refreshCalls()).toHaveLength(2);
      // as duas tentativas usam o MESMO refresh token (nada foi gasto na falha)
      expect(refreshCalls().map((c) => c.auth)).toEqual(["Bearer refresh-1", "Bearer refresh-1"]);
      expect(stored()).toMatchObject({ accessToken: "access-2", refreshToken: "refresh-2" });
    });

    it.each([409, 503])("%i em todas as tentativas: erro temporário, sessão mantida", async (status) => {
      saveSession("access-1", "refresh-1");
      refreshImpl = () => json(status);

      await expect(apiFetch("/orders")).rejects.not.toThrow(/sessão expirou/i);

      expect(refreshCalls()).toHaveLength(REFRESH_RETRY_DELAYS_MS.length + 1);
      expect(stored()).toMatchObject({ accessToken: "access-1", refreshToken: "refresh-1" });
      expect(getAccessToken()).toBe("access-1");
    });

    it("403 NÃO é repetido: o token realmente não vale", async () => {
      saveSession("access-1", "refresh-1");
      refreshImpl = () => json(403);

      await expect(apiFetch("/orders")).rejects.toThrow(/sessão expirou/i);

      expect(refreshCalls()).toHaveLength(1);
      expect(stored()).toBeNull();
    });
  });
});
