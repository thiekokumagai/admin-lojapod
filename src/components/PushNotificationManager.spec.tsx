import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const { apiFetch, toast } = vi.hoisted(() => ({
  apiFetch: vi.fn().mockResolvedValue(undefined),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/services/api", () => ({ apiFetch }));
vi.mock("sonner", () => ({ toast }));

import { PushNotificationManager } from "./PushNotificationManager";
import { AUTH_STORAGE_KEY } from "@/lib/auth";

const VAPID = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

const sub = { endpoint: "https://push.example/abc", toJSON: () => ({ endpoint: "https://push.example/abc" }) };

function setup({
  permission = "default" as NotificationPermission,
  requestResult = "granted" as NotificationPermission,
  existing = null as typeof sub | null,
  ready = undefined as Promise<unknown> | undefined,
} = {}) {
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(existing),
    subscribe: vi.fn().mockResolvedValue(sub),
  };
  const registration = { active: {}, pushManager };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: ready ?? Promise.resolve(registration) },
  });
  const requestPermission = vi.fn().mockResolvedValue(requestResult);
  vi.stubGlobal("Notification", { permission, requestPermission });
  return { pushManager, requestPermission };
}

const modal = () => screen.queryByText("Ative as Notificações");

describe("PushNotificationManager", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken: "a", refreshToken: "r", user: { id: "u1", role: "ADMIN" } }),
    );
    vi.stubEnv("VITE_VAPID_PUBLIC_KEY", VAPID);
    apiFetch.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("ativar: espera o service worker ativo e inscreve (sem 'no active Service Worker')", async () => {
    let resolveReady!: (r: unknown) => void;
    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(sub),
    };
    const { requestPermission } = setup({
      ready: new Promise((r) => (resolveReady = r)),
    });

    render(<PushNotificationManager />);
    await waitFor(() => expect(modal()).toBeInTheDocument());

    fireEvent.click(screen.getByText("Ativar Agora"));
    await waitFor(() => expect(requestPermission).toHaveBeenCalled());
    // o service worker só fica ativo depois do clique; o subscribe tem de esperar por ele
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    resolveReady({ active: {}, pushManager });

    await waitFor(() => expect(pushManager.subscribe).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledWith(
      "/users/web-push-subscription",
      expect.objectContaining({ method: "POST" }),
    );
    expect(modal()).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("falha no subscribe não quebra: mostra erro e mantém o aviso para tentar de novo", async () => {
    const { pushManager } = setup();
    pushManager.subscribe.mockRejectedValue(new Error("Subscription failed - no active Service Worker"));

    render(<PushNotificationManager />);
    await waitFor(() => expect(modal()).toBeInTheDocument());
    fireEvent.click(screen.getByText("Ativar Agora"));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(modal()).toBeInTheDocument();
  });

  it("'Depois' lembra a escolha: não pergunta de novo ao reabrir nem ao voltar o foco", async () => {
    setup();
    const first = render(<PushNotificationManager />);
    await waitFor(() => expect(modal()).toBeInTheDocument());

    fireEvent.click(screen.getByText("Depois"));
    expect(modal()).not.toBeInTheDocument();

    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    await new Promise((r) => setTimeout(r, 20));
    expect(modal()).not.toBeInTheDocument();

    first.unmount();
    render(<PushNotificationManager />);
    await new Promise((r) => setTimeout(r, 20));
    expect(modal()).not.toBeInTheDocument();
  });

  it("fechar a caixa de permissão do navegador (default) também vira 'depois'", async () => {
    setup({ requestResult: "default" });
    render(<PushNotificationManager />);
    await waitFor(() => expect(modal()).toBeInTheDocument());

    fireEvent.click(screen.getByText("Ativar Agora"));

    await waitFor(() => expect(modal()).not.toBeInTheDocument());
    cleanup();
    render(<PushNotificationManager />);
    await new Promise((r) => setTimeout(r, 20));
    expect(modal()).not.toBeInTheDocument();
  });

  it("permissão bloqueada: não mostra o aviso", async () => {
    setup({ permission: "denied" });
    render(<PushNotificationManager />);
    await new Promise((r) => setTimeout(r, 20));
    expect(modal()).not.toBeInTheDocument();
  });

  it("já inscrito: sem aviso e o backend recebe a inscrição só uma vez", async () => {
    setup({ permission: "granted", existing: sub });
    render(<PushNotificationManager />);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    expect(modal()).not.toBeInTheDocument();

    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    await new Promise((r) => setTimeout(r, 20));
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
