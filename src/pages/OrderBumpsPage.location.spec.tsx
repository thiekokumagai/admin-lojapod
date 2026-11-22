import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Nada de rede: serviço de ofertas, produtos, categorias e avisos são mocks.
const { list, create, update, reorder } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  reorder: vi.fn(),
}));

vi.mock("@/services/order-bump.service", () => ({
  orderBumpService: {
    list: () => list(),
    create: (payload: unknown) => create(payload),
    update: (id: string, payload: unknown) => update(id, payload),
    reorder: (ids: string[]) => reorder(ids),
    toggleActive: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({ data: { products: [] }, isLoading: false }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: [
      { id: "cat-1", title: "Bolos" },
      { id: "cat-2", title: "Salgados" },
    ],
  }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import OrderBumpsPage from "./OrderBumpsPage";

const bump = (id: string, displayLocation: string | undefined, title = "Leve junto uma Bebida") => ({
  id,
  storeId: "store-1",
  title,
  isActive: true,
  priority: 0,
  triggerType: "ALL",
  triggerProductId: null,
  triggerCategoryId: null,
  suggestedProductId: "p1",
  customPrice: null,
  discountPercent: null,
  displayLocation,
  viewsCount: 0,
  conversionsCount: 0,
  totalRevenue: 0,
  createdAt: "2026-11-17T00:00:00.000Z",
  updatedAt: "2026-11-17T00:00:00.000Z",
  suggestedProduct: { id: "p1", title: "Coca-Cola 310ml", price: 7, images: [], items: [{ id: "i1", stock: 5 }] },
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OrderBumpsPage />
    </QueryClientProvider>,
  );
}

describe("OrderBumpsPage: onde mostrar a oferta (carrinho / tela do produto / os dois)", () => {
  beforeEach(() => {
    list.mockReset();
    create.mockReset();
    update.mockReset().mockResolvedValue({});
    reorder.mockReset().mockResolvedValue([]);
  });
  afterEach(() => cleanup());

  it("a listagem mostra o local de cada oferta; oferta antiga sem o campo vale 'Carrinho'", async () => {
    list.mockResolvedValue([bump("a", "CART"), bump("b", "PRODUCT"), bump("c", "BOTH"), bump("d", undefined)]);
    renderPage();

    await waitFor(() => expect(screen.getAllByText("Tela do produto").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Carrinho + tela do produto").length).toBeGreaterThan(0);
    // "Carrinho" aparece para a oferta CART e para a antiga (sem o campo): 2 ofertas, em cartão e tabela
    expect(screen.getAllByText("Carrinho").length).toBeGreaterThanOrEqual(2);
  });

  it("o título deixou de dizer só 'na Sacola'", async () => {
    list.mockResolvedValue([bump("a", "BOTH")]);
    renderPage();

    fireEvent.click((await screen.findAllByText("Editar"))[0]);

    expect(await screen.findByText("Título da seção (carrinho e tela do produto)")).toBeInTheDocument();
    expect(screen.queryByText("Título da Seção na Sacola")).not.toBeInTheDocument();
  });

  it("nova oferta: 'Onde mostrar?' começa em 'Só no carrinho' (como sempre foi)", async () => {
    list.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByText("Criar primeira sugestão"));

    expect(await screen.findByText("Onde mostrar?")).toBeInTheDocument();
    expect(screen.getByText("Aparece na sacola, abaixo dos itens (como sempre foi).")).toBeInTheDocument();
    expect(screen.getByTestId("order-bump-location").textContent).toContain("Só no carrinho");
  });

  it("editar uma oferta da tela do produto: abre com o local certo e salva com ele", async () => {
    list.mockResolvedValue([bump("b1", "PRODUCT")]);
    renderPage();

    fireEvent.click((await screen.findAllByText("Editar"))[0]);

    expect(await screen.findByText("Onde mostrar?")).toBeInTheDocument();
    expect(screen.getByTestId("order-bump-location").textContent).toContain("Só na tela do produto");

    fireEvent.click(screen.getByText("Salvar Alterações"));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const [id, payload] = update.mock.calls[0] as [string, { displayLocation: string }];
    expect(id).toBe("b1");
    expect(payload.displayLocation).toBe("PRODUCT");
  });

  it("oferta antiga (sem o campo) abre como 'Só no carrinho' e salva CART", async () => {
    list.mockResolvedValue([bump("b2", undefined)]);
    renderPage();

    fireEvent.click((await screen.findAllByText("Editar"))[0]);
    expect(await screen.findByTestId("order-bump-location")).toHaveTextContent("Só no carrinho");

    fireEvent.click(screen.getByText("Salvar Alterações"));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect((update.mock.calls[0][1] as { displayLocation: string }).displayLocation).toBe("CART");
  });

  it("modal exibe rótulo neutro 'Preço da Oferta', opções de preço e botões de ação com espaçamento e responsividade", async () => {
    list.mockResolvedValue([]);
    renderPage();

    fireEvent.click(await screen.findByText("Criar primeira sugestão"));

    // Rótulo neutro da seção de preço
    expect(await screen.findByText("Preço da Oferta")).toBeInTheDocument();
    expect(screen.queryByText("Preço no Carrinho")).not.toBeInTheDocument();

    // Botões de tipo de preço com suas opções
    expect(screen.getByRole("button", { name: /Preço Normal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Preço Fixo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desconto/i })).toBeInTheDocument();

    // Botões de ação do rodapé
    const cancelBtn = screen.getByRole("button", { name: /Cancelar/i });
    const submitBtn = screen.getByRole("button", { name: /Criar Sugestão/i });
    expect(cancelBtn).toBeInTheDocument();
    expect(submitBtn).toBeInTheDocument();
    expect(cancelBtn.className).toContain("w-full sm:w-auto");
    expect(submitBtn.className).toContain("w-full sm:w-auto");
  });

  it("permite reordenar as sugestões com os botões de mover para baixo/cima e chama orderBumpService.reorder", async () => {
    list.mockResolvedValue([bump("b1", "BOTH", "Item 1"), bump("b2", "BOTH", "Item 2")]);
    renderPage();

    await waitFor(() => expect(screen.getAllByText("#1").length).toBeGreaterThan(0));

    const moveDownButtons = screen.getAllByTitle("Mover para baixo");
    fireEvent.click(moveDownButtons[0]);

    await waitFor(() => expect(reorder).toHaveBeenCalledWith(["b2", "b1"]));
  });

  it("salva regra do tipo CATEGORY com múltiplas categorias sem ReferenceError e envia triggerCategoryIds", async () => {
    list.mockResolvedValue([
      {
        ...bump("b-cat", "BOTH", "Bebida para Bolos e Salgados"),
        triggerType: "CATEGORY",
        triggerCategoryId: "cat-1",
        triggerCategoryIds: ["cat-1"],
        triggerCategory: { id: "cat-1", title: "Bolos" },
        triggerCategories: [{ id: "cat-1", title: "Bolos" }],
      },
    ]);
    renderPage();

    fireEvent.click((await screen.findAllByText("Editar"))[0]);

    expect(await screen.findByText("Selecione as Categorias Gatilho *")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Salgados/i }));
    fireEvent.click(screen.getByText("Salvar Alterações"));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const [id, payload] = update.mock.calls[0] as [
      string,
      { triggerType: string; triggerCategoryId: string | null; triggerCategoryIds: string[] },
    ];
    expect(id).toBe("b-cat");
    expect(payload.triggerType).toBe("CATEGORY");
    expect(payload.triggerCategoryId).toBe("cat-1");
    expect(payload.triggerCategoryIds).toEqual(["cat-1", "cat-2"]);
  });
});
