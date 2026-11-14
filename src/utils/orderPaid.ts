type PaidFields = {
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentType?: string | null;
};

/**
 * Pedido que já chega pago à entrega (nada a cobrar do cliente).
 * Mesma regra da API (`isOrderPaid`): `paymentStatus` PAID ou Pix online.
 * Pix com `paymentType` 'entrega' (Pix na maquininha) ainda precisa ser cobrado.
 */
export function isOrderPaid(order: PaidFields): boolean {
  if (order.paymentStatus === "PAID") return true;

  const isPix = (order.paymentMethod || "").toLowerCase().includes("pix");
  const isOnline = (order.paymentType || "").trim().toLowerCase() === "online";

  return isPix && isOnline;
}
