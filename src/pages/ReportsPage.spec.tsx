import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReportsPage from "./ReportsPage";

const sales = vi.fn();
const financial = vi.fn();
const products = vi.fn();

vi.mock("@/components/reports/SalesReport", () => ({
  SalesReport: (props: unknown) => {
    sales(props);
    return <div data-testid="sales-mock" />;
  },
}));
vi.mock("@/components/reports/FinancialReport", () => ({
  FinancialReport: (props: unknown) => {
    financial(props);
    return <div data-testid="financial-mock" />;
  },
}));
vi.mock("@/components/reports/ProductsReport", () => ({
  ProductsReport: (props: unknown) => {
    products(props);
    return <div data-testid="products-mock" />;
  },
}));
vi.mock("@/hooks/useDashboard", () => ({
  useDashboardCategories: () => ({ data: [{ id: "cat1", title: "Cafés" }] }),
}));

const renderPage = (url = "/relatorios") =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[url]}>
        <ReportsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const lastFilters = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls.at(-1)![0].filters;

beforeEach(() => {
  sales.mockClear();
  financial.mockClear();
  products.mockClear();
});

describe("ReportsPage", () => {
  it("abre em Vendas e troca de relatório pelos cartões de tipo", () => {
    renderPage();
    expect(screen.getByTestId("sales-mock")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Financeiro/ }));
    expect(screen.getByTestId("financial-mock")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Produtos/ }));
    expect(screen.getByTestId("products-mock")).toBeInTheDocument();
  });

  it("respeita o tipo vindo da URL", () => {
    renderPage("/relatorios?tipo=produtos");
    expect(screen.getByTestId("products-mock")).toBeInTheDocument();
  });

  it("começa em 30 dias e manda as datas para o relatório", () => {
    renderPage();
    const f = lastFilters(sales);
    expect(f.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(f.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(f.startDate < f.endDate).toBe(true);
  });

  it("filtro de forma de pagamento chega ao relatório e 'Limpar filtros' remove", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Forma de pagamento"), { target: { value: "pix" } });
    expect(lastFilters(sales).paymentMethod).toBe("pix");
    expect(screen.getByText("Filtros (1)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Limpar filtros/ }));
    expect(lastFilters(sales).paymentMethod).toBeUndefined();
  });

  it("cada relatório usa só os filtros que fazem sentido para ele", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Status do pedido"), { target: { value: "COMPLETED" } });
    expect(lastFilters(sales).status).toBe("COMPLETED");

    // Produtos não tem status, mas tem categoria
    fireEvent.click(screen.getByRole("tab", { name: /Produtos/ }));
    expect(screen.queryByLabelText("Status do pedido")).not.toBeInTheDocument();
    expect(lastFilters(products).status).toBeUndefined();
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "cat1" } });
    expect(lastFilters(products).categoryId).toBe("cat1");
  });

  it("produtos envia a janela de produtos parados e aceita trocar", () => {
    renderPage("/relatorios?tipo=produtos");
    expect(lastFilters(products).idleDays).toBe(30);
    act(() => products.mock.calls.at(-1)![0].onIdleDaysChange(60));
    expect(lastFilters(products).idleDays).toBe(60);
  });
});
