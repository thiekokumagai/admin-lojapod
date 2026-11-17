type PaidFields = {
  paymentStatus?: string | null;
  // Mantidos só para quem passa o pedido inteiro: a regra não depende mais da forma de pagamento.
  paymentMethod?: string | null;
  paymentType?: string | null;
};

/**
 * Pedido que já chega pago à entrega (nada a cobrar do cliente).
 * Mesma regra da API (`isOrderPaid`): vale só `paymentStatus` PAID, em qualquer forma de pagamento.
 * Pix online pendente (QR Code ainda não pago) precisa ser cobrado/aguardado, como a Pix na maquininha.
 */
export function isOrderPaid(order: PaidFields): boolean {
  return order.paymentStatus === "PAID";
}
