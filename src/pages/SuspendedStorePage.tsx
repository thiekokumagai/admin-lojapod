import { useEffect, useState } from "react";
import { AlertCircle, CreditCard, Loader2, LogOut, Sparkles, Tag, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/services/api";
import { logout } from "@/services/auth.service";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  checkoutType: 'SINGLE_PRODUCT' | 'RECURRING_SUBSCRIPTION';
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function SuspendedStorePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const checkStatus = async () => {
    try {
      const subRes = await apiFetch("/billing/my-subscription");
      const subData = await subRes.json();
      if (subData?.subscription?.status === 'ACTIVE' || subData?.subscription?.store?.isActive) {
        setPaymentSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
        return true;
      }
    } catch {
      // silencioso
    }
    return false;
  };

  useEffect(() => {
    async function loadPlans() {
      setLoading(true);
      setError(null);
      try {
        const isPaid = await checkStatus();
        if (isPaid) return;

        const subRes = await apiFetch("/billing/my-subscription");
        const subData = await subRes.json();

        if (subData?.subscription?.plan) {
          // Se a loja tem um plano vinculado especificamente pelo Super Admin, mostra APENAS ele!
          setPlans([subData.subscription.plan]);
        } else {
          // Se não tem plano vinculado prévio, lista os planos públicos disponíveis
          const plansRes = await apiFetch("/billing/plans");
          const plansData = await plansRes.json();
          setPlans(plansData || []);
        }
      } catch (err) {
        console.error("Erro ao carregar opções de pagamento", err);
        setError("Não foi possível carregar os planos no momento.");
      } finally {
        setLoading(false);
      }
    }
    void loadPlans();

    // Polling automático a cada 4 segundos para detectar quando o webhook da Cakto for recebido!
    const interval = setInterval(() => {
      void checkStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res = await apiFetch(`/billing/checkout?planId=${encodeURIComponent(planId)}`);
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("Link de pagamento não disponível.");
      }
    } catch (err) {
      setError("Erro ao gerar link de pagamento. Tente novamente.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center space-y-4">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pagamento Confirmado!</h1>
          <p className="text-sm text-slate-600">
            Sua assinatura foi reativada com sucesso. Redirecionando para o seu painel de gestão...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100 space-y-0">
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
          <div className="bg-red-100 p-3.5 rounded-full mb-3">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-red-900">Período de Teste Concluído</h1>
          <p className="text-sm text-red-700 mt-1.5 max-w-sm">
            Sua loja precisa de um plano ativo para continuar vendendo e acessando o painel de gestão.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-xs text-center text-slate-500 font-medium">
            Escolha um dos planos abaixo para reativar sua loja instantaneamente:
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200 text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Carregando planos disponíveis...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs text-center border border-amber-200 font-medium">
              Nenhum plano ativo encontrado. Por favor, contate o suporte.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    plan.checkoutType === 'SINGLE_PRODUCT'
                      ? 'border-indigo-200 bg-indigo-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                        {plan.checkoutType === 'SINGLE_PRODUCT' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-indigo-600" /> Recomendado
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-slate-900">
                        {formatCurrency(Number(plan.price))}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {plan.checkoutType === 'SINGLE_PRODUCT' ? 'taxa única + 1ª mensalidade' : '/mês'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        + R$ 0,99 taxa de serviço
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => void handleCheckout(plan.id)}
                    disabled={checkoutLoading === plan.id}
                    className={`w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50 ${
                      plan.checkoutType === 'SINGLE_PRODUCT'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {checkoutLoading === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pagar {plan.name}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 text-center">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-slate-700 text-xs w-full font-medium"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
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
