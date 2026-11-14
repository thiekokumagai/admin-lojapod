import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Depois de fechar no X, o aviso volta depois deste tempo ("lembrar depois"). */
export const PWA_REMIND_AFTER_MS = 15 * 60 * 1000;

export function PWAUpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const remindTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRemindTimer = () => {
    if (remindTimer.current) {
      clearTimeout(remindTimer.current);
      remindTimer.current = null;
    }
  };

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Saiu uma versão (inclusive outra, depois de o aviso ter sido fechado): o plugin já
    // mostra o aviso de novo; aqui só cancelamos o lembrete pendente da versão anterior.
    onNeedRefresh() {
      clearRemindTimer();
    },
    onRegisteredSW(_swScriptUrl, registration) {
      if (!import.meta.env.DEV && registration) {
        // Checar por atualizações no servidor periodicamente (a cada 1h)
        const interval = setInterval(() => {
          if (navigator.onLine) {
            registration.update().catch(() => {});
          }
        }, 60 * 60 * 1000);
        return () => clearInterval(interval);
      }
    },
    onRegisterError(error) {
      console.error("PWA SW Register Error:", error);
    },
  });

  // Não deixa o lembrete pendente disparar depois de desmontar.
  useEffect(() => clearRemindTimer, []);

  const handleClose = () => {
    setNeedRefresh(false);
    clearRemindTimer();
    remindTimer.current = setTimeout(() => {
      remindTimer.current = null;
      setNeedRefresh(true);
    }, PWA_REMIND_AFTER_MS);
  };

  const handleReload = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      clearRemindTimer();
      setNeedRefresh(false);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            window.location.reload();
          },
          { once: true }
        );
      }

      await updateServiceWorker(true);

      // Fallback de segurança caso controllerchange não dispare
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (e) {
      console.error("Erro ao atualizar PWA:", e);
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  // Portal no body + z-index acima dos modais (z-50 dos diálogos e z-[9999] do aviso de
  // notificações) + pointer-events-auto: os diálogos Radix põem pointer-events:none no
  // body e, sem isso, o aviso aparece mas não recebe clique.
  return createPortal(
    <div
      role="alert"
      className="pointer-events-auto fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[10000] flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-2xl border-primary/40 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex flex-col text-sm">
        <span className="font-bold text-foreground">Nova versão disponível! 🎉</span>
        <span className="text-muted-foreground text-xs">Uma atualização do app foi encontrada.</span>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={handleReload} 
          disabled={isUpdating}
          className="gap-2 shrink-0 font-medium px-4"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
          {isUpdating ? "Atualizando..." : "Atualizar"}
        </Button>
        <button
          type="button"
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
