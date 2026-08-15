import { useState, useEffect } from "react";
import { Loader2, QrCode, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function PaymentPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/subscriptions/current-invoice");
      const data = await res.json();
      setInvoice(data.invoice);

      if (data.invoice?.status === "PAID") {
        setIsPaid(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar fatura.");
    } finally {
      setLoading(false);
    }
  };

  // Polling para checar se já pagou
  useEffect(() => {
    if (isPaid || loading || !invoice) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch("/subscriptions/current-invoice");
        const data = await res.json();
        if (data.invoice?.status === "PAID") {
          setIsPaid(true);
          toast.success("Pagamento confirmado!");
          setTimeout(() => {
            window.location.href = "/"; // Volta pro dashboard
          }, 2000);
        }
      } catch (err) {
        // ignora
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isPaid, loading, invoice]);

  const handleCopy = () => {
    if (invoice?.pixCopiaECola) {
      navigator.clipboard.writeText(invoice.pixCopiaECola);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8 text-center space-y-6 relative">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Assinatura Pendente</h1>
          <p className="text-sm text-slate-500 font-medium">
            Seu acesso ao painel foi suspenso. Para reativar sua loja e o painel administrador, por favor efetue o pagamento da sua mensalidade.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-semibold text-slate-500">Gerando seu PIX...</p>
          </div>
        ) : isPaid ? (
          <div className="py-8 space-y-4 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-800">Pagamento Confirmado!</h2>
            <p className="text-sm text-slate-500">Redirecionando para o painel...</p>
          </div>
        ) : invoice ? (
          <div className="space-y-6 pt-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor da Mensalidade</p>
              <p className="text-3xl font-black text-slate-800">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount))}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600">Pague pelo Link de Checkout / PIX Copia e Cola:</p>
              
              {invoice.pixCopiaECola?.startsWith('http') ? (
                 <Button
                    onClick={() => window.open(invoice.pixCopiaECola, '_blank')}
                    className="w-full h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                  >
                   Ir para o Pagamento Segudo
                 </Button>
              ) : (
                <div className="relative">
                  <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs p-3 rounded-lg break-all pr-12 text-left h-24 overflow-y-auto">
                    {invoice.pixCopiaECola || "Gerando PIX..."}
                  </div>
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 hover:bg-white text-slate-600 shadow-sm border border-slate-200 bg-white"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-xs text-slate-400 font-medium">
              A liberação ocorre automaticamente logo após o pagamento. Não é necessário enviar comprovante.
            </p>
          </div>
        ) : (
          <div className="text-red-500 font-semibold py-8">
            Erro ao carregar os dados de pagamento. Tente recarregar a página.
          </div>
        )}
      </div>
    </div>
  );
}
