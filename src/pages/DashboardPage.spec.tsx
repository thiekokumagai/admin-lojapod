import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import { getPresetRange } from "@/lib/dashboard-range";
import type { BestSellerItem, DashboardStatsResponse, StoreDiagnosisResponse } from "@/services/dashboard.service";

// O recharts (ResponsiveContainer) usa ResizeObserver, que o jsdom não tem.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

vi.mock("@/hooks/useSettings", () => ({ useSettings: () => ({ data: {}, isLoading: false }) }));
vi.mock("@/hooks/useOrders", () => ({ useOrders: () => ({ data: { meta: { total: 1 } }, isLoading: false }) }));
vi.mock("@/components/admin/OnboardingWidget", () => ({ OnboardingWidget: () => null }));
vi.mock("@/components/dashboard/Sparkline", () => ({ Sparkline: () => null }));

const hooks = vi.hoisted(() => ({
  useDashboardStats: vi.fn(),
  useDashboardRanking: vi.fn(),
  useDashboardProducts: vi.fn(),
  useDashboardOpportunities: vi.fn(),
  useDashboardCategories: vi.fn(),
  useStoreDiagnosis: vi.fn(),
}));

vi.mock("@/hooks/useDashboard", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useDashboard")>("@/hooks/useDashboard");
  return {
    ...actual,
    useDashboardStats: hooks.useDashboardStats,
    useDashboardRanking: hooks.useDashboardRanking,
    useDashboardProducts: hooks.useDashboardProducts,
    useDashboardOpportunities: hooks.useDashboardOpportunities,
    useDashboardCategories: hooks.useDashboardCategories,
  };
});
vi.mock("@/hooks/useStoreDiagnosis", () => ({ useStoreDiagnosis: hooks.useStoreDiagnosis }));

const best = (id: string, title: string, over: Partial<BestSellerItem> = {}): BestSellerItem => ({
  id,
  title,
  categoryTitle: "Cat",
  quantity: 5,
  totalRevenue: 500,
  receitaLiquida: 500,
  lucro: 200,
  margem: 40,
  semCusto: false,
  ...over,
});

const statsResponse = (): DashboardStatsResponse => ({
  stats: {
    totalVendas: 12345.67,
    totalPedidos: 80,
    ticketMedio: 154,
    totalProdutosVendidos: 210,
    produtosAtivos: 10,
    produtosInativos: 1,
    visitas: 900,
    conversao: 3.4,
    tempoMedio: 2,
    abandonos: 41,
    lucroBruto: 4870.25,
    margemBruta: 39.4,
    custoProdutosVendidos: 5000,
    descontosConcedidos: 300,
    taxaCartao: 100,
    receitaItens: 1000,
    receitaComCusto: 900,
  },
  comparacao: null,
  semCusto: { count: 1, receitaLiquida: 50, produtos: [{ id: "x", title: "Boné" }] },
  chartData: [{ name: "10h", vendas: 100, lucro: 40 }],
  bestSellers: [best("a", "Camiseta"), best("b", "Caneca")],
});

const diagnosisResponse = (): StoreDiagnosisResponse => ({
  periodo: { dias: 1 },
  resultado: {
    lucroBruto: 100,
    custosFixos: 50,
    lucroLiquido: 50,
    custosFixosProporcionais: true,
    pontoEquilibrioReceita: 200,
    pontoEquilibrioPedidos: 4,
    receitaLiquidaItens: 300,
    pedidos: 8,
  },
  custosFixosPorItem: [],
  itens: [
    {
      id: "descontos",
      severity: "critical",
      title: "Descontos = 14% das vendas",
      detail: "Cupons somaram R$ 1.840,00.",
      amount: 1840,
      estimated: false,
      actionLabel: "Ver cupons",
      actionUrl: "/cupons",
    },
  ],
});

const query = (data: unknown, over: Record<string, unknown> = {}) => ({
  data,
  isPending: false,
  isPlaceholderData: false,
  isError: false,
  isFetching: false,
  error: null,
  fetchStatus: "idle",
  refetch: vi.fn(),
  ...over,
});

function renderPage() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const lastRange = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1)?.[0];

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useDashboardStats.mockReturnValue(query(statsResponse()));
  hooks.useDashboardRanking.mockReturnValue(query(undefined, { isPending: false }));
  hooks.useDashboardProducts.mockReturnValue(
    query([
      best("a", "Camiseta", { totalRevenue: 900, quantity: 9, lucro: 300, margem: 33 }),
      best("b", "Caneca", { totalRevenue: 80, quantity: 20, lucro: 60, margem: 75 }),
      best("c", "Boné", { totalRevenue: 20, quantity: 1, lucro: null, margem: null, semCusto: true }),
    ]),
  );
  hooks.useDashboardOpportunities.mockReturnValue(query(null, { isPending: true }));
  hooks.useDashboardCategories.mockReturnValue(query([]));
  hooks.useStoreDiagnosis.mockReturnValue(query(diagnosisResponse()));
});

