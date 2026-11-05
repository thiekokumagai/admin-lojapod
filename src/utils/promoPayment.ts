// Converte o rótulo da forma de pagamento (UI) para a chave usada no backend.
export function paymentLabelToKey(label: string): string {
  switch (label) {
    case "PIX":
      return "pix";
    case "Cartão de Crédito":
    case "Cartão de Crédito Online":
      return "credit";
    case "Cartão de Débito":
      return "debit";
    case "Dinheiro":
      return "cash";
    case "Vale refeição":
    case "Vale Refeição":
      return "meal_voucher";
    case "Vale alimentação":
    case "Vale Alimentação":
      return "food_voucher";
    default:
      return label.toLowerCase();
  }
}

// Retorna true se o preço promocional deve ser mantido para a forma de pagamento escolhida.
// Sem forma de pagamento selecionada, mantém o preço promocional.
export function isPromoAllowed(paymentLabel: string, allowed?: string[] | null): boolean {
  if (!paymentLabel) return true;
  const list = Array.isArray(allowed) ? allowed : ["pix"];
  return list.includes(paymentLabelToKey(paymentLabel));
}
