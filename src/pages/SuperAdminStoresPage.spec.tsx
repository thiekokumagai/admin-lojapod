import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SuperAdminStoresPage from "./SuperAdminStoresPage";

const mockGetStores = vi.fn();
const mockUpdateStore = vi.fn();
const mockCreateStore = vi.fn();

vi.mock("../services/stores.service", () => ({
  storesService: {
    getStores: () => mockGetStores(),
    updateStore: (...args: unknown[]) => mockUpdateStore(...args),
    createStore: (...args: unknown[]) => mockCreateStore(...args),
    toggleStoreActive: vi.fn(),
    deleteStore: vi.fn(),
  },
}));

const STORES_FIXTURE = [
  {
    id: "store-1",
    title: "Vem di Pod",
    subdomain: "vemdipod",
    adminEmail: "dono@vemdipod.com",
    businessType: "POD" as const,
    isActive: true,
    createdAt: "2026-11-10T12:00:00.000Z",
    _count: { products: 24, orders: 12, customers: 8 },
  },
  {
    id: "store-2",
    title: "Sabor Express",
    subdomain: "saborexpress",
    adminEmail: "contato@saborexpress.com",
    businessType: "FOOD" as const,
    isActive: false,
    createdAt: "2026-11-15T12:00:00.000Z",
    _count: { products: 15, orders: 5, customers: 4 },
  },
];

describe("SuperAdminStoresPage — Senha, anti-autofill e layout com filtros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStores.mockResolvedValue(STORES_FIXTURE);
    mockUpdateStore.mockResolvedValue(STORES_FIXTURE[0]);
    mockCreateStore.mockResolvedValue(STORES_FIXTURE[0]);
  });

  it("inicia senha vazia com proteção anti-autofill e alterna visibilidade no modal Editar Loja", async () => {
    render(<SuperAdminStoresPage />);

    expect(await screen.findByText("Vem di Pod")).toBeInTheDocument();

    const editButtons = screen.getAllByTitle("Editar Loja");
    fireEvent.click(editButtons[0]);

    const passwordInput = screen.getByLabelText(/Redefinir Senha do Admin/i) as HTMLInputElement;
    expect(passwordInput.value).toBe("");
    expect(passwordInput.type).toBe("password");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
    expect(passwordInput).toHaveAttribute("name", "store-admin-reset-password");
    expect(passwordInput).toHaveAttribute("readonly");

    // Foco libera o campo para digitação
    fireEvent.focus(passwordInput);
    expect(passwordInput).not.toHaveAttribute("readonly");

    // Botão de olho alterna password <-> text
    const toggleBtn = screen.getByRole("button", { name: /Mostrar nova senha/i });
    expect(toggleBtn).toHaveAttribute("type", "button");
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    const hideBtn = screen.getByRole("button", { name: /Ocultar nova senha/i });
    fireEvent.click(hideBtn);
    expect(passwordInput.type).toBe("password");

    // Fecha com olho aberto e reabre: deve resetar para password e vazio
    fireEvent.click(screen.getByRole("button", { name: /Mostrar nova senha/i }));
    expect(passwordInput.type).toBe("text");
    fireEvent.change(passwordInput, { target: { value: "novaSenha123" } });

    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));
    fireEvent.click(screen.getAllByTitle("Editar Loja")[0]);

    const reopenedInput = screen.getByLabelText(/Redefinir Senha do Admin/i) as HTMLInputElement;
    expect(reopenedInput.value).toBe("");
    expect(reopenedInput.type).toBe("password");
    expect(reopenedInput).toHaveAttribute("readonly");
  });

  it("não envia password no payload de edição quando o campo fica vazio", async () => {
    render(<SuperAdminStoresPage />);
    expect(await screen.findByText("Vem di Pod")).toBeInTheDocument();

    fireEvent.click(screen.getAllByTitle("Editar Loja")[0]);
    fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(mockUpdateStore).toHaveBeenCalledTimes(1);
    });
    const payload = mockUpdateStore.mock.calls[0][1];
    expect(payload).not.toHaveProperty("password");
  });

  it("inicia senha vazia com anti-autofill e toggle de olho no modal Cadastrar Nova Loja", async () => {
    render(<SuperAdminStoresPage />);
    expect(await screen.findByText("Vem di Pod")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Nova Loja/i }));

    const passwordInput = screen.getByLabelText(/Senha Inicial do Admin/i) as HTMLInputElement;
    expect(passwordInput.value).toBe("");
    expect(passwordInput.type).toBe("password");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
    expect(passwordInput).toHaveAttribute("readonly");

    fireEvent.focus(passwordInput);
    expect(passwordInput).not.toHaveAttribute("readonly");

    fireEvent.click(screen.getByRole("button", { name: /Mostrar senha inicial/i }));
    expect(passwordInput.type).toBe("text");

    // Fechar e reabrir reseta visibilidade
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Nova Loja/i }));

    const reopenedInput = screen.getByLabelText(/Senha Inicial do Admin/i) as HTMLInputElement;
    expect(reopenedInput.type).toBe("password");
    expect(reopenedInput.value).toBe("");
  });

  it("renderiza KPIs e filtra lojas por busca, status e segmento", async () => {
    render(<SuperAdminStoresPage />);

    expect(await screen.findByText("Vem di Pod")).toBeInTheDocument();
    expect(screen.getByText("Sabor Express")).toBeInTheDocument();
    expect(screen.getByText("Total de Lojas")).toBeInTheDocument();
    expect(screen.getByText("Varejo: 1")).toBeInTheDocument();
    expect(screen.getByText("Delivery: 1")).toBeInTheDocument();

    // Filtro por status: Inativas
    fireEvent.click(screen.getByRole("button", { name: /Inativas \(1\)/i }));
    expect(screen.queryByText("Vem di Pod")).not.toBeInTheDocument();
    expect(screen.getByText("Sabor Express")).toBeInTheDocument();

    // Limpar filtros restaura ambas
    fireEvent.click(screen.getByRole("button", { name: /Limpar filtros/i }));
    expect(screen.getByText("Vem di Pod")).toBeInTheDocument();
    expect(screen.getByText("Sabor Express")).toBeInTheDocument();

    // Filtro por segmento: Varejo
    fireEvent.click(screen.getByRole("button", { name: /^Varejo$/i }));
    expect(screen.getByText("Vem di Pod")).toBeInTheDocument();
    expect(screen.queryByText("Sabor Express")).not.toBeInTheDocument();

    // Busca por e-mail sem resultado com filtro Varejo ativo
    const searchInput = screen.getByLabelText("Buscar lojas");
    fireEvent.change(searchInput, { target: { value: "saborexpress" } });
    expect(screen.getByText("Nenhuma loja encontrada")).toBeInTheDocument();

    // Limpar filtros e buscar por subdomínio
    fireEvent.click(screen.getAllByRole("button", { name: /Limpar filtros/i })[0]);
    fireEvent.change(searchInput, { target: { value: "saborexpress" } });
    expect(screen.getByText("Sabor Express")).toBeInTheDocument();
    expect(screen.queryByText("Vem di Pod")).not.toBeInTheDocument();
  });
});
