import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CashRegisterDetailsPage from "./CashRegisterDetailsPage";
import React from "react";
import { useQuery } from "@tanstack/react-query";

// Mock React Router
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(() => ({ id: "register-1" })),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

// Mock Cash Register Service
vi.mock("@/services/cash-register.service", () => ({
  cashRegisterService: {
    getSummary: vi.fn(),
  },
}));

describe("CashRegisterDetailsPage", () => {
  const mockData = {
    cashRegister: {
      id: "register-1",
      title: "Caixa Sexta-Feira",
      startDate: "2026-05-23T10:00:00Z",
      endDate: "2026-05-23T22:00:00Z",
    },
    summary: {
      totalGross: 500.0,
      totalCardFees: 15.5,
      totalNet: 484.5,
      orderCount: 3,
      totalsByMethod: {
        "Cartão de Crédito": 300.0,
        PIX: 200.0,
      },
    },
    orders: [
      {
        id: "order-1",
        orderNumber: 1001,
        customerName: "Alice Smith",
        paymentDate: "2026-05-23T12:00:00Z",
        paymentMethod: "Cartão de Crédito",
        totalReceived: 300.0,
        cardFee: 15.5,
        installments: 3,
      },
      {
        id: "order-2",
        orderNumber: 1002,
        customerName: "Bob Jones",
        paymentDate: "2026-05-23T15:30:00Z",
        paymentMethod: "PIX",
        totalReceived: 200.0,
        cardFee: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state when loading summary", () => {
    vi.mocked(useQuery).mockReturnValue({ data: null, isLoading: true } as any);

    render(<CashRegisterDetailsPage />);
    expect(screen.getByText("Carregando relatório...")).toBeInTheDocument();
  });

  it("should render not found state when no data exists", () => {
    vi.mocked(useQuery).mockReturnValue({ data: null, isLoading: false } as any);

    render(<CashRegisterDetailsPage />);
    expect(screen.getByText("Caixa não encontrado.")).toBeInTheDocument();
  });

  it("should render cash register summary information correctly", () => {
    vi.mocked(useQuery).mockReturnValue({ data: mockData as any, isLoading: false } as any);

    render(<CashRegisterDetailsPage />);

    expect(screen.getByText("Caixa Sexta-Feira")).toBeInTheDocument();
    expect(screen.getByText("Faturamento Bruto")).toBeInTheDocument();
    expect(screen.getByText("Taxas Retidas (Cartão)")).toBeInTheDocument();
    expect(screen.getByText("Saldo Líquido")).toBeInTheDocument();

    // Verify values format using regex and getAllByText to avoid multiple matches error
    expect(screen.getAllByText(/500,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/15,50/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/484,50/).length).toBeGreaterThan(0);

    // Verify orders details
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("#1001")).toBeInTheDocument();
  });
});