describe("DashboardPage", () => {
  it("Resumo: 3 números grandes, atenção, gráfico, top 5 e métricas secundárias", () => {
    renderPage();
    expect(screen.getByTestId("hero-kpis")).toHaveTextContent("R$ 12.345,67");
    expect(screen.getByTestId("hero-kpis")).toHaveTextContent("39,4%");
    expect(screen.getByTestId("attention-strip")).toHaveTextContent("Descontos = 14% das vendas");
    expect(screen.getByText("Faturamento × Lucro")).toBeInTheDocument();
    expect(screen.getByText("Top 5 produtos")).toBeInTheDocument();
    expect(screen.getByTestId("secondary-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("missing-cost")).toHaveTextContent("1 produto vendido sem custo cadastrado");
    expect(screen.getByRole("tab", { name: "Resumo" })).toHaveAttribute("aria-selected", "true");
  });

  it("a faixa de métricas (pedidos, ticket, itens, visitas, conversão...) fica no topo, antes dos 3 cartões grandes", () => {
    renderPage();
    const strip = screen.getByTestId("secondary-metrics");
    const hero = screen.getByTestId("hero-kpis");
    expect(strip.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(strip.compareDocumentPosition(screen.getByTestId("attention-strip")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("tem as 4 abas: Resumo, Produtos, Estoque e Diagnóstico", () => {
    renderPage();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Resumo", "Produtos", "Estoque", "Diagnóstico"]);
  });

  it("o período do topo vale para todas as abas", () => {
    renderPage();
    expect(lastRange(hooks.useDashboardStats)).toEqual(getPresetRange("today"));

    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));
    const seven = getPresetRange("7days");
    expect(lastRange(hooks.useDashboardStats)).toEqual(seven);

    // Diagnóstico usa o mesmo período, sem seletor próprio
    fireEvent.click(screen.getByRole("tab", { name: "Diagnóstico" }));
    expect(lastRange(hooks.useStoreDiagnosis)).toEqual(seven);
    expect(screen.getByText("Onde a loja está perdendo")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Período" })).toBeInTheDocument();

    // Produtos também
    fireEvent.click(screen.getByRole("tab", { name: "Produtos" }));
    expect(lastRange(hooks.useDashboardProducts)).toEqual(seven);
    expect(screen.getByRole("button", { name: "7 dias" })).toHaveAttribute("aria-pressed", "true");
  });

  it("Estoque não usa período: o filtro some", () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Estoque" }));
    expect(screen.queryByRole("group", { name: "Período" })).toBeNull();
    expect(screen.getByText("Situação atual do estoque")).toBeInTheDocument();
  });

  it("'Ver todos os produtos' abre a aba Produtos e 'Ver tudo' abre o Diagnóstico", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Ver todos os produtos/ }));
    expect(screen.getByRole("tab", { name: "Produtos" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: "Resumo" }));
    fireEvent.click(screen.getByRole("button", { name: /Ver tudo/ }));
    expect(screen.getByRole("tab", { name: "Diagnóstico" })).toHaveAttribute("aria-selected", "true");
  });

  it("Produtos: tabela com os 4 critérios, curva ABC e produto sem custo no fim do lucro/margem", () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Produtos" }));

    const table = screen.getByRole("table");
    const names = () => within(table).getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[1].textContent);
    // padrão: por faturamento
    expect(names()).toEqual(["Camiseta" + "Cat", "Caneca" + "Cat", "Boné" + "Cat"]);

    // Curva ABC: 900 de 1000 => A; depois 90% => B; depois 98% => C
    const abcCells = within(table).getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell").at(-1)?.textContent);
    expect(abcCells).toEqual(["A", "B", "C"]);

    // margem: Caneca (75) > Camiseta (33) > Boné (sem custo, por último)
    fireEvent.click(within(table).getByRole("button", { name: /Margem/ }));
    expect(names()).toEqual(["Caneca" + "Cat", "Camiseta" + "Cat", "Boné" + "Cat"]);
    expect(within(table).getByText("Sem custo")).toBeInTheDocument();

    // quantidade: Caneca (20) > Camiseta (9) > Boné (1)
    fireEvent.click(within(table).getByRole("button", { name: /Qtd/ }));
    expect(names()[0]).toBe("Caneca" + "Cat");
  });

  it("erro na primeira carga mostra o aviso com 'Tentar de novo'", () => {
    hooks.useDashboardStats.mockReturnValue(query(undefined, { isError: true, error: new Error("falhou"), isPending: false }));
    renderPage();
    expect(screen.getByText("Não foi possível carregar o dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tentar de novo/ })).toBeInTheDocument();
  });

  it("período personalizado sem datas pede as datas e não mostra números", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Datas/ }));
    expect(screen.getByText(/Escolha a data inicial e a final/)).toBeInTheDocument();
    expect(screen.queryByTestId("hero-kpis")).toBeNull();
  });
});
