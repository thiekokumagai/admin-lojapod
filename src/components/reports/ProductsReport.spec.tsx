import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ProductsReport } from "./ProductsReport";
import type { ProductsReport as ProductsReportData } from "@/services/reports.service";

const useProductsReport = vi.fn();
vi.mock("@/hooks/useReports", () => ({
  useProductsReport: (...args: unknown[]) => useProductsReport(...args),
}));

const filters = { startDate: "2026-11-01", endDate: "2026-11-30", idleDays: 30 };

const data = (over: Partial<ProductsReportData> = {}): ProductsReportData => ({
  periodo: { inicio: "", fim: "" },
  resumo: {
    unidadesTotais: 40,
    unidadesAvulsas: 10,
    unidadesEmCombos: 30,
    combosVendidos: 12,
    itensContandoBoxComoUm: 22,
    produtosDistintos: 2,
    receita: 900,
    lucro: 300,
    margem: 33.3,
    produtosSemCusto: 1,
  },
  produtos: [
    {
      id: "a",
      titulo: "Café Moído",
      categoria: "Cafés",
      unidadesAvulsas: 10,
      unidadesEmCombos: 0,
      unidadesTotais: 10,
      receita: 400,
      receitaLiquida: 400,
      lucro: 120,
      margem: 30,
      semCusto: false,
      estoque: 5,
    },
    {
      id: "b",
      titulo: "Filtro de Papel",
      categoria: "Acessórios",
      unidadesAvulsas: 0,
      unidadesEmCombos: 30,
      unidadesTotais: 30,
      receita: 500,
      receitaLiquida: 500,
      lucro: null,
      margem: null,
      semCusto: true,
      estoque: 2,
    },
  ],
  combos: [
    {
      id: "c1",
      titulo: "Box Café + Filtro",
      categoria: "Boxes",
      quantidade: 12,
      receita: 800,
      receitaLiquida: 800,
      lucro: 200,
      margem: 25,
      semCusto: false,
      composicao: "2x Café Moído, 1x Filtro de Papel",
    },
  ],
  listaTruncada: false,
  parados: {
    diasSemVender: 30,
    quantidade: 1,
    capitalParado: 150,
    semCusto: 0,
    itens: [
      {
        id: "z",
        titulo: "Chá Verde",
        categoria: "Chás",
        estoque: 30,
        preco: 10,
        custoUnitario: 5,
        capitalParado: 150,
        ultimaVenda: null,
        nuncaVendeu: true,
        diasSemVender: 120,
      },
    ],
  },
  ...over,
});

const mockQuery = (d: ProductsReportData | undefined, over: object = {}) =>
  useProductsReport.mockReturnValue({
    data: d,
    isPending: !d,
    isError: false,
    isPlaceholderData: false,
    ...over,
  });

beforeEach(() => useProductsReport.mockReset());

describe("ProductsReport", () => {
  it("mostra produtos vendidos sem contar o box e boxes à parte", () => {
    mockQuery(data());
    render(<ProductsReport filters={filters} onIdleDaysChange={vi.fn()} />);

    const unidades = screen.getByTestId("prod-unidades");
    expect(unidades).toHaveTextContent("40");
    expect(unidades).toHaveTextContent("10 avulsos + 30 dentro de boxes");

    const boxes = screen.getByTestId("prod-boxes");
    expect(boxes).toHaveTextContent("12");
    expect(boxes).toHaveTextContent("seriam 22 itens");
  });

  it("ranking padrão põe o mais vendido (com unidades de box) em primeiro", () => {
    mockQuery(data());
    render(<ProductsReport filters={filters} onIdleDaysChange={vi.fn()} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Filtro de Papel")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Café Moído")).toBeInTheDocument();
  });

  it("'Só avulsos' reordena ignorando as unidades de box", () => {
    mockQuery(data());
    render(<ProductsReport filters={filters} onIdleDaysChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Só avulsos" }));
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Café Moído")).toBeInTheDocument();
  });

  it("'Mais lucrativos' deixa o produto sem custo por último e avisa 'Sem custo'", () => {
    mockQuery(data());
    render(<ProductsReport filters={filters} onIdleDaysChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Mais lucrativos" }));
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Café Moído")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Sem custo")).toBeInTheDocument();
  });

  it("busca por nome ignora acento", () => {
    mockQuery(data());
    render(<ProductsReport filters={filters} onIdleDaysChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Buscar produto"), { target: { value: "cafe" } });
    expect(screen.queryByText("Filtro de Papel")).not.toBeInTheDocument();
    // tabela (computador) e lista (celular) ficam no DOM; o CSS esconde uma delas
    expect(screen.getAllByText("Café Moído").length).toBeGreaterThan(0);
  });

  it("aba Boxes lista a composição e a quantidade vendida", () => {
    mockQuery(data());
    render(<ProductsReport filters={filters} onIdleDaysChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: /Boxes/ }));
    expect(screen.getByText("Box Café + Filtro")).toBeInTheDocument();
    expect(screen.getByText("2x Café Moído, 1x Filtro de Papel")).toBeInTheDocument();
  });

  it("aba Parados mostra dias sem vender e troca a janela", () => {
    mockQuery(data());
    const onIdleDaysChange = vi.fn();
    render(<ProductsReport filters={filters} onIdleDaysChange={onIdleDaysChange} />);
    fireEvent.click(screen.getByRole("tab", { name: /Parados/ }));
    expect(screen.getByText("Chá Verde")).toBeInTheDocument();
    expect(screen.getByText("Nunca vendeu")).toBeInTheDocument();
    expect(screen.getByText("120 dias")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "60 dias" }));
    expect(onIdleDaysChange).toHaveBeenCalledWith(60);
  });

  it("mostra erro quando a consulta falha sem dados", () => {
    useProductsReport.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("falhou"),
      isPlaceholderData: false,
    });
    render(<ProductsReport filters={filters} onIdleDaysChange={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("falhou");
  });
});
