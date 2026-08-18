import { describe, it, expect, vi } from "vitest";
import { generateCashRegisterPDF, CashRegisterPDFData } from "./cash-register-pdf";

// Mock jsPDF and jspdf-autotable to prevent canvas errors in jsdom test env
vi.mock("jspdf", () => {
  const mockDoc = {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    getNumberOfPages: () => 1,
    setPage: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    line: vi.fn(),
    save: vi.fn(),
  };

  return {
    default: vi.fn(() => mockDoc),
  };
});

vi.mock("jspdf-autotable", () => {
  return {
    default: vi.fn((doc: any) => {
      doc.lastAutoTable = { finalY: 50 };
    }),
  };
});

describe("cash-register-pdf utility", () => {
  it("generates a cash register PDF report without errors", () => {
    const sampleData: CashRegisterPDFData = {
      cashRegister: {
        id: "caixa-123",
        title: "Caixa Segunda-Feira",
        startDate: "2026-08-01T00:00:00.000Z",
        endDate: "2026-08-31T00:00:00.000Z",
      },
      summary: {
        totalGross: 1500,
        totalEntries: 100,
        totalOutflows: 200,
        totalCardFees: 30,
        totalNet: 1370,
        totalsByMethod: {
          pix: 1000,
          credito: 500,
        },
      },
      orders: [
        {
          id: "order-1",
          orderNumber: 101,
          customerName: "João Silva",
          paymentDate: "2026-08-15T14:30:00.000Z",
          paymentMethod: "pix",
          totalReceived: 1000,
          cardFee: 0,
        },
        {
          id: "order-2",
          orderNumber: 102,
          customerName: "Maria Oliveira",
          paymentDate: "2026-08-15T16:00:00.000Z",
          paymentMethod: "credito",
          installments: 2,
          totalReceived: 500,
          cardFee: 30,
        },
      ],
      transactions: [
        {
          id: "tx-1",
          description: "Pagamento Motoboy",
          type: "OUTFLOW",
          category: "MOTOBOY",
          amount: 50,
          date: "2026-08-15T18:00:00.000Z",
        },
      ],
    };

    expect(() => generateCashRegisterPDF(sampleData)).not.toThrow();
  });
});
