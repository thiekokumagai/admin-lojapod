import { useParams, useNavigate } from "react-router-dom";
import { useOrderDetails, useCancelOrder, useReprintOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, Send, Copy, Printer, Edit,
  User, Phone, MapPin, CreditCard, Check, Loader2, Repeat 
} from "lucide-react";
import { useState } from "react";
import { customersService } from "@/services/customers.service";
import { getProductById } from "@/services/product.service";
import { OrderStatus } from "@/types/order";
import { formatPhone } from "@/utils/formatters";
import { buildImageUrl } from "@/utils/image-url";

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  PENDING: { label: "Pendente", bg: "bg-amber-100", text: "text-amber-700" },
  CONFIRMED: { label: "Confirmado", bg: "bg-blue-100", text: "text-blue-700" },
  DISPATCHED: { label: "Despachado", bg: "bg-purple-100", text: "text-purple-700" },
  COMPLETED: { label: "Entregue", bg: "bg-emerald-100", text: "text-emerald-700" },
  CANCELLED: { label: "Cancelado", bg: "bg-rose-100", text: "text-rose-700" },
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

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  
  const { data: order, isLoading } = useOrderDetails(id ?? "");
  const cancelMutation = useCancelOrder();
  const reprintMutation = useReprintOrder();

  const handleReprintOrder = async () => {
    if (!id) return;
    try {
      await reprintMutation.mutateAsync(id);
      toast({
        title: "Reimpressão enviada",
        description: `O pedido #${order?.orderNumber} foi enviado para a impressora.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao imprimir",
        description: err.message || "Ocorreu um erro ao processar a reimpressão.",
      });
    }
  };

  const handleCopyAddress = () => {
    if (!order) return;
    let addressStr = `${order.street}, ${order.number}`;
    if (order.neighborhood && order.neighborhood.trim()) {
      const cleanNeigh = order.neighborhood.trim().replace(/^bairro\s+/i, '');
      if (cleanNeigh) {
        addressStr += `, ${cleanNeigh}`;
      }
    }
    
    navigator.clipboard.writeText(addressStr);
    setCopied(true);
    toast({
      title: "Endereço copiado!",
      description: "Endereço formatado foi copiado para a área de transferência.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelOrder = async () => {
    if (!id) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast({
        title: "Pedido cancelado",
        description: `O pedido #${order?.orderNumber} foi cancelado com sucesso.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar pedido",
        description: err.message || "Ocorreu um erro ao processar o cancelamento.",
      });
    }
  };

  const handleRepeatOrder = async () => {
    if (!order || isRepeating) return;
    setIsRepeating(true);
    
    let fullCustomer = null;
    let matchedAddressId = "";
    
    try {
      if (order.customerId) {
        fullCustomer = await customersService.getCustomerById(order.customerId).catch(() => null);
        if (fullCustomer?.addresses) {
          const matched = fullCustomer.addresses.find((a: any) => a.street === order.street && a.number === order.number);
          if (matched) {
            matchedAddressId = matched.id;
          }
        }
      }

      let validItems: any[] = [];
      let hasOutOfStock = false;
      
      const productPromises = order.items.map(item => getProductById(item.productId).catch(() => null));
      const products = await Promise.all(productPromises);
      
      order.items.forEach((item, index) => {
        const product = products[index];
        if (!product || product.status === "inactive") {
          hasOutOfStock = true;
          return;
        }
        
        let availableStock = 0;
        if (item.productItemId) {
          const pItem = product.items?.find((i: any) => i.id === item.productItemId);
          if (pItem) availableStock = pItem.stock || 0;
        } else {
          availableStock = product.totalStock || 0;
        }

        if (availableStock <= 0) {
          hasOutOfStock = true;
          return;
        }

        validItems.push({
          productId: item.productId,
          productItemId: item.productItemId || undefined,
          title: item.productName,
          price: item.price,
          quantity: Math.min(item.quantity, availableStock),
          imageUrl: item.imageUrl,
          variation: item.variation,
          maxStock: availableStock,
          isPromo: !!product.promotionalPrice,
          oldPrice: product.price || 0,
        });
      });

      if (hasOutOfStock) {
        toast({
          title: "Atenção ao Estoque",
          description: "Alguns produtos do pedido original estão esgotados ou inativos e foram removidos.",
          variant: "destructive"
        });
      }

      const duplicateData = {
        items: validItems,
        customer: fullCustomer || {
          id: order.customerId || "",
          name: order.customerName,
          phone: order.customerPhone,
          addresses: [{
            id: "endereco-pedido",
            customerId: order.customerId || "",
            street: order.street,
            number: order.number,
            neighborhood: order.neighborhood,
            city: order.city,
            state: order.state,
            cep: order.cep,
            complement: order.complement || "",
            isDefault: true,
          }]
        },
        address: {
          id: matchedAddressId || "endereco-pedido",
          customerId: order.customerId || "",
          street: order.street,
          number: order.number,
          neighborhood: order.neighborhood,
          city: order.city,
          state: order.state,
          cep: order.cep,
          complement: order.complement || "",
          isDefault: true,
        },
        paymentMethod: 
          order.paymentMethod === 'pix' ? 'PIX' : 
          order.paymentMethod === 'credit' || order.paymentMethod === 'credito' ? 'Cartão de Crédito' : 
          order.paymentMethod === 'debit' ? 'Cartão de Débito' : 
          order.paymentMethod === 'cash' ? 'Dinheiro' : 
          order.paymentMethod,
      };
      navigate("/pedidos/novo", { state: { duplicateData } });
    } finally {
      setIsRepeating(false);
    }
  };
  const formattedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
      }).replace(",", " -");
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 space-y-4">
        <p className="text-sm font-medium">Pedido não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/pedidos")}>Voltar para pedidos</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 px-1.5 md:px-4">
      {/* Header with back button and fast action icons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <button 
          onClick={() => navigate("/pedidos")}
          className="flex items-center gap-1.5 text-slate-600 hover:text-violet-700 transition-colors text-sm font-semibold group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para Pedidos</span>
        </button>

        {/* Quick actions top-right */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {/* 1. Imprimir */}
          {order.status !== 'CANCELLED' && (
            <button 
              onClick={handleReprintOrder}
              disabled={reprintMutation.isPending}
              className="w-9 h-9 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-600 hover:text-violet-700 transition-colors shrink-0 disabled:opacity-50" 
              title="Imprimir"
            >
              {reprintMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            </button>
          )}

          {/* 2. Enviar (Compartilhar) */}
          <button 
            disabled
            className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 cursor-not-allowed shrink-0" 
            title="Compartilhar (Em breve)"
          >
            <Send className="h-4 w-4" />
          </button>

          {/* 3. Editar */}
          {order.status === 'PENDING' && order.paymentStatus === 'PENDING' && (
            <button 
              onClick={() => navigate(`/pedidos/${order.id}/editar`)}
              className="w-9 h-9 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-600 hover:text-violet-700 transition-colors shrink-0" 
              title="Editar pedido"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}

          {/* 4. Repetir */}
          <button 
            onClick={handleRepeatOrder}
            disabled={isRepeating}
            className="w-9 h-9 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-600 hover:text-violet-700 transition-colors shrink-0 disabled:opacity-50" 
            title="Repetir pedido"
          >
            {isRepeating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
          </button>

          {/* 5. WhatsApp */}
          <a 
            href={`https://wa.me/55${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${order.customerName}! Referente ao seu pedido #${order.orderNumber}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-colors shrink-0" 
            title="WhatsApp"
          >
            <img src="/whatsapp.svg" alt="WhatsApp" className="h-5 w-5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Order summary card with main data */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-slate-800 tracking-tight block">Pedido #{order.orderNumber}</span>
                <span className="text-sm text-slate-500 font-medium">
                  {formattedDate(order.createdAt)}
                </span>
              </div>
              <Badge className={`${statusConfig[order.status].bg} ${statusConfig[order.status].text} hover:${statusConfig[order.status].bg} border-0 px-3 py-1 font-semibold rounded-full text-sm`}>
                {statusConfig[order.status].label}
              </Badge>
            </div>
          </div>

          {/* Product items section */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Itens do Pedido
            </h3>
            <div className="space-y-3 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 relative py-3 first:pt-0 last:pb-0 border-b border-slate-100 last:border-0">
                  {/* Product Image Container */}
                  <div className="relative w-16 h-16 shrink-0">
                    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200/50">
                      {item.imageUrl ? (
                        <img
                          src={buildImageUrl(item.imageUrl)}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <span className="text-[10px] text-slate-400 font-medium text-center leading-none px-1">Sem foto</span>
                        </div>
                      )}
                    </div>
                    {/* Quantity Badge */}
                    <div className="absolute -top-1.5 -left-1.5 min-w-[24px] h-[24px] rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold px-1 shadow-sm z-10">
                      {item.quantity}
                    </div>
                  </div>
                  
                  {/* Product Name and Price */}
                  <div className="flex-1 flex items-start justify-between min-w-0 gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-700 leading-snug block break-words" title={item.productName}>
                        {item.productName}
                      </span>
                      {item.variation && (
                        <span className="block text-xs text-slate-400 font-medium mt-0.5 break-words">
                          ({item.variation})
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-700 shrink-0 whitespace-nowrap">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Client info */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm space-y-3">
             <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-1">Cliente</h3>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-slate-800 truncate">{order.customerName}</div>
                  <a 
                    href={`tel:${order.customerPhone}`}
                    className="text-sm text-slate-500 hover:text-violet-600 flex items-center gap-1.5 mt-0.5 font-medium"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{formatPhone(order.customerPhone)}</span>
                  </a>
                </div>
              </div>
          </div>

          {/* Shipping Address Section */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold">Endereço de Entrega</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyAddress}
                className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-2 gap-1.5 rounded-md"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed font-medium space-y-1">
              <div className="font-bold text-slate-800 flex items-start gap-2">
                 <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                 <span>{order.street}, {order.number}</span>
              </div>
              <div className="pl-6">{order.neighborhood} {order.complement ? `- ${order.complement}` : ""}</div>
              <div className="pl-6">{order.city} - {order.state}</div>
              <div className="pl-6 font-mono text-slate-500 mt-1">CEP: {order.cep}</div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm space-y-3">
             <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold">Pagamento</h3>
             <div className="space-y-2.5 text-sm font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Pagamento</span>
                  <span className="text-slate-800 font-bold">
                    {order.paymentStatus === "PAID" 
                      ? (order.paymentType?.toLowerCase() === "online" ? "Online" : "Na Entrega") 
                      : (order.paymentMethod?.toLowerCase() === "pix" ? "Online" : "Na Entrega")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 items-center">
                  <span>Forma de pagamento</span>
                  <span className="font-bold text-slate-800">{paymentLabels[order.paymentMethod] || order.paymentMethod || "-"}</span>
                </div>
                {order.pixKey && (
                  <div className="flex flex-col gap-1 text-slate-500 pt-2 border-t border-slate-100">
                    <span>Chave PIX</span>
                    <span className="text-slate-800 font-mono text-xs break-all bg-slate-50 p-2 rounded border border-slate-100">{order.pixKey}</span>
                  </div>
                )}
             </div>
          </div>

          {/* Financial values summary calculations */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm space-y-3 text-sm font-medium">
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold">Resumo Financeiro</h3>
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between text-slate-500">
                <span>Total dos itens ({order.items.length})</span>
                <span>R$ {order.itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Frete</span>
                <span>R$ {order.freight.toFixed(2)}</span>
              </div>
              {order.couponDiscount ? (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto Cupom</span>
                  <span>-R$ {order.couponDiscount.toFixed(2)}</span>
                </div>
              ) : null}
              {order.couponFreightDiscount ? (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto Frete (Cupom)</span>
                  <span>-R$ {order.couponFreightDiscount.toFixed(2)}</span>
                </div>
              ) : null}
              {order.paymentDiscount ? (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto Pagamento</span>
                  <span>-R$ {order.paymentDiscount.toFixed(2)}</span>
                </div>
              ) : null}
              {order.receiptDiscount ? (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto Recebimento</span>
                  <span>-R$ {order.receiptDiscount.toFixed(2)}</span>
                </div>
              ) : null}

              
              {order.installmentSurcharge ? (
                <div className="flex justify-between text-slate-500">
                  <span>Acréscimo Parcelamento</span>
                  <span>+R$ {order.installmentSurcharge.toFixed(2)}</span>
                </div>
              ) : null}
              {order.receiptSurcharge ? (
                <div className="flex justify-between text-slate-500">
                  <span>Acréscimo Recebimento</span>
                  <span>+R$ {order.receiptSurcharge.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-3 text-base">
                <span>Total do pedido</span>
                <span>R$ {order.totalOrder.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          {order.status !== "CANCELLED" && order.status !== "COMPLETED" ? (
             <div className="pt-2">
              <Button 
                variant="destructive"
                className="w-full h-11 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl transition-all shadow-md hover:shadow-rose-100"
                disabled={cancelMutation.isPending}
                onClick={handleCancelOrder}
              >
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <span>Cancelar Pedido</span>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
