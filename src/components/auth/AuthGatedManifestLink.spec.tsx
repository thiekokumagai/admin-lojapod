import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";

const auth = { logged: false };
vi.mock("@/lib/auth", () => ({ isAuthenticated: () => auth.logged }));

import { AuthGatedManifestLink, MANIFEST_HREF } from "./AuthGatedManifestLink";

let go: (to: string) => void = () => {};
function Nav() {
  go = useNavigate();
  return null;
}

const manifestLinks = () => document.head.querySelectorAll('link[rel="manifest"]');

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
    document.head.innerHTML = "";
  });

  it("não declara o manifest na tela de login (navegador não oferece instalar)", () => {
    renderAt("/login");
    expect(manifestLinks()).toHaveLength(0);
  });

  it("declara o manifest logo depois do login, sem duplicar ao navegar", () => {
    renderAt("/login");
    auth.logged = true;
    act(() => go("/"));
    act(() => go("/pedidos"));
    expect(manifestLinks()).toHaveLength(1);
    expect(manifestLinks()[0].getAttribute("href")).toBe(MANIFEST_HREF);
  });

  it("remove o manifest ao sair", () => {
    auth.logged = true;
    renderAt("/");
    expect(manifestLinks()).toHaveLength(1);
    auth.logged = false;
    act(() => go("/login"));
    expect(manifestLinks()).toHaveLength(0);
  });
});
