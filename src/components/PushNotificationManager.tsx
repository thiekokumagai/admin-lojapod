import { useEffect, useState } from 'react';
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
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((r) => {
        if (r) setSwRegistration(r);
      }).catch((error) => {
        console.error('SW registration error', error);
      });
    }
  }, []);

  const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
    try {
      if (!('Notification' in window)) {
        toast.error('Este navegador não suporta notificações push.');
        return;
      }
      
      if (!registration?.pushManager) {
        console.warn('Push manager não suportado neste navegador/ambiente.');
        return;
      }

      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }
      
      setShowBanner(false);
      
      if (permission === 'granted') {
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('VITE_VAPID_PUBLIC_KEY não encontrada no ambiente.');
          toast.error('Chave VAPID pública não configurada no frontend.');
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
        toast.error(`Permissão para notificações negada (status: ${permission}).`);
      }
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast.error(`Erro ao ativar notificações: ${error?.message || error}`);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    if (swRegistration && Notification.permission === 'default') {
      setShowBanner(true);
    } else if (swRegistration && Notification.permission === 'granted') {
      registrationCheck(swRegistration);
    }
  }, [swRegistration]);

  const registrationCheck = async (registration: ServiceWorkerRegistration) => {
    try {
      if (!registration?.pushManager) return;
      const sub = await registration.pushManager.getSubscription();
      if (!sub) {
        subscribeToPush(registration);
      } else {
        await apiFetch('/users/web-push-subscription', {
          method: 'POST',
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
      }
    } catch (e) {
      console.error('Falha ao checar registro de push:', e);
    }
  };

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
            className="flex-1 rounded-xl bg-primary-foreground/10 py-3 text-sm font-semibold transition hover:bg-primary-foreground/20"
          >
            Depois
          </button>
          <button 
            type="button" 
            onClick={() => subscribeToPush(swRegistration)}
            className="flex-1 rounded-xl bg-background py-3 text-sm font-semibold text-foreground shadow-md transition hover:bg-background/90"
          >
            Ativar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
