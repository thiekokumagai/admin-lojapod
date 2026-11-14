import { useLocation } from "react-router-dom";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { isAuthenticated } from "@/lib/auth";

/**
 * Aviso de atualização do PWA só para quem está logado: não aparece em /login nem em telas
 * públicas. O componente fica sempre montado (o app segue checando versões); `useLocation`
 * reavalia o login a cada navegação, inclusive a que acontece logo depois de entrar ou sair.
 */
export function AuthGatedPWAUpdatePrompt() {
  useLocation();
  return <PWAUpdatePrompt enabled={isAuthenticated()} />;
}
