import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      if (!refreshing) {
        setNeedRefresh(true);
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-2xl border-primary/30 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex flex-col text-sm">
        <span className="font-semibold text-foreground">Nova versão disponível!</span>
        <span className="text-muted-foreground text-xs">Uma atualização do app foi encontrada.</span>
      </div>
      <Button size="sm" onClick={handleReload} className="gap-2 shrink-0">
        <RefreshCw className="h-3.5 w-3.5 animate-spin-once" />
        Atualizar
      </Button>
    </div>
  );
}
