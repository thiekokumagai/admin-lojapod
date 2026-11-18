import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/services/api';
import { getAuthSession } from '@/lib/auth';
import {
  PushUnavailableError,
  clearPushPromptSnooze,
  getActiveServiceWorker,
  isPushPromptSnoozed,
  snoozePushPrompt,
} from '@/lib/push-notifications';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// activate: precisa tocar em "Ativar" | install: iPhone fora da tela inicial
type PushIssue = 'activate' | 'install' | null;

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const isStandalone = () =>
  (navigator as any).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

export function PushNotificationManager() {
  const [issue, setIssue] = useState<PushIssue>(null);
  const userId = getAuthSession()?.user?.id;
  // Endpoint já enviado ao backend nesta página: evita um POST a cada vez que a aba ganha foco.
  const sentEndpoint = useRef<string | null>(null);
  const checking = useRef(false);

  const sendSubscription = useCallback(async (sub: PushSubscription) => {
    if (sentEndpoint.current === sub.endpoint) return;
    await apiFetch('/users/web-push-subscription', {
      method: 'POST',
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    sentEndpoint.current = sub.endpoint;
  }, []);

  const subscribe = useCallback(async (registration: ServiceWorkerRegistration) => {
    if (!registration?.pushManager) {
      console.warn('Push manager não suportado neste navegador/ambiente.');
      return false;
    }
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY não encontrada no ambiente.');
      toast.error('Chave VAPID pública não configurada no frontend.');
      return false;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    await sendSubscription(subscription);
    return true;
  }, [sendSubscription]);

  // Verifica o estado real. O aviso só aparece se ainda falta ativar E o usuário não
  // recusou/fechou antes (a escolha fica salva).
  const checkStatus = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const snoozed = isPushPromptSnoozed(userId);

      // iPhone fora da tela inicial: o Safari nem expõe a API de notificações.
      if (isIOS() && !isStandalone()) {
        setIssue(snoozed ? null : 'install');
        return;
      }
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      const permission = Notification.permission;
      if (permission === 'denied') {
        // O usuário bloqueou: não adianta insistir, o navegador não deixa pedir de novo.
        setIssue(null);
        return;
      }
      if (permission !== 'granted') {
        setIssue(snoozed ? null : 'activate');
        return;
      }

      try {
        // Sempre pede o registro ativo na hora: o guardado de antes pode estar velho.
        const registration = await getActiveServiceWorker();
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sendSubscription(sub); // garante que o backend tem a inscrição atual
          setIssue(null);
          return;
        }
        // Permissão ok, mas a inscrição sumiu (comum no iOS): tenta refazer em silêncio.
        const ok = await subscribe(registration);
        setIssue(ok || snoozed ? null : 'activate');
      } catch (e) {
        console.warn('Falha ao checar registro de push:', e);
        // iOS pode exigir um toque do usuário; fora isso, não incomoda.
        setIssue(e instanceof PushUnavailableError || snoozed ? null : 'activate');
      }
    } finally {
      checking.current = false;
    }
  }, [userId, sendSubscription, subscribe]);

  const handleDismiss = () => {
    snoozePushPrompt(userId);
    setIssue(null);
  };

  const handleActivate = async () => {
    try {
      if (!('Notification' in window)) {
        toast.error('Este navegador não suporta notificações push.');
        return;
      }
      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }
      if (permission === 'granted') {
        // Registro ativo consultado agora: evita "no active Service Worker".
        const registration = await getActiveServiceWorker();
        if (await subscribe(registration)) {
          clearPushPromptSnooze(userId);
          setIssue(null);
          toast.success('Notificações ativadas com sucesso!');
        }
      } else if (permission === 'denied') {
        setIssue(null);
        toast.error('Notificações bloqueadas. Abra as configurações do navegador (ou Ajustes → Notificações no celular), escolha este app e permita as notificações.');
      } else {
        // Fechou a caixa do navegador sem escolher: respeita e não pergunta de novo por um tempo.
        handleDismiss();
      }
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast.error(
        error instanceof PushUnavailableError
          ? error.message
          : `Não foi possível ativar as notificações: ${error?.message || error}`,
      );
    }
  };

  // Checa ao abrir e quando o app volta ao primeiro plano (reativa sozinho se o usuário
  // liberou nas configurações do navegador). Recusa/fechar não gera novo aviso.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    void checkStatus();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkStatus();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [checkStatus]);

  if (!issue) return null;

  const content = {
    activate: {
      title: 'Ative as Notificações',
      text: 'Para não perder nenhuma venda, ative os alertas instantâneos de novos pedidos.',
    },
    install: {
      title: 'Instale o app na tela inicial',
      text: 'No iPhone, as notificações só funcionam com o app instalado. Toque em Compartilhar → "Adicionar à Tela de Início", abra pelo ícone e ative as notificações.',
    },
  }[issue];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl">
        <div className="flex flex-col text-center">
          <span className="text-2xl font-bold">{content.title}</span>
          <span className="mt-3 text-base text-primary-foreground/90 leading-relaxed">
            {content.text}
          </span>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 rounded-xl bg-primary-foreground/10 py-3 text-sm font-semibold transition hover:bg-primary-foreground/20"
          >
            {issue === 'activate' ? 'Depois' : 'Entendi'}
          </button>
          {issue === 'activate' && (
            <button
              type="button"
              onClick={handleActivate}
              className="flex-1 rounded-xl bg-background py-3 text-sm font-semibold text-foreground shadow-md transition hover:bg-background/90"
            >
              Ativar Agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
