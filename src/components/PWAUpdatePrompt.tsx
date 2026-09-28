import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAUpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
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

  const handleClose = () => {
    setNeedRefresh(false);
  };

  const handleReload = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
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

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-2xl border-primary/40 animate-in fade-in slide-in-from-bottom-5">
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
    </div>
  );
}
