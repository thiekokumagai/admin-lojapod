import { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldX,
  WalletCards,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { billingService, BillingOverview, BillingStatus, BillingSubscription } from '@/services/billing.service';

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

export default function SuperAdminBillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [items, setItems] = useState<BillingSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string>();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, subscriptions] = await Promise.all([
        billingService.overview(),
        billingService.subscriptions(),
      ]);
      setOverview(summary);
      setItems(subscriptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar cobranças');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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

  const totalStoresCount = items.length || 1;
  const activeCount = overview?.statuses.ACTIVE || 0;
  const trialingCount = overview?.statuses.TRIALING || 0;
  const pastDueCount = overview?.statuses.PAST_DUE || 0;
  const suspendedCount = overview?.statuses.SUSPENDED || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <DollarSign className="h-4 w-4" />
            Gestão Financeira & SaaS Metrics
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assinaturas e Faturamento</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Métricas de MRR, saúde da base de assinantes e sincronização de cobranças via Cakto.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm font-medium flex items-center gap-3 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {overview && !overview.providerConfigured && (
        <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-xl p-4 text-sm font-medium flex items-center gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <span>As credenciais de API da Cakto ainda não foram configuradas no servidor de produção (`.env`).</span>
        </div>
      )}

      {/* Mapeamento de Métricas Principais (MRR, ARR, Total Recebido, Lojas Ativas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card MRR */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">MRR (Receita Mensal)</span>
            <div className="p-2 bg-indigo-700/50 rounded-lg text-indigo-200">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black mt-3 tracking-tight">{formatCurrency(mrr)}</div>
          <div className="flex items-center gap-2 text-xs text-indigo-200 mt-2">
            <span className="font-medium">ARR Estimado: {formatCurrency(arr)}</span>
          </div>
        </div>

        {/* Card Faturamento Total Registrado */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Acumulado</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {formatCurrency(overview?.paidAmount || 0)}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {overview?.paidCount || 0} transações confirmadas via Cakto
          </p>
        </div>

        {/* Card Lojas Ativas vs Inativas */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Assinaturas Ativas</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{activeCount}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{((activeCount / totalStoresCount) * 100).toFixed(0)}% da base ativa</span>
            <span className="text-blue-600 font-semibold">• {trialingCount} em teste</span>
          </div>
        </div>

        {/* Card Alerta de Inadimplência */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Atrasadas / Suspensas</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{pastDueCount + suspendedCount}</div>
          <p className="text-xs text-slate-500 font-medium">
            <span className="text-amber-600 font-semibold">{pastDueCount} em carência</span> |{' '}
            <span className="text-red-600 font-semibold">{suspendedCount} suspensas</span>
          </p>
        </div>
      </div>

      {/* Tabela de Assinaturas e Ações */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden space-y-4">
        {/* Header e Filtros */}
        <div className="p-5 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lista de Lojas & Status de Cobrança</h2>
            <p className="text-xs text-slate-500">Gerencie a ativação, suspensão e reativação de cada loja.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Input de Busca */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por loja ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            {/* Selector de Status */}
            <div className="relative flex items-center">
              <Filter className="h-3.5 w-3.5 absolute left-3 text-slate-400 pointer-events-none" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 appearance-none cursor-pointer"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Ativas</option>
                <option value="TRIALING">Em Teste (Trial)</option>
                <option value="PAST_DUE">Em Atraso</option>
                <option value="SUSPENDED">Suspensas</option>
                <option value="CANCELED">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Carregando faturamento...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhuma assinatura encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Loja / Admin</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Plano / Valor</th>
                  <th className="py-3 px-4">Método de Pagamento</th>
                  <th className="py-3 px-4">Vencimento / Trial</th>
                  <th className="py-3 px-5 text-right">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{item.store.title}</div>
                      <div className="text-xs text-slate-500">{item.store.adminEmail}</div>
                      <div className="text-[11px] font-mono text-indigo-600 mt-0.5">
                        {item.store.subdomain}.lojapod.com
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge[item.status]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {labels[item.status]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(Number(item.monthlyFee) || 150)}/mês
                      </div>
                      {item.supportSelected && (
                        <span className="inline-block mt-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          Implantação ERP Ativa
                        </span>
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
                      {item.status === 'PAST_DUE' && item.gracePeriodEndsAt ? (
                        <div className="text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          Suspende em {formatDateUTC(item.gracePeriodEndsAt)}
                        </div>
                      ) : item.trialEndsAt && item.status === 'TRIALING' ? (
                        <div className="text-blue-700 font-medium">
                          Trial até {formatDateUTC(item.trialEndsAt)}
                        </div>
                      ) : item.currentPeriodEndsAt ? (
                        <div className="text-slate-600">
                          Renova em {formatDateUTC(item.currentPeriodEndsAt)}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
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
    </div>
  );
}
