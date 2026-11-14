import { Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useSettings";
import type { Order } from "@/types/order";
import { isOrderPaid } from "@/utils/orderPaid";

interface UberOrderBadgeProps {
  order: Pick<
    Order,
    "status" | "deliveryModality" | "paymentStatus" | "paymentMethod" | "paymentType" | "uberDeliveryId" | "uberDeliveryStatus"
  >;
  className?: string;
}

/**
 * Selo de identificação da Uber Direct no pedido:
 * - "Uber chamada": já existe corrida criada para o pedido;
 * - "Vai chamar Uber": pedido Separado, de entrega, elegível ao disparo automático e ainda sem corrida.
 */
export function UberOrderBadge({ order, className = "" }: UberOrderBadgeProps) {
  const { data: settings } = useSettings();

  // Pedido entregue (concluído): não exibe nada da Uber
  if (order.status === "COMPLETED") return null;

  if (order.uberDeliveryId) {
    return (
      <Badge
        className={`bg-slate-900 text-white hover:bg-slate-900 border-0 font-bold px-1.5 py-0.5 text-[10px] flex items-center gap-1 shrink-0 ${className}`}
        title="Corrida da Uber Direct já criada"
      >
        <Car className="h-3 w-3" />
        <span>Uber chamada</span>
      </Badge>
    );
  }

  // Mesma regra da API: Pix na maquininha (entrega, pendente) não chama a Uber sozinho
  const isPaidOrPix = isOrderPaid(order);
  const willAutoCall =
    !!settings?.uberDirectEnabled &&
    !!settings?.uberDirectAutoDispatch &&
    order.status === "CONFIRMED" &&
    order.deliveryModality !== "STORE_PICKUP" &&
    isPaidOrPix;

  if (!willAutoCall) return null;

  return (
    <Badge
      className={`bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 font-bold px-1.5 py-0.5 text-[10px] flex items-center gap-1 shrink-0 ${className}`}
      title="Este pedido será enviado automaticamente para a Uber Direct"
    >
      <Car className="h-3 w-3" />
      <span>Vai chamar Uber</span>
    </Badge>
  );
}
