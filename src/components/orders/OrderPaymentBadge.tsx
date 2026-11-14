/**
 * Selo de pagamento do pedido: "Pago" (paymentStatus PAID, já baixado) ou "Não pago".
 * Independe do status de entrega: um pedido pode estar CONCLUÍDO (entregue) e não pago.
 * Pedido cancelado e não pago não mostra selo (não há o que cobrar).
 */
export function OrderPaymentBadge({ paymentStatus, status }: { paymentStatus?: string | null; status?: string | null }) {
  const paid = paymentStatus === "PAID";
  if (!paid && status === "CANCELLED") return null;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
        paid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {paid ? "PAGO" : "NÃO PAGO"}
    </span>
  );
}
