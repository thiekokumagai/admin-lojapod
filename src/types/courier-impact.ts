/** Resposta de cancelar/reativar pedido que estava numa rota de motoboy (taxa fixa por rota). */
export interface CourierImpact {
  kind: "CANCELLED" | "REACTIVATED";
  transactionId: string;
  courierId: string;
  courierName: string;
  orderNumber: number | null;
  /** Taxa da rota hoje. */
  amount: number;
  /** Pedidos não cancelados da rota antes de cancelar (CANCELLED) ou depois de reativar (REACTIVATED). */
  activeOrdersBefore: number;
  /** Parte do pedido cancelado na taxa (só CANCELLED). */
  shareAmount: number | null;
  /** Valor sugerido para a taxa (só CANCELLED). Na reativação nada é sugerido: o admin decide. */
  suggestedAmount: number | null;
}
