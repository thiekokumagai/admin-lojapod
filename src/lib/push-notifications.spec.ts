import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PUSH_SNOOZE_MS,
  PushUnavailableError,
  clearPushPromptSnooze,
  getActiveServiceWorker,
  isPushPromptSnoozed,
  snoozePushPrompt,
} from "./push-notifications";

function setServiceWorker(value: unknown) {
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value });
}

describe("getActiveServiceWorker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("devolve o registro consultado na hora (não um guardado antes)", async () => {
    const fresh = { active: {} } as unknown as ServiceWorkerRegistration;
    setServiceWorker({ ready: Promise.resolve(fresh) });

    await expect(getActiveServiceWorker()).resolves.toBe(fresh);
  });

  it("espera o service worker ficar ativo em vez de falhar", async () => {
    let resolveReady!: (r: ServiceWorkerRegistration) => void;
    const ready = new Promise<ServiceWorkerRegistration>((r) => (resolveReady = r));
    setServiceWorker({ ready });

    const pending = getActiveServiceWorker();
    resolveReady({ active: {} } as unknown as ServiceWorkerRegistration);

    await expect(pending).resolves.toMatchObject({ active: {} });
  });

  it("espera o worker que está ativando terminar", async () => {
    const worker = Object.assign(new EventTarget(), { state: "activating" });
    const registration = { active: null, installing: worker } as unknown as {
      active: unknown;
    };
    setServiceWorker({ ready: Promise.resolve(registration) });

    const pending = getActiveServiceWorker();
    await Promise.resolve();
    await Promise.resolve();
    worker.state = "activated";
    registration.active = {};
    worker.dispatchEvent(new Event("statechange"));

    await expect(pending).resolves.toBe(registration);
  });

  it("sem service worker pronto no prazo: erro amigável, sem travar", async () => {
    vi.useFakeTimers();
    setServiceWorker({ ready: new Promise(() => {}) });

    const pending = getActiveServiceWorker(5000);
    const assertion = expect(pending).rejects.toBeInstanceOf(PushUnavailableError);
    await vi.advanceTimersByTimeAsync(5001);
    await assertion;
  });

  it("navegador sem service worker: erro amigável", async () => {
    const original = Object.getOwnPropertyDescriptor(Navigator.prototype, "serviceWorker");
    // 'in' precisa dar false
    // @ts-expect-error teste
    delete navigator.serviceWorker;
    try {
      await expect(getActiveServiceWorker()).rejects.toBeInstanceOf(PushUnavailableError);
    } finally {
      if (original) Object.defineProperty(Navigator.prototype, "serviceWorker", original);
    }
  });
});

describe("memória do aviso de notificações", () => {
  beforeEach(() => localStorage.clear());

  it("lembra por PUSH_SNOOZE_MS e depois volta a perguntar", () => {
    const t0 = 1_700_000_000_000;
    expect(isPushPromptSnoozed("u1", t0)).toBe(false);
    snoozePushPrompt("u1", t0);
    expect(isPushPromptSnoozed("u1", t0 + 1000)).toBe(true);
    expect(isPushPromptSnoozed("u1", t0 + PUSH_SNOOZE_MS + 1)).toBe(false);
  });

  it("é por usuário e pode ser limpo", () => {
    snoozePushPrompt("u1");
    expect(isPushPromptSnoozed("u2")).toBe(false);
    clearPushPromptSnooze("u1");
    expect(isPushPromptSnoozed("u1")).toBe(false);
  });
});
