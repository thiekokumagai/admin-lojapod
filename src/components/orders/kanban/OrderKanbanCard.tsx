import React, { useState } from "react";
import { Order, OrderStatus } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Store, 
  MapPin, 
  Clock, 
  MoreHorizontal, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Gift,
  Check,
  DollarSign
} from "lucide-react";
import { formatOrderTime } from "@/utils/date-timezone";

interface OrderKanbanCardProps {
  order: Order;
  timeZone: string;
  onSelectOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: import("@/types/order").PaymentStatus) => void;
  isUpdating?: boolean;
}

const paymentLabels: Record<string, string> = {
  PIX: "Pix",
  pix: "Pix",
  "Cartão de Crédito": "Cartão de Crédito",
  "Cartão de Crédito Online": "Cartão de Crédito (Online)",
  "Cartão Online": "Cartão de Crédito (Online)",
  online_credit: "Cartão de Crédito (Online)",
  credit: "Cartão de Crédito",
  credito: "Cartão de Crédito",
  Credit: "Cartão de Crédito",
  CREDIT: "Cartão de Crédito",
  "Cartão de Débito": "Cartão de Débito",
  debit: "Cartão de Débito",
  debito: "Cartão de Débito",
  Debit: "Cartão de Débito",
  DEBIT: "Cartão de Débito",
  Dinheiro: "Dinheiro",
  cash: "Dinheiro",
  dinheiro: "Dinheiro",
  Cash: "Dinheiro",
  CASH: "Dinheiro",
  "Vale refeição": "Vale refeição",
  "Vale Refeição": "Vale refeição",
  meal_voucher: "Vale refeição",
  vale_refeicao: "Vale refeição",
  "Vale alimentação": "Vale alimentação",
  "Vale Alimentação": "Vale alimentação",
  food_voucher: "Vale alimentação",
  vale_alimentacao: "Vale alimentação",
};

