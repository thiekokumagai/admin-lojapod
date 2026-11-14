import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AttentionStrip } from "./AttentionStrip";
import { HeroKpis } from "./HeroKpis";
import { SecondaryMetrics } from "./SecondaryMetrics";
import { TopProducts } from "./TopProducts";
import { MissingCostNotice } from "./MissingCostNotice";
import type { BestSellerItem, DashboardComparison, DashboardKPIs, DiagnosisItem } from "@/services/dashboard.service";

// recharts precisa de tamanho de verdade para desenhar; aqui só interessa o texto.
vi.mock("./Sparkline", () => ({ Sparkline: () => <div data-testid="sparkline" /> }));

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

const stats = (over: Partial<DashboardKPIs> = {}): DashboardKPIs => ({
  totalVendas: 12345.67,
  totalPedidos: 80,
  ticketMedio: 154.32,
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
  receitaItens: 12000,
  receitaComCusto: 11000,
  ...over,
});

const prev = (over: Partial<DashboardComparison> = {}): DashboardComparison => ({
  inicio: "",
  fim: "",
  totalVendas: 10000,
  totalPedidos: 60,
  ticketMedio: 166,
  totalProdutosVendidos: 200,
  lucroBruto: 5000,
  margemBruta: 40,
  visitas: 1000,
  conversao: 3,
  abandonos: 50,
  ...over,
});

const diag = (over: Partial<DiagnosisItem>): DiagnosisItem => ({
  id: "d",
  severity: "warning",
  title: "Descontos = 14% das vendas",
  detail: "",
  amount: 1840,
  estimated: false,
  actionLabel: "Ver cupons",
  actionUrl: "/cupons",
  ...over,
});

beforeEach(() => navigate.mockClear());

