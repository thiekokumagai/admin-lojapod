import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

export const MANIFEST_HREF = "/manifest.webmanifest";
const LINK_SELECTOR = 'link[rel="manifest"]';

/**
 * Liga ou desliga o "Instalar app" do navegador conforme o login.
 *
 * O navegador só oferece instalar quando a página tem <link rel="manifest">. Por isso o link
 * não fica no index.html: entra só com o usuário logado e sai no logout. O manifest é estático
 * e usa caminhos relativos, então vale para admin.lojapod.com e admin.podipedir.com.br.
 * `useLocation` reavalia o login a cada navegação, como no AuthGatedPWAUpdatePrompt.
 */
export function AuthGatedManifestLink() {
  const location = useLocation();
  const loggedIn = isAuthenticated();

  useEffect(() => {
    const existing = document.head.querySelector<HTMLLinkElement>(LINK_SELECTOR);
    if (loggedIn && !existing) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = MANIFEST_HREF;
      document.head.appendChild(link);
    } else if (!loggedIn && existing) {
      existing.remove();
    }
  }, [loggedIn, location.pathname]);

  return null;
}
