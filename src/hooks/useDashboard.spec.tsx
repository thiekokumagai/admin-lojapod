import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { STOCK_AUTO_REFRESH_MS, useDashboardOpportunities } from "./useDashboard";

const getDashboardOpportunities = vi.hoisted(() => vi.fn());
vi.mock("@/services/dashboard.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/dashboard.service")>("@/services/dashboard.service");
  return { ...actual, getDashboardOpportunities };
});

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe("useDashboardOpportunities (aba Estoque se atualiza sozinha)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getDashboardOpportunities.mockReset();
    getDashboardOpportunities.mockResolvedValue({ kpis: {}, criticalProducts: [], stagnantProducts: [], opportunities: [] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("refaz a consulta a cada minuto enquanto a aba está aberta", async () => {
    expect(STOCK_AUTO_REFRESH_MS).toBe(60_000);
    renderHook(() => useDashboardOpportunities(true), { wrapper });
    await waitFor(() => expect(getDashboardOpportunities).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STOCK_AUTO_REFRESH_MS + 100);
    });
    await waitFor(() => expect(getDashboardOpportunities).toHaveBeenCalledTimes(2));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STOCK_AUTO_REFRESH_MS);
    });
    await waitFor(() => expect(getDashboardOpportunities).toHaveBeenCalledTimes(3));
  });

  it("com a aba fechada não consulta nem em intervalo", async () => {
    renderHook(() => useDashboardOpportunities(false), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(STOCK_AUTO_REFRESH_MS * 3);
    });
    expect(getDashboardOpportunities).not.toHaveBeenCalled();
  });
});
