import type { AbandonedCartItem } from "@/services/abandoned-carts.service";

const MAX_ITEMS_IN_MESSAGE = 3;

/** Primeiro nome limpo (sem links nem símbolos): o nome vem do que o cliente digitou. */
export function firstNameOf(fullName: string): string {
  const first = (fullName || "").trim().split(/\s+/)[0] ?? "";
  const clean = first.replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, 30);
  return clean || "tudo bem";
}

/** Texto da conversa de WhatsApp para quem deixou itens no carrinho. */
export function buildAbandonedCartMessage(
  customerName: string,
  items: AbandonedCartItem[],
  storeName: string,
): string {
  const store = (storeName || "").trim() || "nossa loja";
  const greeting = `Oi ${firstNameOf(customerName)}! Aqui é da ${store}.`;

  const shown = items.slice(0, MAX_ITEMS_IN_MESSAGE).map((item) => {
    const variation = item.variation ? ` (${item.variation})` : "";
    const quantity = item.quantity > 1 ? ` x${item.quantity}` : "";
    return `${item.name}${variation}${quantity}`;
  });
  const extra = items.length - shown.length;

  if (shown.length === 0) {
    return `${greeting} Vi que você deixou um pedido no carrinho. Posso te ajudar a finalizar?`;
  }

  const list = shown.join(", ") + (extra > 0 ? ` e mais ${extra}` : "");
  return `${greeting} Vi que você deixou no carrinho: ${list}. Posso te ajudar a finalizar o pedido?`;
}
