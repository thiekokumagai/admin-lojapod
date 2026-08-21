import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, RefreshCw, ShieldX, WalletCards } from 'lucide-react';
import { billingService, BillingOverview, BillingStatus, BillingSubscription } from '@/services/billing.service';

const labels: Record<BillingStatus, string> = {
  TRIALING: 'Em teste', ACTIVE: 'Ativa', PAST_DUE: 'Em atraso', SUSPENDED: 'Suspensa', CANCELED: 'Cancelada',
};
const badge: Record<BillingStatus, string> = {
  TRIALING: 'bg-blue-100 text-blue-700', ACTIVE: 'bg-emerald-100 text-emerald-700', PAST_DUE: 'bg-amber-100 text-amber-800', SUSPENDED: 'bg-red-100 text-red-700', CANCELED: 'bg-slate-100 text-slate-600',
};

export default function SuperAdminBillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [items, setItems] = useState<BillingSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string>();
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [summary, subscriptions] = await Promise.all([billingService.overview(), billingService.subscriptions()]);
      setOverview(summary); setItems(subscriptions);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar cobranças'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const act = async (item: BillingSubscription, action: 'SUSPEND' | 'REACTIVATE' | 'CANCEL') => {
    const reason = window.prompt('Informe o motivo desta ação administrativa:');
    if (!reason?.trim()) return;
    setWorking(item.storeId); setError('');
    try { await billingService.action(item.storeId, action, reason.trim()); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível executar a ação'); }
    finally { setWorking(undefined); }
  };

  const cards = [
    ['Ativas', overview?.statuses.ACTIVE || 0, CheckCircle2, 'text-emerald-600'],
    ['Em trial', overview?.statuses.TRIALING || 0, WalletCards, 'text-blue-600'],
    ['Em atraso', overview?.statuses.PAST_DUE || 0, AlertTriangle, 'text-amber-600'],
    ['Suspensas', overview?.statuses.SUSPENDED || 0, ShieldX, 'text-red-600'],
  ] as const;

  return <div className="p-6 max-w-7xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-slate-900">Assinaturas e cobrança</h1><p className="text-sm text-slate-500">Controle central da Cakto e do acesso das lojas.</p></div>
      <button onClick={() => void load()} className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button>
    </div>
    {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
    {overview && !overview.providerConfigured && <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-3 text-sm">Credenciais da Cakto ainda não configuradas no servidor.</div>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([title, value, Icon, color]) => <div key={title} className="bg-white border rounded-xl p-5 shadow-sm"><div className="flex justify-between text-sm text-slate-500"><span>{title}</span><Icon className={`h-5 w-5 ${color}`} /></div><div className="text-3xl font-bold mt-2">{value}</div></div>)}</div>
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {loading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Loja</th><th className="text-left p-3">Situação</th><th className="text-left p-3">Pagamento</th><th className="text-left p-3">Trial/Carência</th><th className="text-right p-3">Ações</th></tr></thead><tbody className="divide-y">{items.map(item => <tr key={item.id}><td className="p-3"><div className="font-semibold">{item.store.title}</div><div className="text-xs text-slate-500">{item.store.adminEmail}</div></td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${badge[item.status]}`}>{labels[item.status]}</span></td><td className="p-3"><div className="inline-flex items-center gap-1"><CreditCard className="h-4 w-4" />{item.paymentMethod === 'PIX_AUTO' ? 'Pix Automático' : item.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'Não definido'}</div><div className="text-xs text-slate-500">R$ {Number(item.monthlyFee).toFixed(2).replace('.', ',')}/mês</div></td><td className="p-3 text-xs text-slate-600">{item.status === 'PAST_DUE' && item.gracePeriodEndsAt ? `Suspende em ${new Date(item.gracePeriodEndsAt).toLocaleString('pt-BR')}` : item.trialEndsAt ? `Trial até ${new Date(item.trialEndsAt).toLocaleDateString('pt-BR')}` : '—'}</td><td className="p-3"><div className="flex justify-end gap-2">{item.status !== 'SUSPENDED' && <button disabled={working === item.storeId} onClick={() => void act(item, 'SUSPEND')} className="border border-red-200 text-red-700 rounded px-2 py-1 hover:bg-red-50">Suspender</button>}{item.status !== 'ACTIVE' && <button disabled={working === item.storeId} onClick={() => void act(item, 'REACTIVATE')} className="border border-emerald-200 text-emerald-700 rounded px-2 py-1 hover:bg-emerald-50">Reativar</button>}</div></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}
