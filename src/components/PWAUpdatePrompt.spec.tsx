import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

// Mock com estado real, como o useRegisterSW do vite-plugin-pwa (needRefresh é um useState).
const sw: {
  onNeedRefresh?: () => void;
  initial: boolean;
  registration: EventTarget & { installing: (EventTarget & { state: string }) | null };
} = { initial: true, registration: Object.assign(new EventTarget(), { installing: null }) };
const updateServiceWorker = vi.fn().mockResolvedValue(undefined);

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: (
    options: {
      onNeedRefresh?: () => void;
      onRegisteredSW?: (url: string, reg: unknown) => void;
    } = {},
  ) => {
    const [needRefresh, setNeedRefresh] = useState(sw.initial);
    sw.onNeedRefresh = () => {
      setNeedRefresh(true);
      options.onNeedRefresh?.();
    };
    useEffect(() => {
      options.onRegisteredSW?.("/sw.js", sw.registration);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker };
  },
}));

import { PWAUpdatePrompt, PWA_REMIND_AFTER_MS } from "./PWAUpdatePrompt";

const prompt = () => screen.queryByText(/Nova versão disponível/);

describe("PWAUpdatePrompt", () => {
  beforeEach(() => {
    sw.initial = true;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { controller: {} },
    });
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("não renderiza nada sem atualização", () => {
    sw.initial = false;
    render(<PWAUpdatePrompt />);
    expect(prompt()).toBeNull();
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
    expect(prompt()).toBeNull();
  });

  it("depois de fechar no X, o aviso volta em 15 minutos (lembrar depois)", () => {
    expect(PWA_REMIND_AFTER_MS).toBe(15 * 60 * 1000);
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByTitle("Fechar"));
    expect(prompt()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(PWA_REMIND_AFTER_MS - 1000);
    });
    expect(prompt()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(prompt()).not.toBeNull();
  });

  it("fechar de novo reinicia o intervalo", () => {
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByTitle("Fechar"));
    act(() => {
      vi.advanceTimersByTime(PWA_REMIND_AFTER_MS);
    });
    expect(prompt()).not.toBeNull();

    fireEvent.click(screen.getByTitle("Fechar"));
    act(() => {
      vi.advanceTimersByTime(PWA_REMIND_AFTER_MS - 1000);
    });
    expect(prompt()).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(prompt()).not.toBeNull();
  });

  it("outra versão depois do X mostra o aviso na hora e cancela o lembrete antigo", () => {
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByTitle("Fechar"));
    expect(prompt()).toBeNull();

    act(() => {
      sw.onNeedRefresh?.();
    });
    expect(prompt()).not.toBeNull();

    // Fecha de novo: o lembrete antigo não pode disparar antes do novo prazo.
    fireEvent.click(screen.getByTitle("Fechar"));
    act(() => {
      vi.advanceTimersByTime(PWA_REMIND_AFTER_MS - 1000);
    });
    expect(prompt()).toBeNull();
  });

  it("não deixa o lembrete disparar depois de desmontar", () => {
    const { unmount } = render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByTitle("Fechar"));
    unmount();
    expect(() =>
      act(() => {
        vi.advanceTimersByTime(PWA_REMIND_AFTER_MS);
      }),
    ).not.toThrow();
    expect(prompt()).toBeNull();
  });

  it("enabled=false não mostra o aviso (ex.: antes do login), enabled=true mostra", () => {
    const { rerender } = render(<PWAUpdatePrompt enabled={false} />);
    expect(prompt()).toBeNull();
    rerender(<PWAUpdatePrompt enabled />);
    expect(prompt()).not.toBeNull();
  });

  const publishNewVersion = (state = "installed") => {
    const installing = Object.assign(new EventTarget(), { state });
    sw.registration.installing = installing;
    sw.registration.dispatchEvent(new Event("updatefound"));
    installing.dispatchEvent(new Event("statechange"));
  };

  it("segunda versão publicada depois do X faz o aviso voltar na hora (updatefound do registro)", () => {
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByTitle("Fechar"));
    expect(prompt()).toBeNull();

    act(() => publishNewVersion());
    expect(prompt()).not.toBeNull();
  });

  it("primeira instalação (sem controller) não mostra o aviso", () => {
    sw.initial = false;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { controller: null },
    });
    render(<PWAUpdatePrompt />);
    act(() => publishNewVersion());
    expect(prompt()).toBeNull();
  });
});
