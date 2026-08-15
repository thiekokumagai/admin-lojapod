import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { Receipt, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/stores/me');
      if (!res.ok) throw new Error('Falha ao carregar dados da loja');
      const data = await res.json();
      setStore(data);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setGenerating(true);
      setError('');
      // Obtém a fatura atual (ou cria nova) com o link do checkout
      const res = await apiFetch('/subscriptions/current-invoice');
      if (!res.ok) {
        throw new Error('Não foi possível gerar a fatura. Tente novamente mais tarde.');
      }
      
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Link de pagamento não retornado pela integradora.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar pagamento');
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          <p className="font-semibold flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Erro</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const expirationDate = store.subscriptionExpiresAt ? new Date(store.subscriptionExpiresAt) : null;
  const isExpired = expirationDate ? expirationDate < new Date() : false;
  const hasSubscription = store.monthlyFee > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-700">
          <Receipt className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faturamento e Assinatura</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie a mensalidade e veja o status da sua assinatura.</p>
        </div>
      </div>

      {!hasSubscription ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-700">Plano Vitalício ou Isento</h2>
          <p className="text-slate-500 mt-2">Sua loja não possui uma mensalidade configurada para pagamento recorrente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-semibold text-slate-700">Plano Atual</h2>
                {isExpired ? (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Vencido
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ativo
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Valor da Mensalidade</p>
                  <p className="text-3xl font-bold text-slate-900">
                    R$ {Number(store.monthlyFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {expirationDate && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Próximo Vencimento</p>
                    <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>
                      {expirationDate.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handlePayNow}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition disabled:opacity-70"
              >
                {generating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Pagar Agora (PIX)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-3">
                Pagamento processado de forma segura via InfinitePay.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border rounded-2xl p-6 flex flex-col justify-center">
            <h3 className="font-semibold text-slate-800 mb-3">Informações Importantes</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>O pagamento é reconhecido instantaneamente após a conclusão do PIX.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>Pagar antecipadamente apenas adiciona mais 1 mês à data de vencimento atual, você não perde nenhum dia que já pagou.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                <span>Se a loja for bloqueada por falta de pagamento, o acesso retorna no momento em que a fatura constar como paga.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
