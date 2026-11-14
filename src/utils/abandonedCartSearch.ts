import type { AbandonedCart } from "@/services/abandoned-carts.service";

/** Busca da lista de carrinhos abandonados: nome, telefone (com ou sem máscara) ou produto. */
export function matchesAbandonedCartSearch(
  cart: Pick<AbandonedCart, "customerName" | "customerPhone" | "items">,
  rawTerm: string,
): boolean {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return true;

  if (cart.customerName.toLowerCase().includes(term)) return true;
  if (cart.items.some((item) => item.name.toLowerCase().includes(term))) return true;

  const digits = term.replace(/\D/g, "");
  return digits.length > 0 && cart.customerPhone.replace(/\D/g, "").includes(digits);
}
