import { describe, expect, it } from "vitest";
import { formatPhone } from "./formatters";
import { matchesAbandonedCartSearch } from "./abandonedCartSearch";

const cart = {
  customerName: "Wesley Thieko",
  customerPhone: "67999992210",
  items: [{ name: "IGNITE v400 (Cópia)", quantity: 1, variation: null }],
};

describe("matchesAbandonedCartSearch", () => {
  it("sem busca mostra tudo", () => {
    expect(matchesAbandonedCartSearch(cart, "")).toBe(true);
    expect(matchesAbandonedCartSearch(cart, "   ")).toBe(true);
  });

  it("acha por nome e por produto, sem diferenciar maiúsculas", () => {
    expect(matchesAbandonedCartSearch(cart, "wesley")).toBe(true);
    expect(matchesAbandonedCartSearch(cart, "ignite")).toBe(true);
    expect(matchesAbandonedCartSearch(cart, "maria")).toBe(false);
  });

  it("acha pelo telefone, com ou sem máscara e por qualquer trecho", () => {
    expect(matchesAbandonedCartSearch(cart, "67999992210")).toBe(true);
    expect(matchesAbandonedCartSearch(cart, "(67) 99999-2210")).toBe(true);
    expect(matchesAbandonedCartSearch(cart, "2210")).toBe(true);
    expect(matchesAbandonedCartSearch(cart, "11988887777")).toBe(false);
  });

  it("letras na busca não viram dígitos e casam telefone por engano", () => {
    expect(matchesAbandonedCartSearch(cart, "abc")).toBe(false);
  });
});

describe("telefone na lista de carrinhos abandonados", () => {
  it("aparece completo e formatado, como (67) 99999-2210", () => {
    expect(formatPhone(cart.customerPhone)).toBe("(67) 99999-2210");
    expect(formatPhone("6733212210")).toBe("(67) 3321-2210");
  });

  it("nunca vem mascarado", () => {
    expect(formatPhone(cart.customerPhone)).not.toContain("*");
  });
});
