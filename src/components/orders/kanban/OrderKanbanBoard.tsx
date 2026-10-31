import React, { useState, useMemo } from "react";
import { Order, OrderStatus } from "@/types/order";
import { OrderKanbanColumn } from "./OrderKanbanColumn";
import { isOrderFromToday } from "@/utils/date-timezone";
import { Clock, PackageCheck, Truck, CheckCircle2, Loader2, Calendar } from "lucide-react";

interface OrderKanbanBoardProps {
  orders: Order[];
  isLoading: boolean;
  timeZone: string;
  todayYmd: string;
  onSelectOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: import("@/types/order").PaymentStatus) => void;
  updatingOrderId: string | null;
}

const KANBAN_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "DISPATCHED",
  "COMPLETED",
];

const statusList: Array<{
  id: "PENDING" | "CONFIRMED" | "DISPATCHED" | "COMPLETED";
  label: string;
  color: string;
  activeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "PENDING",
    label: "Pendente",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    activeColor: "bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40",
    icon: Clock,
  },
  {
    id: "CONFIRMED",
    label: "Separado",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    activeColor: "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40",
    icon: PackageCheck,
  },
  {
    id: "DISPATCHED",
    label: "Enviado",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    activeColor: "bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/40",
    icon: Truck,
  },
  {
    id: "COMPLETED",
    label: "Entregue",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    activeColor: "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40",
    icon: CheckCircle2,
  },
];

export const OrderKanbanBoard: React.FC<OrderKanbanBoardProps> = ({
  orders,
  isLoading,
  timeZone,
  todayYmd,
  onSelectOrder,
  onUpdateStatus,
  onUpdatePaymentStatus,
  updatingOrderId,
}) => {
  const [activeMobileStatus, setActiveMobileStatus] = useState<
    "PENDING" | "CONFIRMED" | "DISPATCHED" | "COMPLETED"
  >("PENDING");

  // Filter orders strictly for today in store's timezone and group by status
  const groupedOrders = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      PENDING: [],
      CONFIRMED: [],
      DISPATCHED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    orders.forEach((order) => {
      // Frontend safety filter: strictly today in store's timezone
      if (!isOrderFromToday(order.createdAt, timeZone, todayYmd)) {
        return;
      }
      if (map[order.status]) {
        map[order.status].push(order);
      }
    });

    // Ordenação:
    // Para ENTREGUES (COMPLETED): do mais novo para o mais antigo (LIFO / recém-entregues no topo)
    // Para etapas operacionais (PENDING, CONFIRMED, DISPATCHED): do mais antigo para o mais novo (FIFO)
    (Object.keys(map) as OrderStatus[]).forEach((statusKey) => {
      if (statusKey === "COMPLETED") {
        map[statusKey].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        map[statusKey].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });

    return map;
  }, [orders, timeZone, todayYmd]);

  const totalTodayOrders = useMemo(() => {
    return (
      groupedOrders.PENDING.length +
      groupedOrders.CONFIRMED.length +
      groupedOrders.DISPATCHED.length +
      groupedOrders.COMPLETED.length
    );
  }, [groupedOrders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3 bg-white/40 border border-slate-200/50 rounded-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        <p className="text-sm font-semibold text-slate-500">
          Carregando pedidos de hoje no Kanban...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kanban Info / Mobile Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Mobile Navigation Tabs: [Pendente 5] [Separado 3] [Enviado 2] [Entregue 8] */}
        <div className="grid grid-cols-4 gap-1.5 md:hidden w-full bg-slate-200/60 p-1.5 rounded-2xl">
          {statusList.map((item) => {
            const count = groupedOrders[item.id]?.length || 0;
            const isSelected = activeMobileStatus === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMobileStatus(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all ${
                  isSelected
                    ? item.activeColor
                    : "bg-white/80 text-slate-700 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="text-[11px] font-bold truncate">
                    {item.label}
                  </span>
                </div>
                <span
                  className={`mt-0.5 text-xs font-black px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop Helper Info */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Quadro operacional do dia (mais antigo primeiro)</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-slate-700">
            {totalTodayOrders} {totalTodayOrders === 1 ? "pedido hoje" : "pedidos hoje"}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400">Arraste os cards entre as colunas ou use o botão de ação</span>
        </div>
      </div>

      {/* Mobile View: Shows the active single column at comfortable full width */}
      <div className="md:hidden">
        <OrderKanbanColumn
          status={activeMobileStatus}
          orders={groupedOrders[activeMobileStatus]}
          timeZone={timeZone}
          onSelectOrder={onSelectOrder}
          onUpdateStatus={onUpdateStatus}
          onUpdatePaymentStatus={onUpdatePaymentStatus}
          updatingOrderId={updatingOrderId}
        />
      </div>

      {/* Desktop View: Shows all 4 columns side by side */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4">
        {statusList.map((item) => (
          <OrderKanbanColumn
            key={item.id}
            status={item.id}
            orders={groupedOrders[item.id]}
            timeZone={timeZone}
            onSelectOrder={onSelectOrder}
            onUpdateStatus={onUpdateStatus}
            onUpdatePaymentStatus={onUpdatePaymentStatus}
            updatingOrderId={updatingOrderId}
          />
        ))}
      </div>
    </div>
  );
};
