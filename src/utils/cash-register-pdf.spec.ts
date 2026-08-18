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

let capturedAutoTableCalls: any[] = [];
vi.mock("jspdf-autotable", () => {
  return {
    default: vi.fn((doc: any, options: any) => {
      capturedAutoTableCalls.push(options);
      doc.lastAutoTable = { finalY: 50 };
    }),
  };
});

describe("cash-register-pdf utility", () => {
  it("calculates numeric sums correctly even when API returns string amounts", () => {
    capturedAutoTableCalls = [];

    const sampleData: CashRegisterPDFData = {
      cashRegister: {
        id: "caixa-123",
        title: "Caixa Agostinho",
        startDate: "2026-08-01T00:00:00.000Z",
        endDate: "2026-08-31T00:00:00.000Z",
      },
      summary: {
        totalGross: "1500.00",
        totalEntries: "100.00",
        totalOutflows: "3650.00",
        totalCardFees: "30.00",
        totalNet: "1370.00",
      },
      orders: [],
      transactions: [
        {
          id: "tx-1",
          description: "Juma",
          type: "OUTFLOW",
          category: "MOTOBOY",
          amount: "200.00" as any,
          date: "2026-08-12T08:30:00.000Z",
        },
        {
          id: "tx-2",
          description: "Salário murilo",
          type: "OUTFLOW",
          category: "PARTNERS",
          amount: "3300.00" as any,
          date: "2026-08-11T18:13:00.000Z",
        },
        {
          id: "tx-3",
          description: "Juma",
          type: "OUTFLOW",
          category: "MOTOBOY",
          amount: "150.00" as any,
          date: "2026-08-11T09:17:00.000Z",
        },
      ],
    };

    expect(() => generateCashRegisterPDF(sampleData)).not.toThrow();

    // Check transactions table call (the last autoTable call)
    const txCall = capturedAutoTableCalls[capturedAutoTableCalls.length - 1];
    expect(txCall.foot).toBeDefined();
    const footRow = txCall.foot[0];
    const saidasContent = footRow[2].content;
    expect(saidasContent).toContain("3.650,00");
  });
});
