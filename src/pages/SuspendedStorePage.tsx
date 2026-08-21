import { useEffect, useState } from "react";
import { AlertCircle, CreditCard, Loader2, LogOut } from "lucide-react";
import { apiFetch } from "@/services/api";
import { logout } from "@/services/auth.service";
import { Button } from "@/components/ui/button";

export default function SuspendedStorePage() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/billing/checkout")
      .then((res) => res.json())
      .then((data) => {
        setCheckoutUrl(data.checkoutUrl);
      })
      .catch((err) => {
        console.error("Erro ao buscar link de pagamento", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-900">Loja Inativa</h1>
          <p className="text-red-700 mt-2">
            Sua assinatura encontra-se com pagamento pendente ou período de testes encerrado.
          </p>
        </div>

        <div className="p-8 text-center space-y-6">
          <p className="text-slate-600">
            Para reativar sua loja e voltar a vender, realize o pagamento da sua assinatura. A liberação ocorre assim que o pagamento for aprovado.
          </p>

          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : checkoutUrl ? (
            <a
              href={checkoutUrl}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Pagar Assinatura Agora
            </a>
          ) : (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
              O link de pagamento ainda não está disponível. Por favor, contate o suporte.
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-slate-700 w-full"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
