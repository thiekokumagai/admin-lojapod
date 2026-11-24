/**
 * Venda por peso no PDV. Mesma conta do servidor (api-lojapod `weighted-item.ts`):
 * peso arredondado a 3 casas e preço = round2(peso × preço/kg). Se a conta divergir, a API recusa o pedido.
 */

export const MIN_WEIGHT_KG = 0.001;
export const MAX_WEIGHT_KG = 100;

export type WeightSource = "SCALE" | "MANUAL";
export type WeightUnit = "g" | "kg";

export const round2 = (value: number): number => Math.round(value * 100) / 100;
export const round3 = (value: number): number => Math.round(value * 1000) / 1000;

/** Converte o texto digitado ("650", "0,650", "1.2") em kg. Devolve null se não for um número positivo. */
export function parseWeightInput(text: string, unit: WeightUnit): number | null {
  const clean = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value <= 0) return null;
  return round3(unit === "g" ? value / 1000 : value);
}

/** Peso líquido: bruto menos a tara (g). Nunca negativo. */
export function netWeightKg(grossKg: number, tareGrams: number): number {
  const net = round3(grossKg - Math.max(0, tareGrams) / 1000);
  return net > 0 ? net : 0;
}

export function isValidWeight(kg: number): boolean {
  return Number.isFinite(kg) && kg >= MIN_WEIGHT_KG && kg <= MAX_WEIGHT_KG;
}

/**
 * Preço por kg que vale para a forma de pagamento (promoção só quando a loja permite) e o valor da pesagem.
 */
export function weighedPrice(params: {
  weightKg: number;
  pricePerKg: number;
  promoPricePerKg?: number | null;
  promoAllowed: boolean;
}): { unitPricePerKg: number; price: number } {
  const regular = params.pricePerKg;
  const promo = params.promoPricePerKg ?? 0;
  const unitPricePerKg = params.promoAllowed && promo > 0 && promo < regular ? promo : regular;
  return { unitPricePerKg, price: round2(round3(params.weightKg) * unitPricePerKg) };
}

export function formatKg(kg: number): string {
  return `${kg.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "0,645 kg × R$ 69,90/kg" — linha usada no carrinho, nos detalhes e no cupom. */
export function formatWeighedLine(weightKg: number, unitPricePerKg: number): string {
  return `${formatKg(weightKg)} × ${brl.format(unitPricePerKg)}/kg`;
}

/**
 * Linha do carrinho do Novo Pedido para uma pesagem copiada de outro pedido ("Duplicar"):
 * mesmo peso, preço/kg atual do cadastro (o servidor confere com o cadastro).
 */
export function duplicateWeighedLine(
  item: {
    productId: string;
    productItemId?: string | null;
    productName: string;
    imageUrl?: string;
    weightKg: number;
    weightSource?: WeightSource | null;
  },
  product: { price?: number; promotionalPrice?: number },
) {
  const pricePerKg = product.price ?? 0;
  const priced = weighedPrice({
    weightKg: item.weightKg,
    pricePerKg,
    promoPricePerKg: product.promotionalPrice,
    promoAllowed: false,
  });
  return {
    productId: item.productId,
    productItemId: item.productItemId || undefined,
    title: item.productName,
    price: priced.price,
    quantity: 1,
    imageUrl: item.imageUrl,
    weighingId: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    weightKg: round3(item.weightKg),
    weightSource: item.weightSource ?? "MANUAL",
    pricePerKg,
    promoPricePerKg: product.promotionalPrice,
    unitPricePerKg: priced.unitPricePerKg,
  };
}
