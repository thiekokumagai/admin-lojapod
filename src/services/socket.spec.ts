import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers: Record<string, (...args: unknown[]) => unknown> = {};
const fakeSocket = {
  on: vi.fn((event: string, fn: (...args: unknown[]) => unknown) => {
    handlers[event] = fn;
    return fakeSocket;
  }),
  disconnect: vi.fn(() => fakeSocket),
  connect: vi.fn(() => fakeSocket),
};
const ioMock = vi.fn((..._args: unknown[]) => fakeSocket);
vi.mock("socket.io-client", () => ({ io: (...args: unknown[]) => ioMock(...args) }));

const refreshAccessToken = vi.fn();
let currentToken: string | null = "access-1";
vi.mock("@/services/api", () => ({
  getApiBaseUrl: () => "https://api.podipedir.com.br/api",
  getAccessToken: () => currentToken,
  refreshAccessToken: (stale: string | null) => refreshAccessToken(stale),
}));

import { createStoreSocket } from "./socket";

describe("createStoreSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentToken = "access-1";
    for (const k of Object.keys(handlers)) delete handlers[k];
  });

  it("conecta na raiz da API e manda o access token atual a cada conexão", () => {
    createStoreSocket();
    const [url, opts] = ioMock.mock.calls[0] as [string, { auth: (cb: (d: unknown) => void) => void }];
    expect(url).toBe("https://api.podipedir.com.br");

    const cb = vi.fn();
    opts.auth(cb);
    expect(cb).toHaveBeenCalledWith({ accessToken: "access-1" });

    currentToken = "access-2";
    opts.auth(cb);
    expect(cb).toHaveBeenLastCalledWith({ accessToken: "access-2" });
  });

  it("session.invalid renova a sessão e reconecta, uma vez por minuto", async () => {
    refreshAccessToken.mockResolvedValue("access-2");
    createStoreSocket();

    await handlers["session.invalid"]();
    expect(refreshAccessToken).toHaveBeenCalledWith("access-1");
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(fakeSocket.connect).toHaveBeenCalledTimes(1);

    await handlers["session.invalid"]();
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("falha ao renovar não reconecta", async () => {
    refreshAccessToken.mockRejectedValue(new Error("expirou"));
    createStoreSocket();
    await handlers["session.invalid"]();
    expect(fakeSocket.connect).not.toHaveBeenCalled();
  });
});
