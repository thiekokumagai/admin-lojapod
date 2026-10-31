import React, { useState } from "react";
import { Order, OrderStatus } from "@/types/order";
import { OrderKanbanCard } from "./OrderKanbanCard";
import { Clock, PackageCheck, Truck, CheckCircle2, Inbox } from "lucide-react";

interface OrderKanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  timeZone: string;
  onSelectOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  updatingOrderId: string | null;
}

interface ColumnConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dragOverBorder: string;
  emptyTitle: string;
  emptyDesc: string;
}

const columnConfigs: Record<OrderStatus, ColumnConfig> = {
  PENDING: {
    title: "Pendente",
    subtitle: "Aguardando separação",
    icon: <Clock className="h-4 w-4 text-amber-600" />,
    headerBg: "bg-amber-50/70 border-amber-200/70 text-amber-900",
    badgeBg: "bg-amber-100 text-amber-800",
    badgeText: "text-amber-800",
    borderColor: "border-slate-200/80",
    dragOverBorder: "ring-2 ring-amber-400 bg-amber-50/30",
    emptyTitle: "Nenhum pedido pendente",
    emptyDesc: "Novos pedidos de hoje aparecerão automaticamente aqui.",
  },
  CONFIRMED: {
    title: "Separado",
    subtitle: "Pronto para entrega/retirada",
    icon: <PackageCheck className="h-4 w-4 text-blue-600" />,
    headerBg: "bg-blue-50/70 border-blue-200/70 text-blue-900",
    badgeBg: "bg-blue-100 text-blue-800",
    badgeText: "text-blue-800",
    borderColor: "border-slate-200/80",
    dragOverBorder: "ring-2 ring-blue-400 bg-blue-50/30",
    emptyTitle: "Nenhum pedido separado",
    emptyDesc: "Avance pedidos pendentes para esta etapa quando estiverem prontos.",
  },
  DISPATCHED: {
    title: "Enviado",
    subtitle: "Em rota de entrega",
    icon: <Truck className="h-4 w-4 text-purple-600" />,
    headerBg: "bg-purple-50/70 border-purple-200/70 text-purple-900",
    badgeBg: "bg-purple-100 text-purple-800",
    badgeText: "text-purple-800",
    borderColor: "border-slate-200/80",
    dragOverBorder: "ring-2 ring-purple-400 bg-purple-50/30",
    emptyTitle: "Nenhum pedido em rota",
    emptyDesc: "Marque como enviado ao despachar com o motoboy.",
  },
  COMPLETED: {
    title: "Entregue",
    subtitle: "Concluído hoje",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    headerBg: "bg-emerald-50/70 border-emerald-200/70 text-emerald-900",
    badgeBg: "bg-emerald-100 text-emerald-800",
    badgeText: "text-emerald-800",
    borderColor: "border-slate-200/80",
    dragOverBorder: "ring-2 ring-emerald-400 bg-emerald-50/30",
    emptyTitle: "Nenhum pedido entregue",
    emptyDesc: "Pedidos entregues ao cliente aparecerão arquivados aqui.",
  },
  CANCELLED: {
    title: "Cancelado",
    subtitle: "Cancelados hoje",
    icon: <Clock className="h-4 w-4 text-rose-600" />,
    headerBg: "bg-rose-50 border-rose-200 text-rose-900",
    badgeBg: "bg-rose-100 text-rose-800",
    badgeText: "text-rose-800",
    borderColor: "border-rose-200",
    dragOverBorder: "ring-2 ring-rose-400 bg-rose-50/30",
    emptyTitle: "Nenhum pedido cancelado",
    emptyDesc: "",
  },
};

export const OrderKanbanColumn: React.FC<OrderKanbanColumnProps> = ({
  status,
  orders,
  timeZone,
  onSelectOrder,
  onUpdateStatus,
  updatingOrderId,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = columnConfigs[status] || columnConfigs.PENDING;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only unset if we are leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data && data.orderId && data.currentStatus !== status) {
        onUpdateStatus(data.orderId, status);
      }
    } catch (err) {
      console.error("Failed to parse dropped order payload", err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-50/80 rounded-2xl border ${
        isDragOver ? config.dragOverBorder : config.borderColor
      } transition-all duration-150 overflow-hidden min-h-[420px] md:h-[calc(100vh-270px)]`}
    >
      {/* Column Header */}
      <div className={`p-3.5 border-b flex items-center justify-between ${config.headerBg}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/80 shadow-2xs">
            {config.icon}
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-800">
              {config.title}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Count Badge */}
        <span
          className={`font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-full ${config.badgeBg}`}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 overscroll-contain">
        {orders.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-slate-200/90 bg-white/40">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Inbox className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-xs text-slate-700 mb-1">
              {config.emptyTitle}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium max-w-[200px]">
              {config.emptyDesc}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderKanbanCard
              key={order.id}
              order={order}
              timeZone={timeZone}
              onSelectOrder={onSelectOrder}
              onUpdateStatus={onUpdateStatus}
              isUpdating={updatingOrderId === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
