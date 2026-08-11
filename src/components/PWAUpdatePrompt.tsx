import { useEffect, useState, useRef } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;

    // Trigger page reload when new controller takes over
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Register and check for waiting SW
    navigator.serviceWorker.ready.then((reg) => {
      registrationRef.current = reg;

      if (reg.waiting) {
        setNeedRefresh(true);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setNeedRefresh(true);
            }
          });
        }
      });
    });

    // Check for SW updates directly
    const checkForUpdates = async () => {
      try {
        if (registrationRef.current) {
          await registrationRef.current.update();
        } else {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            registrationRef.current = reg;
            await reg.update();
          }
        }
      } catch (err) {
        console.debug("PWA update check error:", err);
      }
    };

    // Periodic check every 20 seconds
    const intervalId = setInterval(checkForUpdates, 20000);

    // Check on focus / visibilitychange (re-opening or switching tabs back to PWA)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    window.addEventListener("focus", checkForUpdates);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      clearInterval(intervalId);
      window.removeEventListener("focus", checkForUpdates);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleUpdate = () => {
    const reg = registrationRef.current;
    if (reg && reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-[9999] flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3 text-sm">
        <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">Nova versão disponível! 🎉</span>
          <span className="text-muted-foreground text-xs">Uma atualização do app foi encontrada.</span>
        </div>
      </div>
      <Button size="sm" onClick={handleUpdate} className="gap-2 shrink-0 font-medium shadow-sm">
        <RefreshCw className="h-3.5 w-3.5" />
        Atualizar
      </Button>
    </div>
  );
}

