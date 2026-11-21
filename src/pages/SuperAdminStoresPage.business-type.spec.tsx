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

describe("SuperAdminStoresPage — Segmento da loja (businessType)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStores.mockResolvedValue([
      {
        id: "store-1",
        title: "Restaurante Centro",
        subdomain: "restaurante",
        adminEmail: "dono@restaurante.com",
        businessType: "FOOD",
        isActive: true,
        createdAt: "2026-11-20T00:00:00.000Z",
        _count: { products: 10, orders: 2, customers: 5 },
      },
    ]);
  });

  it("exibe badge do segmento na lista, abre confirmação no 409 e reenvia com forceDisableCustomizations: true", async () => {
    const conflictErr = Object.assign(new Error("Conflito"), {
      status: 409,
      data: {
        code: "CUSTOMIZABLE_PRODUCTS_EXIST",
        customizableProductsCount: 3,
      },
    });
    mockUpdateStore
      .mockRejectedValueOnce(conflictErr)
      .mockResolvedValueOnce({ id: "store-1", businessType: "POD" });

    render(<SuperAdminStoresPage />);

    expect(await screen.findByText("Restaurante")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Editar Loja"));

    const select = screen.getByLabelText(/Segmento da loja/i);
    expect(select).toHaveValue("FOOD");

    fireEvent.change(select, { target: { value: "POD" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    expect(
      await screen.findByText(/Existem 3 produto\(s\) personalizável\(is\)/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Desmarcar e trocar para Vape/i }),
    );

    await waitFor(() => {
      expect(mockUpdateStore).toHaveBeenCalledTimes(2);
    });
    expect(mockUpdateStore.mock.calls[1]).toEqual([
      "store-1",
      expect.objectContaining({
        businessType: "POD",
        forceDisableCustomizations: true,
      }),
    ]);
  });
});
