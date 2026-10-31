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
  updatingOrderId: string | null;
}

const KANBAN_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "DISPATCHED",
  "COMPLETED",
];

const mobileTabConfigs: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; activeBg: string; activeBorder: string; activeText: string }
> = {
  PENDING: {
    label: "Pendente",
    icon: <Clock className="h-3.5 w-3.5" />,
    activeBg: "bg-amber-500 text-white shadow-sm",
    activeBorder: "border-amber-600",
    activeText: "text-amber-700",
  },
  CONFIRMED: {
    label: "Separado",
    icon: <PackageCheck className="h-3.5 w-3.5" />,
    activeBg: "bg-blue-600 text-white shadow-sm",
    activeBorder: "border-blue-700",
    activeText: "text-blue-700",
  },
  DISPATCHED: {
    label: "Enviado",
    icon: <Truck className="h-3.5 w-3.5" />,
    activeBg: "bg-purple-600 text-white shadow-sm",
    activeBorder: "border-purple-700",
    activeText: "text-purple-700",
  },
  COMPLETED: {
    label: "Entregue",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    activeBg: "bg-emerald-600 text-white shadow-sm",
    activeBorder: "border-emerald-700",
    activeText: "text-emerald-700",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: <Clock className="h-3.5 w-3.5" />,
    activeBg: "bg-rose-600 text-white shadow-sm",
    activeBorder: "border-rose-700",
    activeText: "text-rose-700",
  },
};

export const OrderKanbanBoard: React.FC<OrderKanbanBoardProps> = ({
  orders,
  isLoading,
  timeZone,
  todayYmd,
  onSelectOrder,
  onUpdateStatus,
  updatingOrderId,
}) => {
  const [activeMobileStatus, setActiveMobileStatus] = useState<OrderStatus>("PENDING");

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

    // Ordenação operacional (FIFO): do mais antigo para o mais novo
    (Object.keys(map) as OrderStatus[]).forEach((statusKey) => {
      map[statusKey].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
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
      {/* Mobile Status Tabs (Pills) */}
      <div className="block md:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
          {KANBAN_STATUSES.map((status) => {
            const config = mobileTabConfigs[status];
            const count = groupedOrders[status]?.length || 0;
            const isActive = activeMobileStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveMobileStatus(status)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 ${
                  isActive
                    ? config.activeBg
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                {config.icon}
                <span>{config.label}</span>
                <span
                  className={`text-[11px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile: Active Single Column */}
        <div className="pt-2">
          <OrderKanbanColumn
            status={activeMobileStatus}
            orders={groupedOrders[activeMobileStatus]}
            timeZone={timeZone}
            onSelectOrder={onSelectOrder}
            onUpdateStatus={onUpdateStatus}
            updatingOrderId={updatingOrderId}
          />
        </div>
      </div>

      {/* Desktop View: 4-Column Grid */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4">
        {KANBAN_STATUSES.map((status) => (
          <OrderKanbanColumn
            key={status}
            status={status}
            orders={groupedOrders[status]}
            timeZone={timeZone}
            onSelectOrder={onSelectOrder}
            onUpdateStatus={onUpdateStatus}
            updatingOrderId={updatingOrderId}
          />
        ))}
      </div>
    </div>
  );
};
