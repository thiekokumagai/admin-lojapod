import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";

const auth: { logged: boolean; storeId: string | null } = { logged: false, storeId: null };
vi.mock("@/lib/auth", () => ({
  isAuthenticated: () => auth.logged,
  getAuthSession: () =>
    auth.logged ? { accessToken: "a", refreshToken: "r", user: { storeId: auth.storeId } } : null,
}));
vi.mock("@/services/api", () => ({ getApiBaseUrl: () => "https://api.exemplo.com/api" }));

import { AuthGatedManifestLink, DEFAULT_MANIFEST_HREF, storeManifestHref } from "./AuthGatedManifestLink";

let go: (to: string) => void = () => {};
function Nav() {
  go = useNavigate();
  return null;
}

const manifestLinks = () => document.head.querySelectorAll<HTMLLinkElement>('link[rel="manifest"]');

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Nav />
      <AuthGatedManifestLink />
    </MemoryRouter>,
  );

describe("AuthGatedManifestLink", () => {
  beforeEach(() => {
    auth.logged = false;
    auth.storeId = null;
    document.head.innerHTML = "";
  });

  it("não declara o manifest na tela de login (navegador não oferece instalar)", () => {
    renderAt("/login");
    expect(manifestLinks()).toHaveLength(0);
  });

  it("usuário de loja: manifest da API com o storeId (ícone da loja), em CORS e sem duplicar", () => {
    renderAt("/login");
    auth.logged = true;
    auth.storeId = "loja-123";
    act(() => go("/"));
    act(() => go("/pedidos"));
    expect(manifestLinks()).toHaveLength(1);
    const link = manifestLinks()[0];
    expect(link.getAttribute("href")).toBe(
      "https://api.exemplo.com/api/store/settings/manifest.json?storeId=loja-123",
    );
    expect(link.getAttribute("href")).toBe(storeManifestHref("loja-123"));
    expect(link.crossOrigin).toBe("anonymous");
  });

  it("super admin (sem loja): manifest fixo do Podi Pedir", () => {
    auth.logged = true;
    renderAt("/");
    expect(manifestLinks()).toHaveLength(1);
    expect(manifestLinks()[0].getAttribute("href")).toBe(DEFAULT_MANIFEST_HREF);
    expect(manifestLinks()[0].hasAttribute("crossorigin")).toBe(false);
  });

  it("troca o manifest ao trocar de loja e remove ao sair", () => {
    auth.logged = true;
    auth.storeId = "loja-a";
    renderAt("/");
    expect(manifestLinks()[0].getAttribute("href")).toContain("storeId=loja-a");
    auth.storeId = "loja-b";
    act(() => go("/pedidos"));
    expect(manifestLinks()).toHaveLength(1);
    expect(manifestLinks()[0].getAttribute("href")).toContain("storeId=loja-b");
    auth.logged = false;
    act(() => go("/login"));
    expect(manifestLinks()).toHaveLength(0);
  });
});
