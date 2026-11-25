import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAuthSession, isAuthenticated } from "@/lib/auth";
import { getApiBaseUrl } from "@/services/api";

/** Manifest fixo do Podi Pedir (public/), para quem não tem loja (super admin). */
export const DEFAULT_MANIFEST_HREF = "/manifest.webmanifest";
const LINK_SELECTOR = 'link[rel="manifest"]';

/** Manifest da loja na API: nome e ícone da loja; start_url no domínio que pediu. */
export function storeManifestHref(storeId: string): string {
  return `${getApiBaseUrl()}/store/settings/manifest.json?storeId=${encodeURIComponent(storeId)}`;
}

/**
 * Liga ou desliga o "Instalar app" do navegador conforme o login, com o ícone da loja.
 *
 * O navegador só oferece instalar quando a página tem <link rel="manifest">, por isso o link
 * entra só com o usuário logado e sai no logout.
 * - Usuário de uma loja: manifest da API com ?storeId= (o admin é o mesmo domínio para todas as
 *   lojas, então a loja vem da sessão). O app instalado fica com o nome e o ícone da loja, como já
 *   acontece no celular pelo apple-touch-icon do DynamicFavicon.
 * - Super admin (sem loja): manifest fixo do Podi Pedir.
 * `useLocation` reavalia a sessão a cada navegação (entrar, sair, trocar de conta).
 */
export function AuthGatedManifestLink() {
  const location = useLocation();
  const loggedIn = isAuthenticated();
  const storeId = loggedIn ? getAuthSession()?.user?.storeId || null : null;

  useEffect(() => {
    const existing = document.head.querySelector<HTMLLinkElement>(LINK_SELECTOR);
    if (!loggedIn) {
      existing?.remove();
      return;
    }

    const href = storeId ? storeManifestHref(storeId) : DEFAULT_MANIFEST_HREF;
    // Manifest de outro domínio (API) é pedido em modo CORS; o fixo é do próprio admin.
    const crossOrigin = storeId ? "anonymous" : null;

    if (existing && existing.getAttribute("href") === href) return;
    existing?.remove();

    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = href;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
  }, [loggedIn, storeId, location.pathname]);

  return null;
}
