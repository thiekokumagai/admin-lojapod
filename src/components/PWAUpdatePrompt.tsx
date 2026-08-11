import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAUpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swScriptUrl, registration) {
      if (registration) {
        // Checar por atualizações no servidor a cada 20s e ao focar/reabrir o app
        const checkUpdate = async () => {
          if (!navigator.onLine) return;
          try {
            // Bypass HTTP cache para garantir que pega o sw.js atualizado do servidor
            await fetch(swScriptUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
            await registration.update();
          } catch (e) {
            console.debug('Erro na checagem de SW:', e);
          }
        };

        const interval = setInterval(checkUpdate, 20000);
        window.addEventListener("focus", checkUpdate);
        window.addEventListener("online", checkUpdate);
      }
    },
    onRegisterError(error) {
      console.error("PWA SW Register Error:", error);
    },
  });

  const handleReload = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
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

      // Fallback de segurança caso controllerchange não dispare em até 600ms
      setTimeout(() => {
        window.location.reload();
      }, 600);
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
      <Button 
        size="sm" 
        onClick={handleReload} 
        disabled={isUpdating}
        className="gap-2 shrink-0 font-medium px-4"
      >
        <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
        {isUpdating ? "Atualizando..." : "Atualizar"}
      </Button>
    </div>
  );
}


