/** Erro esperado do fluxo de push (mensagem já pronta para mostrar ao usuário). */
export class PushUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PushUnavailableError";
  }
}

const SNOOZE_KEY = "admin-push-prompt-snooze";
/** Depois de "Depois"/fechar, o aviso só volta após este tempo. */
export const PUSH_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const snoozeKey = (userId?: string | null) => `${SNOOZE_KEY}:${userId ?? "anon"}`;

/** O usuário já escolheu "depois"/fechou o aviso há pouco? Então não pergunta de novo. */
export function isPushPromptSnoozed(userId?: string | null, now = Date.now()): boolean {
  try {
    const until = Number(localStorage.getItem(snoozeKey(userId)));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

export function snoozePushPrompt(userId?: string | null, now = Date.now()) {
  try {
    localStorage.setItem(snoozeKey(userId), String(now + PUSH_SNOOZE_MS));
  } catch {
    // storage indisponível: sem memória, mas sem quebrar
  }
}

export function clearPushPromptSnooze(userId?: string | null) {
  try {
    localStorage.removeItem(snoozeKey(userId));
  } catch {
    // ignore
  }
}

/**
 * Devolve o registro do service worker JÁ ATIVO, consultado na hora.
 * `pushManager.subscribe` falha com "no active Service Worker" quando é chamado num registro
 * guardado antes (que ficou sem worker ativo depois de uma atualização do PWA ou ainda
 * instalando). `navigator.serviceWorker.ready` só resolve com o worker ativo.
 */
export async function getActiveServiceWorker(timeoutMs = 10_000): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    throw new PushUnavailableError("Este navegador não suporta notificações push.");
  }

  const notReady = new PushUnavailableError(
    "O app ainda está preparando as notificações. Aguarde alguns segundos e tente de novo.",
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    const registration = await Promise.race([navigator.serviceWorker.ready, timeout]);
    if (!registration) throw notReady;
    if (registration.active) return registration;

    // Raro: o registro ainda está ativando o worker. Espera ele terminar.
    const worker = registration.installing ?? registration.waiting;
    if (!worker) throw notReady;
    await Promise.race([
      new Promise<void>((resolve) => {
        const onChange = () => {
          if (worker.state === "activated" || worker.state === "redundant") {
            worker.removeEventListener("statechange", onChange);
            resolve();
          }
        };
        worker.addEventListener("statechange", onChange);
        onChange();
      }),
      timeout,
    ]);
    if (!registration.active) throw notReady;
    return registration;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
