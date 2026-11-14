import { describe, expect, it } from "vitest";
import { buildAbandonedCartMessage, firstNameOf } from "./abandonedCartMessage";

describe("firstNameOf", () => {
  it("usa só o primeiro nome", () => {
    expect(firstNameOf("João da Silva")).toBe("João");
    expect(firstNameOf("  maria   souza ")).toBe("maria");
  });

  it("limpa links e símbolos digitados no nome", () => {
    expect(firstNameOf("http://golpe.com/x Fulano")).toBe("httpgolpecomx");
    expect(firstNameOf("🔥🔥 Ana")).toBe("tudo bem");
    expect(firstNameOf("")).toBe("tudo bem");
  });

  it("limita o tamanho", () => {
    expect(firstNameOf("A".repeat(100)).length).toBe(30);
  });
});

describe("buildAbandonedCartMessage", () => {
  it("cita os itens, a variação e a quantidade", () => {
    const message = buildAbandonedCartMessage(
      "João da Silva",
      [
        { name: "Pod X", quantity: 2, variation: "Menta" },
        { name: "Líquido Y", quantity: 1, variation: null },
      ],
      "Loja Pod",
    );

    expect(message).toBe(
      "Oi João! Aqui é da Loja Pod. Vi que você deixou no carrinho: Pod X (Menta) x2, Líquido Y. Posso te ajudar a finalizar o pedido?",
    );
  });

  it("mostra até 3 itens e resume o resto", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ name: `Item ${i + 1}`, quantity: 1, variation: null }));

    const message = buildAbandonedCartMessage("Ana Paula", items, "Loja Pod");

    expect(message).toContain("Item 1, Item 2, Item 3 e mais 2");
    expect(message).not.toContain("Item 4");
  });

  it("sem itens legíveis usa um texto genérico e sem nome da loja usa um padrão", () => {
    const message = buildAbandonedCartMessage("Ana Paula", [], "");

    expect(message).toBe("Oi Ana! Aqui é da nossa loja. Vi que você deixou um pedido no carrinho. Posso te ajudar a finalizar?");
  });

  it("não carrega telefone nem valores", () => {
    const message = buildAbandonedCartMessage("Ana Paula", [{ name: "Pod", quantity: 1, variation: null }], "Loja");

    expect(message).not.toMatch(/\d{8}/);
    expect(message).not.toContain("R$");
  });
});
