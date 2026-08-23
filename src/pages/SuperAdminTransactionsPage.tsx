import { useEffect, useState, useMemo } from 'react';
import {
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Receipt,
  Copy,
  Check,
} from 'lucide-react';
import { billingService } from '@/services/billing.service';

interface TransactionItem {
  id: string;
  storeId: string;
  providerPaymentId?: string;
  amount: number;
  kind: string;
  method: 'CREDIT_CARD' | 'PIX_AUTO' | 'UNKNOWN';
  status: 'PENDING' | 'PAID' | 'REFUSED' | 'REFUNDED' | 'CHARGEBACK';
  paidAt?: string;
  createdAt: string;
  store?: {
    id: string;
    title: string;
    subdomain: string;
    adminEmail: string;
  };
  plan?: {
    id: string;
    name: string;
  };
}

const statusLabels: Record<string, string> = {
  PAID: 'Aprovado',
  PENDING: 'Pendente',
  REFUSED: 'Recusado',
  REFUNDED: 'Estornado',
  CHARGEBACK: 'Chargeback',
};

const statusBadge: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  REFUSED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CHARGEBACK: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDateTimeUTC(dateStr?: string | Date | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', { timeZone: 'UTC' });
}

export default function SuperAdminTransactionsPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await billingService.getAdminPayments();
      setItems(data || []);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar histórico de transações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Métricas Financeiras
  const totalPaid = useMemo(() => {
    return items
      .filter((i) => i.status === 'PAID')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [items]);

  const paidCount = items.filter((i) => i.status === 'PAID').length;
  const pixCount = items.filter((i) => i.method === 'PIX_AUTO' && i.status === 'PAID').length;
  const cardCount = items.filter((i) => i.method === 'CREDIT_CARD' && i.status === 'PAID').length;
  const refundCount = items.filter((i) => i.status === 'REFUNDED' || i.status === 'CHARGEBACK').length;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const storeName = item.store?.title || '';
      const email = item.store?.adminEmail || '';
      const txId = item.providerPaymentId || '';

      const matchSearch =
        storeName.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        txId.toLowerCase().includes(search.toLowerCase());

      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [items, search, selectedStatus]);

  const [reprocessing, setReprocessing] = useState(false);

  const handleReprocess = async () => {
    setReprocessing(true);
    setError('');
    try {
      await billingService.reprocessWebhooks();
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao reprocessar webhooks');
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header com Botão de Atualizar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Receipt className="h-4 w-4" />
            Super Admin ➔ Financeiro
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Transações & Pagamentos Cakto</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Histórico em tempo real de todas as cobranças, renovações e implantações processadas no sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleReprocess()}
            disabled={loading || reprocessing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`h-4 w-4 ${reprocessing ? 'animate-spin' : ''}`} />
            {reprocessing ? 'Reprocessando...' : 'Reprocessar Webhooks'}
          </button>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Cards de Métricas de Transações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Volume Aprovado</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-emerald-600 font-medium">{paidCount} pagamento(s) confirmados</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Pix</span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{pixCount}</div>
          <p className="text-xs text-slate-500 font-medium">Pagamentos via Pix</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Cartão de Crédito</span>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{cardCount}</div>
          <p className="text-xs text-slate-500 font-medium">Transações aprovadas via Cartão</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Reembolsos / Estornos</span>
            <RotateCcw className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{refundCount}</div>
          <p className="text-xs text-amber-700 font-medium">Devoluções de pagamento</p>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden space-y-4">
        {/* Header e Filtros */}
        <div className="p-5 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Extrato de Pagamentos</h2>
            <p className="text-xs text-slate-500">Registro individual de cada evento financeiro recebido da Cakto.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Input de Busca */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por loja, e-mail ou ID..."
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
                <option value="PAID">Aprovados</option>
                <option value="PENDING">Pendentes</option>
                <option value="REFUSED">Recusados</option>
                <option value="REFUNDED">Estornados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conteúdo da Tabela */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Carregando transações...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhuma transação encontrada para os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Loja / Cliente</th>
                  <th className="py-3 px-4">ID Transação (Cakto)</th>
                  <th className="py-3 px-4">Tipo / Produto</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Data & Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{item.store?.title || 'Loja Desconhecida'}</div>
                      <div className="text-xs text-slate-500">{item.store?.adminEmail || '—'}</div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs">
                      {item.providerPaymentId ? (
                        <button
                          onClick={() => handleCopy(item.providerPaymentId!)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition text-[11px]"
                          title="Clique para copiar o ID"
                        >
                          <span>{item.providerPaymentId}</span>
                          {copiedId === item.providerPaymentId ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {item.kind?.includes('SETUP') ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          Implantação + 1ª Mensalidade
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-semibold text-slate-800">
                          {item.plan?.name || 'Mensalidade ERP'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-slate-700">
                      {item.method === 'PIX_AUTO' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          Pix
                        </span>
                      ) : item.method === 'CREDIT_CARD' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700">
                          Cartão de Crédito
                        </span>
                      ) : (
                        'Processado via Cakto'
                      )}
                    </td>

                    <td className="py-4 px-4 font-extrabold text-slate-900">
                      {formatCurrency(Number(item.amount))}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          statusBadge[item.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right text-xs font-medium text-slate-500">
                      {formatDateTimeUTC(item.paidAt || item.createdAt)}
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
