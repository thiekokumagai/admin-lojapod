/** Onde a oferta "Peça também" aparece para o cliente. Os valores são os do banco (`displayLocation`). */
export type OrderBumpDisplayLocation = "CART" | "PRODUCT" | "BOTH";

export const ORDER_BUMP_LOCATION_OPTIONS: Array<{
  value: OrderBumpDisplayLocation;
  label: string;
  hint: string;
}> = [
  {
    value: "CART",
    label: "Só no carrinho",
    hint: "Aparece na sacola, abaixo dos itens (como sempre foi).",
  },
  {
    value: "PRODUCT",
    label: "Só na tela do produto",
    hint: "Aparece dentro da tela do produto, como um grupo opcional, quando o gatilho combina com o produto aberto.",
  },
  {
    value: "BOTH",
    label: "Carrinho e tela do produto",
    hint: "Aparece nos dois lugares.",
  },
];

/** Registros antigos ou resposta sem o campo valem "carrinho", que era o único lugar. */
export function normalizeOrderBumpLocation(value?: string | null): OrderBumpDisplayLocation {
  return value === "PRODUCT" || value === "BOTH" ? value : "CART";
}

/** Texto curto para a listagem ("Carrinho", "Tela do produto", "Carrinho + tela do produto"). */
export function orderBumpLocationLabel(value?: string | null): string {
  switch (normalizeOrderBumpLocation(value)) {
    case "PRODUCT":
      return "Tela do produto";
    case "BOTH":
      return "Carrinho + tela do produto";
    default:
      return "Carrinho";
  }
}
