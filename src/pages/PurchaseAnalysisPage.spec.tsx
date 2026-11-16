import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import PurchaseAnalysisPage from "./PurchaseAnalysisPage";

// Nada de API nem WhatsApp real: hooks e o abridor de link são mocks.
const openWhatsAppShare = vi.fn();
vi.mock("@/utils/whatsapp", () => ({ openWhatsAppShare: (text: string) => openWhatsAppShare(text) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/hooks/useCategories", () => ({ useCategories: () => ({ data: [], loading: false }) }));

const analysis = {
  orcamento_disponivel: 1000,
  valor_total_sugerido: 105,
  total_itens: 3,
  itens: [
    { id_produto: "1", descricao: "Pod Menta", categoria: "Pods", quantidade_sugerida: 10, valor_custo: 5, valor_total_sugerido: 50, prioridade: "alta" },
    { id_produto: "2", descricao: "Álcool", categoria: "Acessórios", quantidade_sugerida: 2, valor_custo: 20, valor_total_sugerido: 40, prioridade: "baixa" },
    { id_produto: "3", descricao: "Zebra", categoria: "Pods", variacao: "Uva", quantidade_sugerida: 1, valor_custo: 15, valor_total_sugerido: 15, prioridade: "media" },
  ],
};
vi.mock("@/hooks/useInvestments", () => ({
  usePurchaseAnalysis: () => ({ data: analysis, isLoading: false, isFetching: false }),
}));

function renderResult() {
  render(<PurchaseAnalysisPage />);
  fireEvent.click(screen.getByRole("button", { name: /Simular Compra/ }));
  return within(screen.getByRole("table"));
}

const nameCells = (table: ReturnType<typeof within>) =>
  table.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[2].textContent);

describe("PurchaseAnalysisPage - seleção e WhatsApp", () => {
  beforeEach(() => openWhatsAppShare.mockClear());

  it("começa sem seleção e com o botão do WhatsApp desabilitado", () => {
    renderResult();
    expect(screen.getByRole("button", { name: /Enviar no WhatsApp/ })).toBeDisabled();
    expect(screen.getByText(/0 de 3 selecionados/)).toBeInTheDocument();
  });

  it("seleciona itens, soma o total e envia só os escolhidos", () => {
    const table = renderResult();
    fireEvent.click(table.getByLabelText("Selecionar Pod Menta"));
    fireEvent.click(table.getByLabelText("Selecionar Zebra"));

    expect(screen.getByText(/2 de 3 selecionados/)).toBeInTheDocument();
    const send = screen.getByRole("button", { name: /Enviar no WhatsApp/ });
    expect(send).toBeEnabled();
    fireEvent.click(send);

    expect(openWhatsAppShare).toHaveBeenCalledTimes(1);
    // só os marcados, sem preço e agrupados por categoria
    expect(openWhatsAppShare.mock.calls[0][0]).toBe("Pods\nPod Menta - 10\nZebra Uva - 1");
  });

  it("selecionar todos e limpar", () => {
    renderResult();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    expect(screen.getByText(/3 de 3 selecionados/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(screen.getByText(/0 de 3 selecionados/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar no WhatsApp/ })).toBeDisabled();
  });

  it("a mensagem segue a ordem atual da tabela", () => {
    const table = renderResult();
    // padrão: categoria A-Z → Acessórios (Álcool), Pods (Pod Menta, Zebra)
    expect(nameCells(table).map((t) => t?.replace(/Uva$/, ""))).toEqual(["Álcool", "Pod Menta", "Zebra"]);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));

    fireEvent.click(screen.getByRole("button", { name: /A-Z \/ Menor/ })); // inverte para desc
    expect(nameCells(table).map((t) => t?.replace(/Uva$/, ""))).toEqual(["Pod Menta", "Zebra", "Álcool"]);

    fireEvent.click(screen.getByRole("button", { name: /Enviar no WhatsApp/ }));
    // ordem da tela (categoria Z-A): Pods (Pod Menta, Zebra) e depois Acessórios
    expect(openWhatsAppShare.mock.calls[0][0]).toBe("Pods\nPod Menta - 10\nZebra Uva - 1\n\nAcessórios\nÁlcool - 2");
  });
});
