import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import { setAccessToken, getAccessToken } from "./api";
import { logout } from "./auth.service";

function saveSession() {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ accessToken: "access-1", refreshToken: "refresh-1" }),
  );
  setAccessToken("access-1");
}

describe("M2: logout avisa o servidor e limpa o storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("chama POST /auth/logout com o refresh token e só depois limpa a sessão", async () => {
    saveSession();
    let storageDuringCall: string | null = "n/a";
    const fetchMock = vi.fn(async () => {
      storageDuringCall = localStorage.getItem(AUTH_STORAGE_KEY);
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/auth\/logout$/);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer refresh-1");
    // a sessão ainda existia quando o servidor foi chamado; depois foi limpa
    expect(storageDuringCall).not.toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("rede fora: sai do mesmo jeito (não trava nem lança)", async () => {
    saveSession();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(logout()).resolves.toBeUndefined();

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("servidor devolve erro (500): sai do mesmo jeito", async () => {
    saveSession();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));

    await logout();

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("servidor que não responde: desiste no tempo limite e sai", async () => {
    vi.useFakeTimers();
    saveSession();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new DOMException("abort", "AbortError")));
          }),
      ),
    );

    const done = logout();
    await vi.advanceTimersByTimeAsync(2500);
    await done;

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("sem sessão guardada: não chama o servidor e não quebra", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await logout();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
