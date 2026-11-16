import { describe, expect, it } from "vitest";
import { CANNOT_CANCEL_COMPLETED_ORDER_MESSAGE, isOrderCancelBlocked } from "./order-cancel";

describe("isOrderCancelBlocked", () => {
  it("bloqueia o cancelamento de pedido entregue", () => {
    expect(isOrderCancelBlocked("COMPLETED")).toBe(true);
  });

  it.each(["PENDING", "CONFIRMED", "DISPATCHED", "CANCELLED", undefined, null])(
    "não bloqueia o status %s",
    (status) => {
      expect(isOrderCancelBlocked(status)).toBe(false);
    },
  );

  it("usa uma mensagem em português", () => {
    expect(CANNOT_CANCEL_COMPLETED_ORDER_MESSAGE).toBe(
      "Este pedido já foi entregue e não pode ser cancelado.",
    );
  });
});
