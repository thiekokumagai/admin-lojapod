import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import CourierDetailsPage from "./CourierDetailsPage";
import { couriersService } from "@/services/couriers.service";

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "courier-1" }),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("@/services/couriers.service", () => ({
  couriersService: {
    getCourier: vi.fn(),
    deleteTransaction: vi.fn(),
    updateCourier: vi.fn(),
  },
}));

describe("CourierDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(couriersService.getCourier).mockResolvedValue({
      id: "courier-1",
      name: "Gui",
      phone: "66999301566",
      isActive: true,
      balance: 40,
      transactions: [
        { id: "fee-1", courierId: "courier-1", type: "FEE", amount: "10", description: "Corrida 1", date: new Date().toISOString() },
        { id: "fee-2", courierId: "courier-1", type: "FEE", amount: "30", description: "Corrida 2", date: new Date().toISOString() },
        { id: "payment-1", courierId: "courier-1", type: "PAYMENT", amount: "10", description: "Pagamento", date: new Date().toISOString() },
        { id: "fee-3", courierId: "courier-1", type: "FEE", amount: "10", description: "Corrida 3", date: new Date().toISOString() },
      ],
    });
  });

  it("sums decimal-string transaction amounts instead of concatenating them", async () => {
    render(<CourierDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
    });

    expect(screen.getAllByText("R$ 10,00").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
