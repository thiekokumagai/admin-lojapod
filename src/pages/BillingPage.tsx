import { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/services/api';

interface CheckoutData {
  checkoutUrl: string | null;
  subscription?: { status: string; trialEndsAt?: string; currentPeriodEndsAt?: string; gracePeriodEndsAt?: string };
}

export default function BillingPage() {
  const [data, setData] = useState<CheckoutData>();
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/billing/checkout').then(r => r.json()).then(setData).catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar assinatura'));
  }, []);

  if (!data && !error) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return <div className="p-6 max-w-3xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold">Minha assinatura</h1><p className="text-sm text-slate-500">Gerencie o plano que mantém sua loja publicada.</p></div>
    {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-3">{error}</div>}
    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-start justify-between"><div><div className="text-sm text-slate-500">Plano Loja</div><div className="text-3xl font-bold">R$ 150<span className="text-base font-normal text-slate-500">/mês</span></div></div><ShieldCheck className="h-8 w-8 text-indigo-600" /></div>
      <ul className="text-sm text-slate-600 space-y-2"><li>• 7 dias grátis</li><li>• Cartão recorrente ou Pix Automático</li><li>• Suporte de instalação opcional por R$ 150, pagamento único</li><li>• Carência de 3 dias em caso de atraso</li></ul>
      {data?.subscription && (
        <div className="rounded-lg bg-slate-50 border p-4 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Situação atual:</span>
            <strong className="text-slate-900">{
              data.subscription.status === 'TRIALING' ? 'Em teste (Gratuito)' :
              data.subscription.status === 'ACTIVE' ? 'Ativa' :
              data.subscription.status === 'PAST_DUE' ? 'Em atraso' :
              data.subscription.status === 'SUSPENDED' ? 'Suspensa' :
              data.subscription.status === 'CANCELED' ? 'Cancelada' : data.subscription.status
            }</strong>
          </div>
          {data.subscription.status === 'TRIALING' && data.subscription.trialEndsAt && (
            <div className="flex items-center justify-between text-blue-700 bg-blue-50 p-2 rounded">
              <span>Seu período de teste acaba em:</span>
              <strong>{new Date(data.subscription.trialEndsAt).toLocaleDateString('pt-BR')}</strong>
            </div>
          )}
          {data.subscription.status === 'ACTIVE' && data.subscription.currentPeriodEndsAt && (
            <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 p-2 rounded">
              <span>Próximo vencimento:</span>
              <strong>{new Date(data.subscription.currentPeriodEndsAt).toLocaleDateString('pt-BR')}</strong>
            </div>
          )}
          {data.subscription.status === 'PAST_DUE' && data.subscription.gracePeriodEndsAt && (
            <div className="flex items-center justify-between text-amber-700 bg-amber-50 p-2 rounded">
              <span>Suspensão programada para:</span>
              <strong>{new Date(data.subscription.gracePeriodEndsAt).toLocaleString('pt-BR')}</strong>
            </div>
          )}
        </div>
      )}

      {data?.checkoutUrl && (() => {
        let showCheckout = true;
        if (data.subscription) {
          const s = data.subscription;
          const now = new Date().getTime();
          if (s.status === 'ACTIVE' && s.currentPeriodEndsAt) {
            const daysLeft = (new Date(s.currentPeriodEndsAt).getTime() - now) / (1000 * 60 * 60 * 24);
            if (daysLeft > 3) showCheckout = false;
          }
          if (s.status === 'TRIALING' && s.trialEndsAt) {
            const daysLeft = (new Date(s.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24);
            if (daysLeft > 3) showCheckout = false;
          }
        }
        return showCheckout ? (
          <a href={data.checkoutUrl} className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-3 font-semibold hover:bg-indigo-700">
            <CreditCard className="h-5 w-5" />Abrir pagamento seguro<ExternalLink className="h-4 w-4" />
          </a>
        ) : null;
      })()}
    </div>
  </div>;
}
