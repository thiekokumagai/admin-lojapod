import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ProductCompositionManager } from "./ProductCompositionManager";
import { compositionService } from "@/services/composition.service";

vi.mock("lucide-react", () => ({
  Plus: () => null,
  Trash2: () => null,
  ArrowUp: () => null,
  ArrowDown: () => null,
  ExternalLink: () => null,
  CheckCircle2: () => null,
  Layers: () => null,
}));

vi.mock("@/services/composition.service", () => ({
  compositionService: {
    listGroups: vi.fn(),
    getProductCompositions: vi.fn(),
    attachProductCompositions: vi.fn(),
  },
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

describe("ProductCompositionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (compositionService.listGroups as any).mockResolvedValue([
      {
        id: "group-1",
        storeId: "store-1",
        name: "Escolha sua Fruta",
        description: "",
        minQuantity: 0,
        maxQuantity: 3,
        freeQuantity: 2,
        sortOrder: 0,
        isActive: true,
        options: [],
      },
    ]);
    (compositionService.getProductCompositions as any).mockResolvedValue([]);
    (compositionService.attachProductCompositions as any).mockResolvedValue([]);
  });

  function renderComponent() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProductCompositionManager productId="prod-1" />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("não duplica o grupo ao clicar direto no Switch e renderiza inputs de quantidade como text com inputMode numeric", async () => {
    renderComponent();

    const switchEl = await screen.findByRole("switch");
    fireEvent.click(switchEl);

    expect(screen.getAllByText("Etapa 1")).toHaveLength(1);

    const minInput = screen.getByPlaceholderText("0");
    const maxInput = screen.getByPlaceholderText("3");
    const freeInput = screen.getByPlaceholderText("2");

    expect(minInput).toHaveAttribute("type", "text");
    expect(minInput).toHaveAttribute("inputmode", "numeric");
    expect(maxInput).toHaveAttribute("type", "text");
    expect(maxInput).toHaveAttribute("inputmode", "numeric");
    expect(freeInput).toHaveAttribute("type", "text");
    expect(freeInput).toHaveAttribute("inputmode", "numeric");

    fireEvent.change(minInput, { target: { value: "abc1" } });
    fireEvent.change(maxInput, { target: { value: "05x" } });
    fireEvent.change(freeInput, { target: { value: "2!" } });

    expect(minInput).toHaveValue("1");
    expect(maxInput).toHaveValue("5");
    expect(freeInput).toHaveValue("2");

    fireEvent.click(screen.getByRole("button", { name: /Salvar Etapas do Produto/i }));

    await waitFor(() => {
      expect(compositionService.attachProductCompositions).toHaveBeenCalledWith("prod-1", {
        groups: [
          {
            groupId: "group-1",
            sortOrder: 0,
            customMinQuantity: 1,
            customMaxQuantity: 5,
            customFreeQuantity: 2,
          },
        ],
      });
    });
  });
});