describe("HeroKpis", () => {
  it("mostra faturamento, lucro e margem em destaque, com variação contra o período anterior", () => {
    render(<HeroKpis stats={stats()} prev={prev()} chartData={[]} loading={false} comparisonLabel="vs. ontem" />);
    const hero = screen.getByTestId("hero-kpis");
    expect(hero).toHaveTextContent("Faturamento");
    expect(hero).toHaveTextContent("R$ 12.345,67");
    expect(hero).toHaveTextContent("R$ 4.870,25");
    expect(hero).toHaveTextContent("39,4%");
    expect(hero).toHaveTextContent("+23%"); // 12345,67 vs 10000
    expect(hero).toHaveTextContent("vs. ontem");
    expect(screen.getByRole("progressbar", { name: "Margem bruta" })).toHaveAttribute("aria-valuenow", "39.4");
  });

  it("margem sem custo cadastrado mostra '--', nunca uma margem falsa", () => {
    render(<HeroKpis stats={stats({ margemBruta: null })} prev={null} chartData={[]} loading={false} comparisonLabel="" />);
    expect(screen.getByTestId("hero-kpis")).toHaveTextContent("--");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("carregando mostra o esqueleto, sem valores", () => {
    render(<HeroKpis stats={null} prev={null} chartData={[]} loading comparisonLabel="" />);
    expect(screen.getByTestId("hero-kpis")).not.toHaveTextContent("R$");
  });
});

describe("SecondaryMetrics", () => {
  it("lista as métricas secundárias de forma compacta", () => {
    render(<SecondaryMetrics stats={stats()} prev={prev()} loading={false} comparisonLabel="vs. ontem" />);
    const strip = screen.getByTestId("secondary-metrics");
    for (const label of ["Pedidos", "Ticket médio", "Itens vendidos", "Visitas", "Conversão", "Tempo médio", "Carrinhos abandonados"]) {
      expect(strip).toHaveTextContent(label);
    }
    expect(strip).toHaveTextContent("80");
    expect(strip).toHaveTextContent("3,4%");
  });
});

describe("AttentionStrip", () => {
  const renderStrip = (props: Partial<React.ComponentProps<typeof AttentionStrip>>) =>
    render(
      <MemoryRouter>
        <AttentionStrip items={undefined} loading={false} onSeeAll={vi.fn()} {...props} />
      </MemoryRouter>,
    );

  it("mostra os problemas com valor em R$ e leva à tela certa ao clicar", () => {
    renderStrip({ items: [diag({}), diag({ id: "m", title: "Campeões com margem baixa", severity: "critical", actionUrl: "/produtos", amount: 1200, estimated: true })] });
    expect(screen.getByTestId("attention-strip")).toHaveTextContent("Precisa de atenção");
    expect(screen.getByText("R$ 1.840,00")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Campeões com margem baixa"));
    expect(navigate).toHaveBeenCalledWith("/produtos");
  });

  it("'Ver tudo' abre o Diagnóstico", () => {
    const onSeeAll = vi.fn();
    renderStrip({ items: [diag({})], onSeeAll });
    fireEvent.click(screen.getByRole("button", { name: /Ver tudo/ }));
    expect(onSeeAll).toHaveBeenCalled();
  });

  it("sem problemas mostra 'tudo certo'", () => {
    renderStrip({ items: [diag({ severity: "ok" })] });
    expect(screen.getByTestId("attention-ok")).toBeInTheDocument();
  });

  it("sem dados do diagnóstico não ocupa espaço; carregando mostra esqueleto", () => {
    const { container, rerender } = renderStrip({ items: undefined });
    expect(container).toBeEmptyDOMElement();
    rerender(
      <MemoryRouter>
        <AttentionStrip items={undefined} loading onSeeAll={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("attention-loading")).toBeInTheDocument();
  });
});

describe("TopProducts", () => {
  const item = (id: string, title: string, over: Partial<BestSellerItem> = {}): BestSellerItem => ({
    id,
    title,
    categoryTitle: "Cat",
    quantity: 10,
    totalRevenue: 500,
    receitaLiquida: 500,
    lucro: 200,
    margem: 40,
    semCusto: false,
    ...over,
  });
  const base = {
    totalRevenue: 2000,
    sort: "quantity" as const,
    onSortChange: vi.fn(),
    categories: [],
    categoryId: "all",
    onCategoryChange: vi.fn(),
    loading: false,
    updating: false,
    onSeeAll: vi.fn(),
  };

  it("mostra participação no faturamento e o valor do critério escolhido", () => {
    render(<TopProducts {...base} items={[item("a", "Camiseta"), item("b", "Caneca", { quantity: 4, totalRevenue: 100, lucro: null, margem: null, semCusto: true })]} />);
    expect(screen.getByText("Camiseta")).toBeInTheDocument();
    expect(screen.getByText(/25% das vendas/)).toBeInTheDocument(); // 500 de 2000
    expect(screen.getByText("10 un.")).toBeInTheDocument();
  });

  it("critério lucro: produto sem custo aparece como 'Sem custo'", () => {
    render(<TopProducts {...base} sort="profit" items={[item("a", "Camiseta"), item("b", "Caneca", { lucro: null, margem: null })]} />);
    expect(screen.getByText("Sem custo")).toBeInTheDocument();
  });

  it("trocar o critério chama onSortChange; 'Ver todos' abre a aba Produtos", () => {
    const onSortChange = vi.fn();
    const onSeeAll = vi.fn();
    render(<TopProducts {...base} onSortChange={onSortChange} onSeeAll={onSeeAll} items={[item("a", "Camiseta")]} />);
    fireEvent.click(screen.getByRole("button", { name: "Margem" }));
    expect(onSortChange).toHaveBeenCalledWith("margin");
    fireEvent.click(screen.getByRole("button", { name: /Ver todos os produtos/ }));
    expect(onSeeAll).toHaveBeenCalled();
  });

  it("sem vendas mostra o estado vazio", () => {
    render(<TopProducts {...base} items={[]} />);
    expect(screen.getByText(/Nenhum produto vendido/)).toBeInTheDocument();
  });
});

describe("MissingCostNotice", () => {
  it("avisa quantos produtos estão sem custo", () => {
    render(<MissingCostNotice missingCost={{ count: 2, receitaLiquida: 300, produtos: [{ id: "a", title: "Caneca" }, { id: "b", title: "Boné" }] }} />);
    expect(screen.getByTestId("missing-cost")).toHaveTextContent("2 produtos vendidos sem custo cadastrado");
    expect(screen.getByTestId("missing-cost")).toHaveTextContent("Caneca, Boné");
  });

  it("não renderiza quando todos têm custo", () => {
    const { container } = render(<MissingCostNotice missingCost={{ count: 0, receitaLiquida: 0, produtos: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
