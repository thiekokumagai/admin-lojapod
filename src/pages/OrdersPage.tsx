import { useState, Fragment, useEffect, useRef } from "react";
import { useInfiniteOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ArrowRight, Loader2, Calendar, ShoppingBag, X, Plus } from "lucide-react";
import OrderDetailDrawer from "@/components/OrderDetailDrawer";
import { OrderStatus, PaymentStatus } from "@/types/order";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Pendente", bg: "bg-amber-100/80 text-amber-700", text: "text-amber-700" },
  CONFIRMED: { label: "Separado", bg: "bg-blue-100/80 text-blue-700", text: "text-blue-700" },
  DISPATCHED: { label: "Enviado", bg: "bg-purple-100/80 text-purple-700", text: "text-purple-700" },
  COMPLETED: { label: "Entregue", bg: "bg-emerald-100/80 text-emerald-700", text: "text-emerald-700" },
  CANCELLED: { label: "Cancelado", bg: "bg-rose-100/80 text-rose-700", text: "text-rose-700" },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Pendente", bg: "bg-amber-100/80 text-amber-700", text: "text-amber-700" },
  PAID: { label: "Pago", bg: "bg-emerald-100/80 text-emerald-700", text: "text-emerald-700" },
};

const paymentLabels: Record<string, string> = {
  PIX: "Pix",
  pix: "Pix",
  "Cartão de Crédito": "Cartão de Crédito",
  credit: "Cartão de Crédito",
  credito: "Cartão de Crédito",
  "Cartão de Débito": "Cartão de Débito",
  debit: "Cartão de Débito",
  debito: "Cartão de Débito",
  Dinheiro: "Dinheiro",
  cash: "Dinheiro",
  dinheiro: "Dinheiro",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const limit = 20;

  const hasFilters = search !== "" || status !== "ALL" || paymentStatus !== "ALL" || startDate !== "" || endDate !== "";
  const queryClient = useQueryClient();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_ADMIN_API?.replace(/\/api$/, '') || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Connected to websocket server for order updates');
    });

    socket.on('order.new', (order) => {
      console.log('New order received via websocket:', order);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    socket.on('order.updated', (order) => {
      console.log('Order updated via websocket:', order);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (order && order.id) {
        queryClient.invalidateQueries({ queryKey: ["orders", order.id] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPaymentStatus("ALL");
    setStartDate("");
    setEndDate("");
  };

  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year.slice(2)}`;
  };

  const getMobileDateLabel = () => {
    if (startDate && endDate) {
      return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
    }
    if (startDate) {
      return `A partir de ${formatDateDisplay(startDate)}`;
    }
    if (endDate) {
      return `Até ${formatDateDisplay(endDate)}`;
    }
    return "Filtrar por data";
  };

  const handlePresetToday = () => {
    const todayStr = formatYMD(new Date());
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const handlePreset7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setStartDate(formatYMD(start));
    setEndDate(formatYMD(end));
  };

  const handlePresetMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(formatYMD(start));
    setEndDate(formatYMD(now));
  };

  const getValidDateString = (dateStr: string) => {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  const { data: paginatedData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteOrders(
    search, 
    status, 
    getValidDateString(startDate), 
    getValidDateString(endDate),
    limit,
    paymentStatus
  );

  const orders = paginatedData?.pages.flatMap(page => page.data || []) || [];

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id, payload: { status: newStatus } });
  };

  const handleUpdatePaymentStatus = (id: string, newPaymentStatus: PaymentStatus) => {
    updateStatusMutation.mutate({ id, payload: { paymentStatus: newPaymentStatus } });
  };

  // Group orders chronologically by date
  const groupOrdersByDate = (orderList: typeof orders) => {
    const groups: Record<string, typeof orders> = {};
    
    orderList.forEach((order) => {
      const date = new Date(order.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateStr = "";
      if (date.toDateString() === today.toDateString()) {
        dateStr = "HOJE";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateStr = "ONTEM";
      } else {
        dateStr = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(order);
    });
    
    return groups;
  };

  const groupedOrders = groupOrdersByDate(orders);


  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Pedidos</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">Gerencie suas vendas e acompanhe os status de entrega em tempo real.</p>
        </div>
        <Button 
          className="rounded-xl h-11 px-5 font-bold shadow-sm w-full md:w-auto"
          onClick={() => window.location.href = "/pedidos/novo"}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Buscar por ID, nome ou telefone..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            className="pl-10 h-11 border-slate-200 focus-visible:ring-violet-600 rounded-xl font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full sm:w-48">
          <Select value={status} onValueChange={(val) => { setStatus(val); }}>
            <SelectTrigger className="h-11 border-slate-200 focus:ring-violet-600 rounded-xl font-semibold text-slate-700">
              <SelectValue placeholder="Status de Entrega" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="font-semibold rounded-md">Todos</SelectItem>
              <SelectItem value="PENDING" className="font-semibold rounded-md">Pendente</SelectItem>
              <SelectItem value="CONFIRMED" className="font-semibold rounded-md">Separado</SelectItem>
              <SelectItem value="DISPATCHED" className="font-semibold rounded-md">Enviado</SelectItem>
              <SelectItem value="COMPLETED" className="font-semibold rounded-md">Entregue</SelectItem>
              <SelectItem value="CANCELLED" className="font-semibold rounded-md">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Status Dropdown */}
        <div className="w-full sm:w-48">
          <Select value={paymentStatus} onValueChange={(val) => { setPaymentStatus(val); }}>
            <SelectTrigger className="h-11 border-slate-200 focus:ring-violet-600 rounded-xl font-semibold text-slate-700">
              <SelectValue placeholder="Status de Pagamento" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="font-semibold rounded-md">Todos</SelectItem>
              <SelectItem value="PENDING" className="font-semibold rounded-md">Pendente</SelectItem>
              <SelectItem value="PAID" className="font-semibold rounded-md">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Filters */}
        {/* Desktop View (hidden sm:flex) */}
        <div className="hidden sm:flex sm:items-center gap-2">
          <Input 
            type="date" 
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); }}
            className="h-11 border-slate-200 focus-visible:ring-violet-600 rounded-xl font-medium text-slate-600 w-full"
          />
          <span className="text-slate-400 font-medium">até</span>
          <Input 
            type="date" 
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); }}
            className="h-11 border-slate-200 focus-visible:ring-violet-600 rounded-xl font-medium text-slate-600 w-full"
          />
        </div>

        {/* Mobile View (sm:hidden flex w-full) */}
        <div className="sm:hidden w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`h-11 w-full justify-between rounded-xl font-semibold border-slate-200 ${
                  startDate || endDate 
                    ? "border-emerald-600 bg-emerald-600 text-white font-bold hover:bg-emerald-700 hover:text-white" 
                    : "text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Calendar className={`h-4 w-4 shrink-0 ${startDate || endDate ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{getMobileDateLabel()}</span>
                </div>
                {(startDate || endDate) && (
                  <span className="flex h-2 w-2 rounded-full bg-white shrink-0 ml-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-32px)] max-w-sm p-4 rounded-2xl shadow-xl border-slate-200 overflow-hidden box-border" align="center">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Filtro de Data
                  </h4>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Limpar datas
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handlePresetToday}
                    className="text-xs h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700 font-semibold shrink-0"
                  >
                    Hoje
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handlePreset7Days}
                    className="text-xs h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700 font-semibold shrink-0"
                  >
                    Últimos 7 dias
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handlePresetMonth}
                    className="text-xs h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700 font-semibold shrink-0"
                  >
                    Este Mês
                  </Button>
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="min-w-0">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Data Inicial</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block h-10 w-full min-w-0 max-w-full border-slate-200 focus-visible:ring-violet-600 rounded-xl font-medium text-slate-700 text-xs px-2 bg-white box-border"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Data Final</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block h-10 w-full min-w-0 max-w-full border-slate-200 focus-visible:ring-violet-600 rounded-xl font-medium text-slate-700 text-xs px-2 bg-white box-border"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {hasFilters && (
          <Button 
            variant="ghost" 
            onClick={handleClearFilters} 
            className="h-11 px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors sm:ml-auto"
            title="Limpar Filtros"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>


      {/* Main Panel */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white/40 border border-slate-200/50 rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-slate-500">Carregando lista de vendas...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/70 border border-slate-200/50 rounded-2xl text-center p-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-lg">Nenhum pedido encontrado</h3>
            <p className="text-xs text-slate-400 max-w-xs font-medium">Tente ajustar seus filtros de busca ou verifique se há novas vendas.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Grid View */}
          <div className="grid md:hidden gap-4">
            {Object.entries(groupedOrders).map(([date, items]) => (
              <div key={date} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider bg-slate-50 p-2 rounded-md">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{date}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1" />
                  <span>{items.length} {items.length === 1 ? 'venda' : 'vendas'}</span>
                </div>
                {items.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col gap-3 active:bg-violet-50/40 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{order.customerName}</span>
                        <span className="font-mono font-bold text-slate-400 text-xs">#{order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-extrabold text-violet-600">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.totalOrder)}
                        </span>
                        {order.paymentDiscount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Desc. PIX: -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.paymentDiscount)}
                          </div>
                        )}
                        {order.cardFee > 0 && (
                          <div className="text-[10px] text-rose-500 font-bold mt-0.5">
                            Taxa Retida: -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.cardFee)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Pagamento</span>
                        <div className="flex flex-col gap-0.5 items-start">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {order.status === 'CANCELLED' ? (
                              <Badge className="bg-rose-100 text-rose-700 shadow-none font-bold rounded-full text-[10px] px-2 py-0 border-0">Cancelado</Badge>
                            ) : (
                              <>
                                <Badge className={`${paymentStatusConfig[order.paymentStatus || 'PENDING'].bg} shadow-none font-bold rounded-full text-[10px] px-2 py-0 border-0`}>
                                  {paymentStatusConfig[order.paymentStatus || 'PENDING'].label}
                                </Badge>
                                <Select value={order.paymentStatus || 'PENDING'} onValueChange={(val) => handleUpdatePaymentStatus(order.id, val as PaymentStatus)}>
                                  <SelectTrigger className="h-5 w-5 p-0 border-0 bg-transparent focus:ring-0 shadow-none">
                                    <ArrowRight className="h-3 w-3 rotate-90 text-slate-400" />
                                  </SelectTrigger>
                                  <SelectContent><SelectItem value="PENDING">Pendente</SelectItem><SelectItem value="PAID">Pago</SelectItem></SelectContent>
                                </Select>
                              </>
                            )}
                          </div>
                          {order.paymentMethod && (
                            <span className="text-[11px] text-slate-400 font-medium leading-tight">
                              {paymentLabels[order.paymentMethod] || order.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Entrega</span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Badge className={`${statusConfig[order.status].bg} shadow-none font-bold rounded-full text-[10px] px-2 py-0 border-0`}>
                            {statusConfig[order.status].label}
                          </Badge>
                          <Select value={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val as OrderStatus)}>
                            <SelectTrigger className="h-5 w-5 p-0 border-0 bg-transparent focus:ring-0 shadow-none">
                              <ArrowRight className="h-3 w-3 rotate-90 text-slate-400" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendente</SelectItem>
                              <SelectItem value="CONFIRMED">Separado</SelectItem>
                              <SelectItem value="DISPATCHED">Enviado</SelectItem>
                              <SelectItem value="COMPLETED">Entregue</SelectItem>
                              <SelectItem value="CANCELLED" disabled={order.paymentStatus === 'PAID'}>Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] font-bold text-slate-600">Pedido</TableHead>
                <TableHead className="font-bold text-slate-600">Cliente</TableHead>
                <TableHead className="font-bold text-slate-600">Pagamento</TableHead>
                <TableHead className="font-bold text-slate-600">Entrega</TableHead>
                <TableHead className="text-right font-bold text-slate-600">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedOrders).map(([date, items]) => (
                <Fragment key={date}>
                  {/* Cabeçalho do Grupo (Data) */}
                  <TableRow className="bg-slate-50/40 hover:bg-slate-50/40 border-b border-slate-200/80">
                    <TableCell colSpan={6} className="py-2.5 px-4">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-md uppercase tracking-wider">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{date}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1" />
                        <span>{items.length} {items.length === 1 ? 'venda' : 'vendas'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Linhas dos Pedidos */}
                  {items.map((order) => (
                    <TableRow 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(order.id)}
                      className="group cursor-pointer hover:bg-violet-50/40 transition-colors text-md"
                    >
                      <TableCell className="font-mono font-bold text-slate-400">#{order.orderNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{order.customerName}</span>
                          {order.observation && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-1.5 py-0 h-5 text-[10px]" title={order.observation}>
                              OBS
                            </Badge>
                          )}
                        </div>
                        <div className="text-md text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start" onClick={(e) => e.stopPropagation()}>
                          {order.status === 'CANCELLED' ? (
                            <Badge className="bg-rose-100 text-rose-700 shadow-none font-bold rounded-full text-[12px] px-2.5 py-0.5 border-0 hover:bg-rose-100">
                              Cancelado
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge className={`${paymentStatusConfig[order.paymentStatus || 'PENDING'].bg} shadow-none font-bold rounded-full text-[12px] px-2.5 py-0.5 border-0`}>
                                {paymentStatusConfig[order.paymentStatus || 'PENDING'].label}
                              </Badge>
                              <Select 
                                value={order.paymentStatus || 'PENDING'} 
                                onValueChange={(val) => handleUpdatePaymentStatus(order.id, val as PaymentStatus)}
                              >
                                <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent focus:ring-0 shadow-none">
                                  <ArrowRight className="h-3 w-3 rotate-90 text-slate-400" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">Pendente</SelectItem>
                                  <SelectItem value="PAID">Pago</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">{paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Badge className={`${statusConfig[order.status].bg} shadow-none font-bold rounded-full text-[12px] px-2.5 py-0.5 border-0`}>
                            {statusConfig[order.status].label}
                          </Badge>
                          <Select 
                            value={order.status} 
                            onValueChange={(val) => handleUpdateStatus(order.id, val as OrderStatus)}
                          >
                            <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent focus:ring-0 shadow-none">
                              <ArrowRight className="h-3 w-3 rotate-90 text-slate-400" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendente</SelectItem>
                              <SelectItem value="CONFIRMED">Separado</SelectItem>
                              <SelectItem value="DISPATCHED">Enviado</SelectItem>
                              <SelectItem value="COMPLETED">Entregue</SelectItem>
                              <SelectItem value="CANCELLED" disabled={order.paymentStatus === 'PAID'}>Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-extrabold text-slate-800">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          }).format(order.totalOrder)}
                        </div>
                        {order.paymentDiscount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Desc. PIX: -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.paymentDiscount)}
                          </div>
                        )}
                        {order.cardFee > 0 && (
                          <div className="text-[10px] text-rose-500 font-bold mt-0.5">
                            Taxa Retida: -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.cardFee)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all shrink-0">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {/* Infinite Scroll Loader */}
        {hasNextPage && (
          <div ref={loaderRef} className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        )}
        </>
      )}
      {/* Modal Details Drawer */}
      <OrderDetailDrawer 
        orderId={selectedOrderId} 
        isOpen={!!selectedOrderId} 
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
