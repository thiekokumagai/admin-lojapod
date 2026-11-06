import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/services/api';
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

// activate: precisa tocar em "Ativar" (inclui bloqueado) | install: iPhone fora da tela inicial
type PushIssue = 'activate' | 'install' | null;

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const isStandalone = () =>
  (navigator as any).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

async function sendSubscription(sub: PushSubscription) {
  await apiFetch('/users/web-push-subscription', {
    method: 'POST',
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
}

export function PushNotificationManager() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [issue, setIssue] = useState<PushIssue>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((r) => {
        if (r) setSwRegistration(r);
      }).catch((error) => {
        console.error('SW registration error', error);
      });
    }
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
  }, []);

  // Verifica o estado real e define o que precisa ser mostrado ao usuário.
  const checkStatus = useCallback(async (registration: ServiceWorkerRegistration | null) => {
    // iPhone fora da tela inicial: o Safari nem expõe a API de notificações.
    if (isIOS() && !isStandalone()) {
      setIssue('install');
      return;
    }
    if (!('Notification' in window) || !registration?.pushManager) return;

    if (Notification.permission !== 'granted') {
      // 'default' ou 'denied': mostra o mesmo aviso para ativar.
      setIssue('activate');
      return;
    }

    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sendSubscription(sub); // garante que o backend tem a inscrição atual
        setIssue(null);
        return;
      }
      // Permissão ok, mas a inscrição sumiu (comum no iOS): tenta refazer em silêncio.
      try {
        const ok = await subscribe(registration);
        setIssue(ok ? null : 'activate');
      } catch {
        // iOS pode exigir um toque do usuário para se inscrever.
        setIssue('activate');
      }
    } catch (e) {
      console.error('Falha ao checar registro de push:', e);
    }
  }, [subscribe]);

  const handleActivate = async () => {
    if (!swRegistration) return;
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
        if (await subscribe(swRegistration)) {
          setIssue(null);
          toast.success('Notificações ativadas com sucesso!');
        }
      } else if (permission === 'denied') {
        toast.error('Notificações bloqueadas. Abra Ajustes → Notificações, escolha este app e permita as notificações.');
      } else {
        toast.error(`Permissão para notificações negada (status: ${permission}).`);
      }
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast.error(`Erro ao ativar notificações: ${error?.message || error}`);
    }
  };

  // Checa ao abrir e toda vez que o app volta ao primeiro plano,
  // então o aviso reaparece enquanto não estiver tudo ativo.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isIOS() && !isStandalone()) {
      setIssue('install');
      return;
    }
    if (!swRegistration) return;

    checkStatus(swRegistration);

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkStatus(swRegistration);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [swRegistration, checkStatus]);

  // "Agora não" some só até a próxima vez que o app for aberto/retomado.
  useEffect(() => {
    if (!issue) return;
    const reset = () => {
      if (document.visibilityState === 'visible') setDismissed(false);
    };
    document.addEventListener('visibilitychange', reset);
    return () => document.removeEventListener('visibilitychange', reset);
  }, [issue]);

  if (!issue || dismissed) return null;

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
            onClick={() => setDismissed(true)}
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
