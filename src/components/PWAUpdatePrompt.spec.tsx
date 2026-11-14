import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as Dialog from "@radix-ui/react-dialog";

const state = { needRefresh: true };
const setNeedRefresh = vi.fn();
const updateServiceWorker = vi.fn().mockResolvedValue(undefined);

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [state.needRefresh, setNeedRefresh],
    updateServiceWorker,
  }),
}));

import { PWAUpdatePrompt } from "./PWAUpdatePrompt";

describe("PWAUpdatePrompt", () => {
  beforeEach(() => {
    state.needRefresh = true;
    setNeedRefresh.mockClear();
  });

  it("não renderiza nada sem atualização", () => {
    state.needRefresh = false;
    render(<PWAUpdatePrompt />);
    expect(screen.queryByText(/Nova versão disponível/)).toBeNull();
  });

  it("renderiza no body (fora da árvore da página), acima dos modais e clicável", () => {
    const { container } = render(<PWAUpdatePrompt />);
    const alert = screen.getByRole("alert");
    expect(container.contains(alert)).toBe(false);
    expect(alert.parentElement).toBe(document.body);
    expect(alert.className).toContain("z-[10000]");
    expect(alert.className).toContain("pointer-events-auto");
  });

  it("o X fecha o aviso mesmo com um diálogo modal aberto por baixo", () => {
    render(
      <>
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content aria-describedby={undefined}>
              <Dialog.Title>Modal</Dialog.Title>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <PWAUpdatePrompt />
      </>,
    );
    // O Radix marca como aria-hidden o que já estava no body ao abrir o diálogo; só afeta leitor de tela, não o clique.
    expect(screen.getByRole("alert", { hidden: true })).toBeTruthy();
    fireEvent.click(screen.getByTitle("Fechar"));
    expect(setNeedRefresh).toHaveBeenCalledWith(false);
  });
});
