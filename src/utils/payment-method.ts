/**
 * Tradução da FORMA de pagamento para exibição. Só apresentação: o valor gravado no banco e o
 * contrato da API não mudam.
 *
 * O campo `paymentMethod` do pedido é texto livre e chega em formatos diferentes conforme quem
 * gravou (catálogo: `credit`, `pix`; painel: `Cartão de Crédito`, `PIX`; importação: `Cash`,
 * `credito`; vale: `meal_voucher`, `vale_refeicao`). O mapa abaixo aceita todos eles, sem diferenciar
 * caixa, acento, espaço, hífen e sublinhado.
 */

type CanonicalMethod =
  | "pix"
  | "pix_terminal"
  | "credit"
  | "credit_online"
  | "debit"
  | "cash"
  | "meal_voucher"
  | "food_voucher"
  | "mercadopago"
  | "infinitepay"
  | "asaas"
  | "other";

export const PAYMENT_METHOD_LABELS: Record<CanonicalMethod, string> = {
  pix: "Pix",
  pix_terminal: "Pix na maquininha",
  credit: "Cartão de Crédito",
  credit_online: "Cartão de Crédito (Online)",
  debit: "Cartão de Débito",
  cash: "Dinheiro",
  meal_voucher: "Vale refeição",
  food_voucher: "Vale alimentação",
  mercadopago: "Mercado Pago",
  infinitepay: "InfinitePay",
  asaas: "Asaas",
  other: "Outros",
};

// Chaves já normalizadas (minúsculas, sem acento, separadas por "_").
const ALIASES: Record<string, CanonicalMethod> = {
  pix: "pix",
  pix_automatico: "pix",
  pix_maquininha: "pix_terminal",
  pix_na_maquininha: "pix_terminal",
  pix_terminal: "pix_terminal",

  credit: "credit",
  credito: "credit",
  credit_card: "credit",
  creditcard: "credit",
  cartao_de_credito: "credit",
  cartao_credito: "credit",
  credit_online: "credit_online",
  online_credit: "credit_online",
  cartao_online: "credit_online",
  cartao_de_credito_online: "credit_online",

  debit: "debit",
  debito: "debit",
  debit_card: "debit",
  debitcard: "debit",
  cartao_de_debito: "debit",
  cartao_debito: "debit",

  cash: "cash",
  money: "cash",
  dinheiro: "cash",
  especie: "cash",

  meal_voucher: "meal_voucher",
  vale_refeicao: "meal_voucher",
  voucher_refeicao: "meal_voucher",
  food_voucher: "food_voucher",
  vale_alimentacao: "food_voucher",
  voucher_alimentacao: "food_voucher",

  mercadopago: "mercadopago",
  mercado_pago: "mercadopago",
  infinitepay: "infinitepay",
  infinite_pay: "infinitepay",
  asaas: "asaas",

  other: "other",
  others: "other",
  outro: "other",
  outros: "other",
};

/** `"Cartão de Crédito Online"` -> `"cartao_de_credito_online"`. */
export function normalizePaymentMethodKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-/]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Texto legível para um código desconhecido (`gift_card` -> `Gift card`). Texto já legível passa direto. */
function humanize(raw: string): string {
  const text = raw.trim();
  // Já parece texto de gente (tem espaço, acento ou maiúscula no meio): não mexe.
  if (/\s/.test(text) || /[^ -~]/.test(text) || /[a-z][A-Z]/.test(text)) return text;
  const spaced = text.replace(/[_-]+/g, " ").trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Nome em português da forma de pagamento. Valor vazio -> `fallback` (padrão "Não informado");
 * valor desconhecido -> versão legível do próprio valor (nunca o código cru com sublinhado).
 */
export function formatPaymentMethod(value?: string | null, fallback = "Não informado"): string {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const raw = String(value);
  const canonical = ALIASES[normalizePaymentMethodKey(raw)];
  return canonical ? PAYMENT_METHOD_LABELS[canonical] : humanize(raw);
}

/**
 * Soma os totais por NOME em português: `credit`, `Credit` e `Cartão de Crédito` viram uma linha só
 * (antes apareciam como linhas separadas, todas com o mesmo nome).
 */
export function groupTotalsByPaymentMethod<T extends number | string>(
  totals: Record<string, T> | undefined | null,
  fallback = "Outros",
): Array<{ label: string; total: number }> {
  const byLabel = new Map<string, number>();
  for (const [method, total] of Object.entries(totals ?? {})) {
    const label = formatPaymentMethod(method, fallback);
    const value = typeof total === "number" ? total : Number(String(total).replace(",", "."));
    byLabel.set(label, (byLabel.get(label) ?? 0) + (Number.isFinite(value) ? value : 0));
  }
  return [...byLabel.entries()].map(([label, total]) => ({ label, total }));
}
