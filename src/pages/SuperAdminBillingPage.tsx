import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, RefreshCw, ShieldX, WalletCards, Plus, Edit2, X } from 'lucide-react';
import { billingService, BillingOverview, BillingStatus, BillingSubscription } from '@/services/billing.service';
import { storesService, Store } from '@/services/stores.service';

const labels: Record<BillingStatus, string> = {
  TRIALING: 'Em teste', ACTIVE: 'Ativa', PAST_DUE: 'Em atraso', SUSPENDED: 'Suspensa', CANCELED: 'Cancelada',
};
const badge: Record<BillingStatus, string> = {
  TRIALING: 'bg-blue-100 text-blue-700', ACTIVE: 'bg-emerald-100 text-emerald-700', PAST_DUE: 'bg-amber-100 text-amber-800', SUSPENDED: 'bg-red-100 text-red-700', CANCELED: 'bg-slate-100 text-slate-600',
};

export default function SuperAdminBillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [items, setItems] = useState<BillingSubscription[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string>();
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Partial<BillingSubscription> | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [summary, subscriptions, storesList] = await Promise.all([
        billingService.overview(), 
        billingService.subscriptions(),
        storesService.getStores()
      ]);
      setOverview(summary); 
      setItems(subscriptions);
      setStores(storesList);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar cobranças'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const handleSaveModal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSub?.storeId) return;
    setWorking('modal'); setError('');
    try {
      await billingService.editSubscription(editingSub.storeId, {
        status: editingSub.status,
        monthlyFee: editingSub.monthlyFee,
        trialEndsAt: editingSub.trialEndsAt,
        currentPeriodEndsAt: editingSub.currentPeriodEndsAt,
        gracePeriodEndsAt: editingSub.gracePeriodEndsAt,
      });
      setIsModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar assinatura');
    } finally {
      setWorking(undefined);
    }
  };

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
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
      <div className="flex gap-2">
        <button onClick={() => {
          setEditingSub({ status: 'TRIALING', monthlyFee: '150', storeId: '' });
          setIsModalOpen(true);
        }} className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Nova Assinatura
        </button>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </div>
    </div>
    
    {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
    {overview && !overview.providerConfigured && <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-3 text-sm">Credenciais da Cakto ainda não configuradas no servidor.</div>}
    
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(([title, value, Icon, color]) => 
        <div key={title} className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between text-sm text-slate-500"><span>{title}</span><Icon className={`h-5 w-5 ${color}`} /></div>
          <div className="text-3xl font-bold mt-2">{value}</div>
        </div>
      )}
    </div>

    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {loading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Loja</th><th className="text-left p-3">Situação</th><th className="text-left p-3">Pagamento</th><th className="text-left p-3">Trial/Carência</th><th className="text-right p-3">Ações</th></tr></thead><tbody className="divide-y">{items.map(item => <tr key={item.id}><td className="p-3"><div className="font-semibold">{item.store?.title}</div><div className="text-xs text-slate-500">{item.store?.adminEmail}</div></td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${badge[item.status]}`}>{labels[item.status]}</span></td><td className="p-3"><div className="inline-flex items-center gap-1"><CreditCard className="h-4 w-4" />{item.paymentMethod === 'PIX_AUTO' ? 'Pix Automático' : item.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'Não definido'}</div><div className="text-xs text-slate-500">R$ {Number(item.monthlyFee).toFixed(2).replace('.', ',')}/mês</div></td><td className="p-3 text-xs text-slate-600">{item.status === 'PAST_DUE' && item.gracePeriodEndsAt ? `Suspende em ${new Date(item.gracePeriodEndsAt).toLocaleString('pt-BR')}` : item.trialEndsAt ? `Trial até ${new Date(item.trialEndsAt).toLocaleDateString('pt-BR')}` : '—'}</td><td className="p-3"><div className="flex justify-end gap-2"><button disabled={working === item.storeId} onClick={() => { setEditingSub(item); setIsModalOpen(true); }} className="border rounded px-2 py-1 hover:bg-slate-50 inline-flex items-center gap-1"><Edit2 className="h-3 w-3" /> Editar</button></div></td></tr>)}</tbody></table></div>}
    </div>

    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveModal} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingSub?.id ? 'Editar Assinatura' : 'Nova Assinatura'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loja</label>
                <select 
                  required 
                  disabled={!!editingSub?.id} 
                  className="w-full border rounded-lg p-2"
                  value={editingSub?.storeId || ''}
                  onChange={e => setEditingSub(prev => ({ ...prev, storeId: e.target.value }))}
                >
                  <option value="">Selecione uma loja</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.title} ({s.subdomain})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  required 
                  className="w-full border rounded-lg p-2"
                  value={editingSub?.status || 'TRIALING'}
                  onChange={e => setEditingSub(prev => ({ ...prev, status: e.target.value as BillingStatus }))}
                >
                  <option value="TRIALING">Em teste (TRIALING)</option>
                  <option value="ACTIVE">Ativa (ACTIVE)</option>
                  <option value="PAST_DUE">Em atraso (PAST_DUE)</option>
                  <option value="SUSPENDED">Suspensa (SUSPENDED)</option>
                  <option value="CANCELED">Cancelada (CANCELED)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mensalidade (R$)</label>
                <input 
                  type="number" step="0.01" required 
                  className="w-full border rounded-lg p-2"
                  value={editingSub?.monthlyFee || ''}
                  onChange={e => setEditingSub(prev => ({ ...prev, monthlyFee: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fim do Trial</label>
                <input 
                  type="datetime-local" 
                  className="w-full border rounded-lg p-2"
                  value={formatDateForInput(editingSub?.trialEndsAt)}
                  onChange={e => setEditingSub(prev => ({ ...prev, trialEndsAt: e.target.value || undefined }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fim do Período Atual (Vencimento)</label>
                <input 
                  type="datetime-local" 
                  className="w-full border rounded-lg p-2"
                  value={formatDateForInput(editingSub?.currentPeriodEndsAt)}
                  onChange={e => setEditingSub(prev => ({ ...prev, currentPeriodEndsAt: e.target.value || undefined }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fim da Carência (Suspensão)</label>
                <input 
                  type="datetime-local" 
                  className="w-full border rounded-lg p-2"
                  value={formatDateForInput(editingSub?.gracePeriodEndsAt)}
                  onChange={e => setEditingSub(prev => ({ ...prev, gracePeriodEndsAt: e.target.value || undefined }))}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={working === 'modal'} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {working === 'modal' ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>;
}
