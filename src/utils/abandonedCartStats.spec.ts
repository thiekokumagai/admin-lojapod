import { describe, expect, it } from "vitest";
import { summarizeAbandonedCarts } from "./abandonedCartStats";

describe("summarizeAbandonedCarts", () => {
  const before = [
    { contactedAt: null, totalEstimated: 50 },
    { contactedAt: null, totalEstimated: 150 },
  ];

  it("conta os carrinhos da lista e os que ainda faltam chamar", () => {
    expect(summarizeAbandonedCarts(before)).toEqual({
      inList: 2,
      toCall: 2,
      totalEstimated: 200,
    });
  });

  it("depois de chamar um, 'Para chamar' cai para 1 e 'Na lista' continua 2", () => {
    const after = [
      { contactedAt: "2026-11-14T16:10:00.000Z", totalEstimated: 50 },
      before[1],
    ];

    expect(summarizeAbandonedCarts(after)).toEqual({
      inList: 2,
      toCall: 1,
      totalEstimated: 200,
    });
  });

  it("lista vazia zera tudo", () => {
    expect(summarizeAbandonedCarts([])).toEqual({
      inList: 0,
      toCall: 0,
      totalEstimated: 0,
    });
  });
});