export const OrderKanbanCard: React.FC<OrderKanbanCardProps> = ({
  order,
  timeZone,
  onSelectOrder,
  onUpdateStatus,
  onUpdatePaymentStatus,
  isUpdating = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const formattedTime = formatOrderTime(order.createdAt, timeZone);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(order.totalOrder);

  // Address summary
  const getDeliverySummary = () => {
    if (order.deliveryModality === "STORE_PICKUP") {
      return null;
    }
    if (order.neighborhood) {
      return order.neighborhood;
    }
    if (order.street) {
      return `${order.street}${order.number ? `, ${order.number}` : ""}`;
    }
    return "Entrega";
  };

  const deliverySummary = getDeliverySummary();

  const handleTogglePayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdatePaymentStatus || isUpdating) return;
    const nextStatus = order.paymentStatus === "PAID" ? "PENDING" : "PAID";
    onUpdatePaymentStatus(order.id, nextStatus);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isUpdating) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.setData("application/json", JSON.stringify({
      orderId: order.id,
      currentStatus: order.status,
    }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Next status action configuration
  const getQuickAction = () => {
    switch (order.status) {
      case "PENDING":
        return {
          label: "Separar",
          targetStatus: "CONFIRMED" as OrderStatus,
          icon: <PackageCheck className="h-4 w-4 mr-1.5 shrink-0" />,
          className: "bg-blue-600 hover:bg-blue-700 text-white font-bold active:bg-blue-800 shadow-sm",
        };
      case "CONFIRMED":
        return {
          label: "Enviar",
          targetStatus: "DISPATCHED" as OrderStatus,
          icon: <Truck className="h-4 w-4 mr-1.5 shrink-0" />,
          className: "bg-purple-600 hover:bg-purple-700 text-white font-bold active:bg-purple-800 shadow-sm",
        };
      case "DISPATCHED":
        return {
          label: "Entregar",
          targetStatus: "COMPLETED" as OrderStatus,
          icon: <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />,
          className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold active:bg-emerald-800 shadow-sm",
        };
      case "COMPLETED":
      default:
        return null;
    }
  };

  const quickAction = getQuickAction();

  return (
    <div
      draggable={!isUpdating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onSelectOrder(order.id)}
      className={`group relative bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all select-none cursor-pointer max-h-[85vh] overflow-y-auto ${
        isDragging ? "opacity-40 scale-95 border-violet-400" : ""
      } ${isUpdating ? "pointer-events-none" : ""}`}
    >
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-20">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </div>
      )}

      {/* Header: Order Number, Time, and Context Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-extrabold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            #{order.orderNumber}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opções do pedido</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
              <DropdownMenuItem
                onClick={() => onSelectOrder(order.id)}
                className="font-medium text-xs cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2 text-slate-500" />
                Ver Detalhes
              </DropdownMenuItem>
              {onUpdatePaymentStatus && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      onUpdatePaymentStatus(
                        order.id,
                        order.paymentStatus === "PAID" ? "PENDING" : "PAID"
                      )
                    }
                    className={`font-medium text-xs cursor-pointer ${
                      order.paymentStatus === "PAID"
                        ? "text-amber-700 focus:bg-amber-50"
                        : "text-emerald-700 focus:bg-emerald-50"
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5 mr-2" />
                    {order.paymentStatus === "PAID" ? "Marcar como Não Pago" : "Marcar como Pago"}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mover Para
              </div>
              {order.status !== "PENDING" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(order.id, "PENDING")}
                  className="font-medium text-xs text-amber-700 focus:bg-amber-50 cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5 mr-2" />
                  Pendente
                </DropdownMenuItem>
              )}
              {order.status !== "CONFIRMED" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(order.id, "CONFIRMED")}
                  className="font-medium text-xs text-blue-700 focus:bg-blue-50 cursor-pointer"
                >
                  <PackageCheck className="h-3.5 w-3.5 mr-2" />
                  Separado
                </DropdownMenuItem>
              )}
              {order.status !== "DISPATCHED" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(order.id, "DISPATCHED")}
                  className="font-medium text-xs text-purple-700 focus:bg-purple-50 cursor-pointer"
                >
                  <Truck className="h-3.5 w-3.5 mr-2" />
                  Enviado
                </DropdownMenuItem>
              )}
              {order.status !== "COMPLETED" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(order.id, "COMPLETED")}
                  className="font-medium text-xs text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                  Entregue
                </DropdownMenuItem>
              )}
              {order.status !== "CANCELLED" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={order.paymentStatus === "PAID"}
                    onClick={() => onUpdateStatus(order.id, "CANCELLED")}
                    className="font-medium text-xs text-rose-600 focus:bg-rose-50 cursor-pointer disabled:opacity-40"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-2" />
                    Cancelar Pedido
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Customer Name */}
      <div className="mb-2.5">
        <h4 className="font-bold text-slate-800 text-sm truncate leading-snug" title={order.customerName}>
          {order.customerName}
        </h4>
      </div>

      {/* Delivery Modality Badge / Snippet */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {order.deliveryModality === "STORE_PICKUP" ? (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 font-bold px-2 py-0.5 text-[11px] flex items-center gap-1">
            <Store className="h-3 w-3" />
            <span>Retirada no Local</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200/80 font-medium px-2 py-0.5 text-[11px] flex items-center gap-1 max-w-full">
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{deliverySummary}</span>
          </Badge>
        )}

        {/* Loyalty Badge */}
        {order.loyaltyRedemption && (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 font-semibold px-1.5 py-0.5 text-[10px] flex items-center gap-1 shrink-0" title={`Fidelidade: ${order.loyaltyRedemption.rewardTitle}`}>
            <Gift className="h-3 w-3 text-emerald-600" />
            <span className="max-w-[100px] truncate">{order.loyaltyRedemption.rewardTitle}</span>
          </Badge>
        )}

        {/* OBS Badge */}
        {order.observation && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-1.5 py-0.5 text-[10px] font-bold" title={order.observation}>
            OBS
          </Badge>
        )}
      </div>

      {/* Payment Information & 1-Click Pay/Unpay Toggle */}
      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 mb-3">
        <div className="flex items-center gap-1.5">
          {onUpdatePaymentStatus ? (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                draggable={false}
                onClick={handleTogglePayment}
                disabled={isUpdating}
                title={order.paymentStatus === "PAID" ? "Clique para marcar como Não Pago" : "Clique para marcar como Pago"}
                className={`group/pay inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[11px] border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                  order.paymentStatus === "PAID"
                    ? "bg-emerald-100/90 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                    : "bg-amber-100/90 text-amber-800 border-amber-300 hover:bg-amber-200"
                }`}
              >
                {order.paymentStatus === "PAID" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-700" />
                    <span>Pago</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="h-3 w-3 text-amber-700" />
                    <span>Pagar</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <Badge 
              className={`border-0 font-bold px-2 py-0.5 text-[10px] ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.paymentStatus === "PAID" ? "Pago" : "Pendente"}
            </Badge>
          )}
          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[110px]">
            {paymentLabels[order.paymentMethod] || order.paymentMethod || "Não informado"}
          </span>
        </div>

        {/* Total Price */}
        <div className="text-right">
          <span className="font-extrabold text-sm text-slate-800">
            {formattedTotal}
          </span>
        </div>
      </div>

      {/* Additional discount/fee information if any */}
      {Boolean((order.paymentDiscount && order.paymentDiscount > 0) || (order.cardFee && order.cardFee > 0)) && (
        <div className="flex items-center justify-between text-[10px] font-bold pb-2 -mt-1">
          {order.paymentDiscount && order.paymentDiscount > 0 ? (
            <span className="text-emerald-600">
              Desc. PIX: -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.paymentDiscount)}
            </span>
          ) : <span />}
          {order.cardFee && order.cardFee > 0 ? (
            <span className="text-rose-500">
              Taxa Retida: -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.cardFee)}
            </span>
          ) : null}
        </div>
      )}

      {/* Quick Action Button (Mobile-First 44px touch target) */}
      {quickAction && (
        <div onClick={(e) => e.stopPropagation()} className="pt-1">
          <Button
            type="button"
            onClick={() => onUpdateStatus(order.id, quickAction.targetStatus)}
            disabled={isUpdating}
            className={`w-full min-h-[44px] md:min-h-[38px] md:h-9 rounded-xl text-xs flex items-center justify-center transition-all ${quickAction.className}`}
          >
            {quickAction.icon}
            <span>{quickAction.label}</span>
          </Button>
        </div>
      )}

      {/* Completed State badge indicator */}
      {order.status === "COMPLETED" && (
        <div className="pt-1 flex items-center justify-center gap-1.5 py-1.5 text-emerald-700 bg-emerald-50 rounded-xl font-bold text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Concluído</span>
        </div>
      )}
    </div>
  );
};
