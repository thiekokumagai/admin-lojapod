import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { BestSellerItem } from "@/services/dashboard.service";

const rows: BestSellerItem[] = [
  {
    id: "cam",
    title: "Camiseta",
    categoryTitle: "Roupas",
    quantity: 5,
    totalRevenue: 250,
    receitaLiquida: 250,
    lucro: 150,
    margem: 60,
    semCusto: false,
    variacoes: [
      { label: "P / Azul", quantity: 3, totalRevenue: 150 },
      { label: "M / Preto", quantity: 2, totalRevenue: 100 },
    ],
  },
  {
    id: "sim",
    title: "Caneca",
    categoryTitle: "Casa",
    quantity: 1,
    totalRevenue: 30,
    receitaLiquida: 30,
    lucro: 10,
    margem: 33.3,
    semCusto: false,
  },
];

vi.mock("@/hooks/useDashboard", () => ({
  PRODUCTS_TABLE_LIMIT: 100,
  useDashboardProducts: () => ({ data: rows, isPending: false, isError: false, isPlaceholderData: false }),
}));

import { ProductsTab } from "./ProductsTab";

const renderTab = () =>
  render(
    <ProductsTab
      range={{ start: "2026-11-01", end: "2026-11-30" }}
      stats={null}
      missingCost={null}
      categories={[]}
      categoryId="all"
      onCategoryChange={vi.fn()}
    />,
  );

describe("ProductsTab: variações em Produtos vendidos", () => {
  it("só produto com variação ganha o botão; abre e fecha as sub-linhas na tabela", () => {
    renderTab();
    // tabela (computador) e lista (celular) ficam no DOM; o CSS decide qual aparece
    const buttons = screen.getAllByRole("button", { name: "Ver variações de Camiseta" });
    expect(buttons).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /variações de Caneca/ })).toBeNull();
    expect(screen.queryAllByTestId("variation-row")).toHaveLength(0);

    fireEvent.click(buttons[0]);
    const subRows = screen.getAllByTestId("variation-row");
    expect(subRows).toHaveLength(2);
    expect(within(subRows[0]).getByText("↳ P / Azul")).toBeInTheDocument();
    expect(within(subRows[0]).getByText("3")).toBeInTheDocument();
    expect(within(subRows[0]).getByText("R$ 150,00")).toBeInTheDocument();
    expect(within(subRows[1]).getByText("↳ M / Preto")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Esconder variações de Camiseta" })[0]);
    expect(screen.queryAllByTestId("variation-row")).toHaveLength(0);
  });

  it("no celular a lista de variações abre dentro do item, sem colunas novas", () => {
    renderTab();
    fireEvent.click(screen.getAllByRole("button", { name: "Ver variações de Camiseta" })[1]);
    const list = screen.getByTestId("variation-list");
    expect(within(list).getByText("P / Azul")).toBeInTheDocument();
    expect(within(list).getByText("3 un. · R$ 150,00")).toBeInTheDocument();
    expect(within(list).getByText("2 un. · R$ 100,00")).toBeInTheDocument();
  });
});
