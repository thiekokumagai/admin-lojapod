import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductSearch } from "./ProductSearch";

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({
    isLoading: false,
    data: {
      products: [
        { id: "p-kg", title: "Self-service", price: 69.9, status: "active", totalStock: 0, isSoldByWeight: true, images: [] },
        { id: "p-zero", title: "Refri esgotado", price: 6, status: "active", totalStock: 0, images: [] },
        { id: "p-un", title: "Refri lata", price: 6, status: "active", totalStock: 5, images: [] },
      ],
    },
  }),
}));
vi.mock("@/services/combo.service", () => ({ comboService: { list: vi.fn().mockResolvedValue([]) } }));

describe("ProductSearch — produto por peso", () => {
  it("mostra o produto por kg mesmo com estoque zero; o de unidade esgotado continua escondido", async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(<ProductSearch onSelectProduct={onSelect} />);
    fireEvent.change(screen.getByPlaceholderText(/Buscar produto/), { target: { value: "re" } });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    vi.useRealTimers();

    expect(screen.getByText("Self-service")).toBeInTheDocument();
    expect(screen.getByText("Por kg")).toBeInTheDocument();
    expect(screen.getByText("Refri lata")).toBeInTheDocument();
    expect(screen.queryByText("Refri esgotado")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Self-service"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "p-kg", isSoldByWeight: true }));
  });
});
