import { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  Clock,
  Edit,
  X,
} from 'lucide-react';
import { billingService, BillingOverview, BillingStatus, BillingSubscription, BillingPlan } from '@/services/billing.service';

const labels: Record<BillingStatus, string> = {
  TRIALING: 'Em teste',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  SUSPENDED: 'Suspensa',
  CANCELED: 'Cancelada',
};

const badge: Record<BillingStatus, string> = {
  TRIALING: 'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAST_DUE: 'bg-amber-50 text-amber-800 border-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  CANCELED: 'bg-slate-100 text-slate-600 border-slate-200',
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDateUTC(dateStr?: string | Date | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function toInputDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export default function SuperAdminBillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [items, setItems] = useState<BillingSubscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal de edição
  const [editingSub, setEditingSub] = useState<BillingSubscription | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'TRIALING' as BillingStatus,
    monthlyFee: 150,
    planId: '',
    trialEndsAt: '',
    currentPeriodEndsAt: '',
    paymentMethod: 'CREDIT_CARD' as 'CREDIT_CARD' | 'PIX_AUTO' | 'UNKNOWN',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, subscriptions, plans] = await Promise.all([
        billingService.overview(),
        billingService.subscriptions(),
        billingService.getAdminPlans(),
      ]);
      setOverview(summary);
      setItems(subscriptions);
      setAvailablePlans(plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar cobranças');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEditModal = (item: BillingSubscription) => {
    setEditingSub(item);
    setEditForm({
      status: item.status,
      monthlyFee: Number(item.monthlyFee) || 150,
      planId: item.planId || '',
      trialEndsAt: toInputDate(item.trialEndsAt),
      currentPeriodEndsAt: toInputDate(item.currentPeriodEndsAt),
      paymentMethod: item.paymentMethod || 'UNKNOWN',
    });
  };

  const handleSaveSubscription = async () => {
    if (!editingSub) return;
    setSaving(true);
    setError('');
    try {
      await billingService.updateSubscription(editingSub.storeId, {
        status: editForm.status,
        monthlyFee: editForm.monthlyFee,
        planId: editForm.planId || null,
        trialEndsAt: editForm.trialEndsAt ? `${editForm.trialEndsAt}T12:00:00.000Z` : null,
        currentPeriodEndsAt: editForm.currentPeriodEndsAt ? `${editForm.currentPeriodEndsAt}T12:00:00.000Z` : null,
        paymentMethod: editForm.paymentMethod,
      });
      setEditingSub(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar assinatura');
    } finally {
      setSaving(false);
    }
  };

  const act = async (item: BillingSubscription, action: 'SUSPEND' | 'REACTIVATE' | 'CANCEL') => {
    const defaultReason = action === 'SUSPEND'
      ? 'Suspenso pelo Super Admin'
      : action === 'REACTIVATE'
      ? 'Reativado pelo Super Admin'
      : 'Cancelado pelo Super Admin';

    setWorking(item.storeId);
    setError('');
    try {
      await billingService.action(item.storeId, action, defaultReason);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível executar a ação');
    } finally {
      setWorking(undefined);
    }
  };

  // Cálculos Financeiros (MRR, ARR)
  const mrr = useMemo(() => {
    return items
      .filter((i) => i.status === 'ACTIVE' || i.store.isActive)
      .reduce((sum, item) => sum + (Number(item.monthlyFee) || 150), 0);
  }, [items]);

  const arr = mrr * 12;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.store.title.toLowerCase().includes(search.toLowerCase()) ||
        item.store.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
        item.store.subdomain.toLowerCase().includes(search.toLowerCase());

      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [items, search, selectedStatus]);

  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const trialingCount = items.filter((i) => i.status === 'TRIALING').length;
  const pastDueCount = items.filter((i) => i.status === 'PAST_DUE').length;
  const suspendedCount = items.filter((i) => i.status === 'SUSPENDED').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header com Atualizar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <DollarSign className="h-4 w-4" />
            Super Admin ➔ Faturamento Global
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestão de Assinaturas & Lojas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe o faturamento mensal (MRR), altere planos e gerencie reativação e suspensão de lojas.
          </p>
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Cards Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>MRR (Receita Mensal)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{formatCurrency(mrr)}</div>
          <p className="text-xs text-emerald-600 font-medium">Lojas ativas gerando mensalidade</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>ARR (Receita Anual)</span>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{formatCurrency(arr)}</div>
          <p className="text-xs text-indigo-600 font-medium">Projeção anual de faturamento</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Lojas Ativas / Teste</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{activeCount + trialingCount}</div>
          <p className="text-xs text-slate-500 font-medium">
            <span className="text-emerald-600 font-semibold">{activeCount} ativas</span> |{' '}
            <span className="text-blue-600 font-semibold">{trialingCount} em teste</span>
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Pendentes / Suspensas</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{pastDueCount + suspendedCount}</div>
          <p className="text-xs text-slate-500 font-medium">
            <span className="text-amber-600 font-semibold">{pastDueCount} em carência</span> |{' '}
            <span className="text-red-600 font-semibold">{suspendedCount} suspensas</span>
          </p>
        </div>
      </div>

      {/* Tabela de Assinaturas */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lista de Lojas & Status</h2>
            <p className="text-xs text-slate-500">Gerencie a ativação, suspensão e reativação de cada loja.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por loja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativas</option>
              <option value="TRIALING">Em Teste</option>
              <option value="PAST_DUE">Em Atraso</option>
              <option value="SUSPENDED">Suspensas</option>
              <option value="CANCELED">Canceladas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Carregando faturamento...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Loja / Admin</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Plano / Valor</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{item.store.title}</div>
                      <div className="text-xs text-slate-500">{item.store.adminEmail}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge[item.status]}`}>
                        {labels[item.status]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(Number(item.monthlyFee) || 150)}/mês
                      </div>
                      {item.plan?.name && (
                        <div className="text-[11px] text-slate-500 font-medium">{item.plan.name}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        {item.paymentMethod === 'PIX_AUTO'
                          ? 'Pix Automático'
                          : item.paymentMethod === 'CREDIT_CARD'
                          ? 'Cartão de Crédito'
                          : 'Aguardando'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      {formatDateUTC(item.currentPeriodEndsAt || item.trialEndsAt)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5 text-slate-500" />
                          Editar
                        </button>
                        {item.status !== 'SUSPENDED' && (
                          <button
                            disabled={working === item.storeId}
                            onClick={() => void act(item, 'SUSPEND')}
                            className="border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            Suspender
                          </button>
                        )}
                        {item.status !== 'ACTIVE' && (
                          <button
                            disabled={working === item.storeId}
                            onClick={() => void act(item, 'REACTIVATE')}
                            className="border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Editar Assinatura</h3>
                <p className="text-xs text-slate-500">{editingSub.store.title}</p>
              </div>
              <button onClick={() => setEditingSub(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status da Assinatura</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as BillingStatus }))}
                  className="w-full px-3 py-2 border rounded-xl bg-white font-semibold text-slate-800"
                >
                  <option value="TRIALING">Em Teste (TRIALING)</option>
                  <option value="ACTIVE">Ativa (ACTIVE)</option>
                  <option value="PAST_DUE">Em Atraso (PAST_DUE)</option>
                  <option value="SUSPENDED">Suspensa (SUSPENDED)</option>
                  <option value="CANCELED">Cancelada (CANCELED)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plano Vinculado</label>
                <select
                  value={editForm.planId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const selected = availablePlans.find((p) => p.id === pId);
                    setEditForm((prev) => ({ ...prev, planId: pId, monthlyFee: selected ? Number(selected.price) : prev.monthlyFee }));
                  }}
                  className="w-full px-3 py-2 border rounded-xl bg-white font-semibold text-slate-800"
                >
                  <option value="">Sem plano específico</option>
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}/mês</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor da Mensalidade (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.monthlyFee}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, monthlyFee: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Método de Pagamento</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-xl bg-white font-semibold text-slate-800"
                >
                  <option value="UNKNOWN">Aguardando Pagamento (UNKNOWN)</option>
                  <option value="CREDIT_CARD">Cartão de Crédito (CREDIT_CARD)</option>
                  <option value="PIX_AUTO">Pix Automático (PIX_AUTO)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Fim do Trial</label>
                  <input type="date" value={editForm.trialEndsAt} onChange={(e) => setEditForm((prev) => ({ ...prev, trialEndsAt: e.target.value }))} className="w-full px-3 py-2 border rounded-xl font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Próxima Renovação</label>
                  <input type="date" value={editForm.currentPeriodEndsAt} onChange={(e) => setEditForm((prev) => ({ ...prev, currentPeriodEndsAt: e.target.value }))} className="w-full px-3 py-2 border rounded-xl font-medium" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setEditingSub(null)} className="px-4 py-2 border text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition">Cancelar</button>
              <button disabled={saving} onClick={() => void handleSaveSubscription()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
