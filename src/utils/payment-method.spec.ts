import { describe, it, expect } from "vitest";
import { formatPaymentMethod, groupTotalsByPaymentMethod, normalizePaymentMethodKey } from "./payment-method";

describe("formatPaymentMethod", () => {
  it.each([
    // o que o código realmente grava
    ["pix", "Pix"],
    ["PIX", "Pix"],
    ["credit", "Cartão de Crédito"],
    ["Credit", "Cartão de Crédito"],
    ["CREDIT", "Cartão de Crédito"],
    ["credito", "Cartão de Crédito"],
    ["Cartão de Crédito", "Cartão de Crédito"],
    ["cartao de credito", "Cartão de Crédito"],
    ["Cartão de Crédito Online", "Cartão de Crédito (Online)"],
    ["Cartão Online", "Cartão de Crédito (Online)"],
    ["online_credit", "Cartão de Crédito (Online)"],
    ["debit", "Cartão de Débito"],
    ["Debit", "Cartão de Débito"],
    ["debito", "Cartão de Débito"],
    ["Cartão de Débito", "Cartão de Débito"],
    ["cash", "Dinheiro"],
    ["Cash", "Dinheiro"],
    ["money", "Dinheiro"],
    ["dinheiro", "Dinheiro"],
    ["Dinheiro", "Dinheiro"],
    ["meal_voucher", "Vale refeição"],
    ["vale_refeicao", "Vale refeição"],
    ["Vale Refeição", "Vale refeição"],
    ["vale refeição", "Vale refeição"],
    ["food_voucher", "Vale alimentação"],
    ["vale_alimentacao", "Vale alimentação"],
    ["Vale Alimentação", "Vale alimentação"],
    // gateways e Pix na maquininha
    ["mercadopago", "Mercado Pago"],
    ["mercado_pago", "Mercado Pago"],
    ["infinitepay", "InfinitePay"],
    ["pix_terminal", "Pix na maquininha"],
    ["Pix na maquininha", "Pix na maquininha"],
    ["Outros", "Outros"],
  ])("%s -> %s", (input, expected) => {
    expect(formatPaymentMethod(input)).toBe(expected);
  });

  it("ignora espaços nas pontas", () => {
    expect(formatPaymentMethod("  credit ")).toBe("Cartão de Crédito");
  });

  it("vazio, nulo ou indefinido: texto padrão (ou o informado)", () => {
    expect(formatPaymentMethod(undefined)).toBe("Não informado");
    expect(formatPaymentMethod(null)).toBe("Não informado");
    expect(formatPaymentMethod("")).toBe("Não informado");
    expect(formatPaymentMethod("   ")).toBe("Não informado");
    expect(formatPaymentMethod("", "-")).toBe("-");
  });

  it("valor desconhecido: legível, nunca o código cru com sublinhado", () => {
    expect(formatPaymentMethod("gift_card")).toBe("Gift card");
    expect(formatPaymentMethod("boleto")).toBe("Boleto");
    expect(formatPaymentMethod("transferencia-bancaria")).toBe("Transferencia bancaria");
  });

  it("texto que já está legível passa como veio", () => {
    expect(formatPaymentMethod("Boleto Bancário")).toBe("Boleto Bancário");
    expect(formatPaymentMethod("Cheque pré-datado")).toBe("Cheque pré-datado");
  });

  it("nenhum valor conhecido sai em inglês", () => {
    for (const value of ["credit", "Credit", "debit", "Debit", "cash", "Cash", "money", "meal_voucher", "food_voucher", "online_credit"]) {
      expect(formatPaymentMethod(value)).not.toMatch(/credit|debit|cash|money|voucher|_/i);
    }
  });
});

describe("normalizePaymentMethodKey", () => {
  it("tira acento, caixa e separadores", () => {
    expect(normalizePaymentMethodKey("Cartão de Crédito Online")).toBe("cartao_de_credito_online");
    expect(normalizePaymentMethodKey(" Vale-Refeição ")).toBe("vale_refeicao");
  });
});

describe("groupTotalsByPaymentMethod", () => {
  it("junta formatos diferentes do mesmo método numa linha só", () => {
    const rows = groupTotalsByPaymentMethod({ credit: 100, Credit: 50, "Cartão de Crédito": 25, pix: 10, Outros: 5 });
    expect(rows).toEqual([
      { label: "Cartão de Crédito", total: 175 },
      { label: "Pix", total: 10 },
      { label: "Outros", total: 5 },
    ]);
  });

  it("aceita total em texto e ignora valor inválido", () => {
    const rows = groupTotalsByPaymentMethod({ cash: "12,5", Cash: "abc" });
    expect(rows).toEqual([{ label: "Dinheiro", total: 12.5 }]);
  });

  it("sem dados: lista vazia", () => {
    expect(groupTotalsByPaymentMethod(undefined)).toEqual([]);
    expect(groupTotalsByPaymentMethod({})).toEqual([]);
  });
});
