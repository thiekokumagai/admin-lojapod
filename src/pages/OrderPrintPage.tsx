import { useParams } from "react-router-dom";
import { useOrderDetails } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OrderPrintPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrderDetails(id ?? "");
  const { data: settings } = useSettings();

  useEffect(() => {
    if (order && settings) {
      setTimeout(() => {
        window.print();
      }, 500);

      const handleAfterPrint = () => {
        window.close();
      };
      
      window.addEventListener("afterprint", handleAfterPrint);
      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [order, settings]);

  if (isLoading || !order) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", " -");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const discountAmount = (order.couponDiscount || 0) + (order.receiptDiscount || 0) + (order.paymentDiscount || 0);
  const surchargeAmount = (order.installmentSurcharge || 0) + (order.receiptSurcharge || 0);
  
  const finalTotal = order.totalOrder || (order.itemsTotal + order.freight - discountAmount + surchargeAmount);
  const finalReceived = order.totalReceived || finalTotal;

  return (
    <div className="p-4 sm:p-8 max-w-[80mm] mx-auto text-black bg-white min-h-screen text-[12px] print:p-0 print:m-0 print:w-full print:max-w-none" style={{ fontFamily: "monospace" }}>
      <div className="text-center mb-6">
        <h1 className="font-bold text-base">{settings?.storeName || "Pod & Mais"}</h1>
        <p className="text-xs">{(settings?.storeName || "podemais").toLowerCase().replace(/ /g, "")}.store</p>
      </div>

      <div className="mb-4 space-y-3">
        <h2 className="font-bold text-sm">Pedido #{order.orderNumber}</h2>
        
        <div>
          <p>{formattedDate}</p>
          <p className="font-bold mt-1">{order.customerName}</p>
          <p className="mt-2">Contato: <span className="font-bold">{order.customerPhone}</span></p>
        </div>
      </div>

      <div className="mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between mb-1 w-full gap-2 overflow-hidden">
            <span className="shrink-0">{item.quantity}x</span>
            <span className="shrink-0">{item.productName} {item.variation ? `(${item.variation})` : ''}</span>
            <span className="grow border-b border-dotted border-black relative top-[-4px] mx-1"></span>
            <span className="shrink-0">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1 w-full gap-2 overflow-hidden">
          <span className="shrink-0">Total dos itens ({order.items.length})</span>
          <span className="grow border-b border-dotted border-black relative top-[-4px] mx-1"></span>
          <span className="shrink-0 font-bold">{formatCurrency(order.itemsTotal)}</span>
        </div>
        <div className="flex justify-between mb-1 w-full gap-2 overflow-hidden">
          <span className="shrink-0">Frete</span>
          <span className="grow border-b border-dotted border-black relative top-[-4px] mx-1"></span>
          <span className="shrink-0 font-bold">{formatCurrency(order.freight)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between mb-1 w-full gap-2 overflow-hidden">
            <span className="shrink-0">Desconto</span>
            <span className="grow border-b border-dotted border-black relative top-[-4px] mx-1"></span>
            <span className="shrink-0 font-bold">- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        {surchargeAmount > 0 && (
          <div className="flex justify-between mb-1 w-full gap-2 overflow-hidden">
            <span className="shrink-0">Acréscimo</span>
            <span className="grow border-b border-dotted border-black relative top-[-4px] mx-1"></span>
            <span className="shrink-0 font-bold">{formatCurrency(surchargeAmount)}</span>
          </div>
        )}
        <div className="flex justify-between mb-1 w-full gap-2 overflow-hidden mt-2">
          <span className="shrink-0">Total pedido</span>
          <span className="grow border-b border-dotted border-black relative top-[-4px] mx-1"></span>
          <span className="shrink-0 font-bold">{formatCurrency(finalTotal)}</span>
        </div>
        <div className="flex justify-between mb-1 w-full gap-2 overflow-hidden">
          <span className="shrink-0">Total Recebido</span>
          <span className="grow border-b border-dotted border-black relative top-[-4px] mx-1"></span>
          <span className="shrink-0 font-bold">{formatCurrency(finalReceived)}</span>
        </div>
      </div>

      <div className="mb-4">
        <p>Pagamento: <span className="font-bold">{order.paymentType}</span></p>
        <p>Forma de pagamento: <span className="font-bold">{
          order.paymentMethod === 'pix' ? 'Pix' :
          order.paymentMethod === 'credito' ? 'Cartão de Crédito' :
          order.paymentMethod === 'debito' ? 'Cartão de Débito' :
          order.paymentMethod === 'dinheiro' ? 'Dinheiro' :
          order.paymentMethod
        }</span></p>
        {order.pixKey && (order.paymentMethod === "PIX" || order.paymentMethod === "pix") && (
          <p>Chave PIX: <span className="font-bold">{order.pixKey}</span></p>
        )}
      </div>

      <div>
        <p className="font-bold mb-1">Para entregar:</p>
        <p>{order.street}, {order.number}</p>
        <p>{order.neighborhood}</p>
        <p>{order.city} - {order.state}</p>
        <p>CEP: {order.cep}</p>
        {order.complement && <p>Complemento: {order.complement}</p>}
      </div>
    </div>
  );
}
