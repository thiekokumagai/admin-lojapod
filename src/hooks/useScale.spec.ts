import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Handler = (...args: any[]) => void;
const handlers: Record<string, Handler> = {};
const emitted: { event: string; payload: unknown }[] = [];
const fakeSocket = {
  connected: true,
  on: vi.fn((event: string, fn: Handler) => {
    handlers[event] = fn;
    return fakeSocket;
  }),
  emit: vi.fn((event: string, payload: unknown, ack?: Handler) => {
    emitted.push({ event, payload });
    if (event === "scale.watch" && ack) ack({ ok: true, lastReading: null });
    return fakeSocket;
  }),
  removeAllListeners: vi.fn(),
  disconnect: vi.fn(),
  timeout: vi.fn(() => ({ emitWithAck: vi.fn(async () => ({ ok: true, ports: [{ path: "COM3", label: "COM3" }] })) })),
};
const createStoreSocket = vi.fn((_ns?: string) => fakeSocket);
vi.mock("@/services/socket", () => ({ createStoreSocket: (ns?: string) => createStoreSocket(ns) }));

import { useScale } from "./useScale";

const devices = [
  { deviceId: "caixa-1", name: "Caixa 1", connectedAt: "", version: null, config: null, drivers: [], lastReading: null, watching: 0 },
  { deviceId: "caixa-2", name: "Caixa 2", connectedAt: "", version: null, config: null, drivers: [], lastReading: null, watching: 0 },
];

describe("useScale", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    emitted.length = 0;
    localStorage.clear();
    for (const k of Object.keys(handlers)) delete handlers[k];
    vi.clearAllMocks();
  });

  it("conecta no namespace /scale, lista as balanças e acompanha a última usada", () => {
    localStorage.setItem("lojapod.scale.lastDeviceId", "caixa-2");
    const { result } = renderHook(() => useScale({ enabled: true, watch: true }));
    expect(createStoreSocket).toHaveBeenCalledWith("/scale");

    act(() => {
      handlers.connect();
      handlers["scale.list"](devices);
    });
    expect(result.current.selected?.deviceId).toBe("caixa-2");
    expect(emitted).toContainEqual({ event: "scale.watch", payload: { deviceId: "caixa-2" } });
  });

  it("peso recebido é 'fresco' por 3 s e depois fica parado", () => {
    const { result } = renderHook(() => useScale({ enabled: true, watch: true }));
    act(() => {
      handlers.connect();
      handlers["scale.list"](devices);
    });
    // o agente só manda peso depois que a tela começa a acompanhar
    act(() => {
      handlers["scale.weight"]({ deviceId: "caixa-1", weightKg: 0.7, stable: true });
    });
    expect(result.current.reading?.weightKg).toBe(0.7);
    expect(result.current.isFresh).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3600);
    });
    expect(result.current.isFresh).toBe(false);
  });

  it("peso de outra balança não aparece na escolhida", () => {
    const { result } = renderHook(() => useScale({ enabled: true, watch: true }));
    act(() => {
      handlers.connect();
      handlers["scale.list"](devices);
    });
    act(() => {
      handlers["scale.weight"]({ deviceId: "caixa-2", weightKg: 1, stable: true });
    });
    expect(result.current.reading).toBeNull();
  });

  it("escolher a balança lembra neste aparelho", () => {
    const { result } = renderHook(() => useScale({ enabled: true, watch: false }));
    act(() => {
      handlers.connect();
      handlers["scale.list"](devices);
      result.current.setDeviceId("caixa-2");
    });
    expect(localStorage.getItem("lojapod.scale.lastDeviceId")).toBe("caixa-2");
    expect(result.current.selected?.deviceId).toBe("caixa-2");
  });

  it("fechar desconecta e para de acompanhar", () => {
    const { unmount } = renderHook(() => useScale({ enabled: true, watch: true }));
    act(() => {
      handlers.connect();
      handlers["scale.list"](devices);
    });
    unmount();
    expect(emitted).toContainEqual({ event: "scale.unwatch", payload: { deviceId: "caixa-1" } });
    expect(fakeSocket.disconnect).toHaveBeenCalled();
  });

  it("desligado não conecta", () => {
    renderHook(() => useScale({ enabled: false }));
    expect(createStoreSocket).not.toHaveBeenCalled();
  });

  it("comandos usam a resposta do servidor", async () => {
    const { result } = renderHook(() => useScale({ enabled: true }));
    act(() => handlers.connect());
    await expect(result.current.listPorts("caixa-1")).resolves.toEqual({
      ok: true,
      ports: [{ path: "COM3", label: "COM3" }],
    });
  });
});
