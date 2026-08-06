import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
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

export function PushNotificationManager() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setSwRegistration(r);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
    try {
      if (!('Notification' in window)) {
        toast.error('Este navegador não suporta notificações push.');
        return;
      }
      const permission = await Notification.requestPermission();
      setShowBanner(false);
      if (permission === 'granted') {
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('VITE_VAPID_PUBLIC_KEY not found.');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // Send to backend
        await apiFetch('/users/web-push-subscription', {
          method: 'POST',
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
        toast.success('Notificações ativadas com sucesso!');
      } else {
        toast.error('Permissão para notificações negada.');
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Erro ao ativar notificações.');
    }
  };

  useEffect(() => {
    if (needRefresh) {
      toast.info('Nova versão disponível!', {
        description: 'Clique em atualizar para carregar as últimas melhorias.',
        duration: Infinity,
        action: {
          label: 'Atualizar agora',
          onClick: () => {
            updateServiceWorker(true);
          },
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window)) return;
    
    if (swRegistration && Notification.permission === 'default') {
      setShowBanner(true);
    } else if (swRegistration && Notification.permission === 'granted') {
      // Já está ativado, mas podemos garantir que a subscription está no backend
      // Em um app real, poderíamos verificar se a sub mudou
      registrationCheck(swRegistration);
    }
  }, [swRegistration]);

  const registrationCheck = async (registration: ServiceWorkerRegistration) => {
    try {
      const sub = await registration.pushManager.getSubscription();
      if (!sub) {
        // Tentamos se inscrever silenciosamente se não houver sub e a permissão for granted
        subscribeToPush(registration);
      } else {
        // Se já tiver uma inscrição, enviamos novamente para o backend para garantir que não foi perdido
        await apiFetch('/users/web-push-subscription', {
          method: 'POST',
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!showBanner || !swRegistration) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl">
        <div className="flex flex-col text-center">
          <span className="text-2xl font-bold">Ative as Notificações</span>
          <span className="mt-3 text-base text-primary-foreground/90 leading-relaxed">
            Para não perder nenhuma venda, ative os alertas instantâneos de novos pedidos.
          </span>
        </div>
        
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row">
          <button 
            type="button" 
            onClick={() => setShowBanner(false)}
            className="w-full rounded-xl bg-transparent px-5 py-3.5 text-base font-bold text-primary-foreground hover:bg-primary-foreground/10 active:scale-95 transition-all"
          >
            Agora não
          </button>
          <button 
            type="button" 
            onClick={() => subscribeToPush(swRegistration)}
            className="w-full rounded-xl bg-background px-5 py-3.5 text-base font-bold text-primary shadow-sm hover:bg-background/90 active:scale-95 transition-all"
          >
            Ativar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
