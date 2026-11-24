import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AppsPage from "./AppsPage";

const mockApiFetch = vi.fn();
let businessType: string | undefined;

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    data: { storeId: "store-123", businessType },
    isLoading: false,
  }),
}));

vi.mock("@/components/apps/ScaleAgentCard", () => ({
  ScaleAgentCard: () => <div>Agente de Balança</div>,
}));

vi.mock("@/services/api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

describe("AppsPage (admin-lojapod)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    businessType = undefined;
    mockApiFetch.mockResolvedValue({
      json: async () => ({ printToken: "TOKEN-LOJA-999" }),
    });
  });

  it("exibe o app da Impressora com link para o .exe no GitHub e o Token de Ativação", async () => {
    render(<AppsPage />);

    expect(screen.getByText("Agente de Impressão")).toBeInTheDocument();
    expect(screen.getByText("Token de Ativação da Impressora")).toBeInTheDocument();

    const downloadLink = screen.getByRole("link", { name: /Baixar Instalador \(\.exe\)/i });
    expect(downloadLink).toHaveAttribute(
      "href",
      "https://github.com/thiekokumagai/print-lojapod/releases/latest/download/print-agent-setup.exe",
    );

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith("/stores/store-123/print-token");
    });

    const tokenInput = screen.getByLabelText("Token de Ativação da Impressora") as HTMLInputElement;
    await waitFor(() => {
      expect(tokenInput.value).toBe("TOKEN-LOJA-999");
    });

    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    fireEvent.click(screen.getByRole("button", { name: /Copiar Token/i }));
    expect(writeText).toHaveBeenCalledWith("TOKEN-LOJA-999");
  });

  it("mostra o Agente de Balança só para lojas de comida ou açaí", () => {
    const { unmount } = render(<AppsPage />);
    expect(screen.queryByText("Agente de Balança")).not.toBeInTheDocument();
    unmount();

    businessType = "FOOD";
    render(<AppsPage />);
    expect(screen.getByText("Agente de Balança")).toBeInTheDocument();
  });
});
