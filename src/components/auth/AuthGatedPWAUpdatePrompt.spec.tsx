import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";

const auth = { logged: false };
vi.mock("@/lib/auth", () => ({ isAuthenticated: () => auth.logged }));
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [true, () => {}],
    updateServiceWorker: async () => {},
  }),
}));

import { AuthGatedPWAUpdatePrompt } from "./AuthGatedPWAUpdatePrompt";

let go: (to: string) => void = () => {};
function Nav() {
  go = useNavigate();
  return null;
}

const prompt = () => screen.queryByText(/Nova versão disponível/);

describe("AuthGatedPWAUpdatePrompt", () => {
  beforeEach(() => {
    auth.logged = false;
  });

  it("não aparece na tela de login nem em telas públicas, mesmo com versão nova", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Nav />
        <AuthGatedPWAUpdatePrompt />
      </MemoryRouter>,
    );
    expect(prompt()).toBeNull();
    act(() => go("/catalogo"));
    expect(prompt()).toBeNull();
  });

  it("aparece assim que o usuário entra (navegação depois do login)", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Nav />
        <AuthGatedPWAUpdatePrompt />
      </MemoryRouter>,
    );
    expect(prompt()).toBeNull();
    auth.logged = true;
    act(() => go("/"));
    expect(prompt()).not.toBeNull();
  });

  it("some de novo ao sair", () => {
    auth.logged = true;
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Nav />
        <AuthGatedPWAUpdatePrompt />
      </MemoryRouter>,
    );
    expect(prompt()).not.toBeNull();
    auth.logged = false;
    act(() => go("/login"));
    expect(prompt()).toBeNull();
  });
});
