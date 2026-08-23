import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storesService, Store } from "../services/stores.service";
import { billingService, BillingOverview, BillingSubscription } from "../services/billing.service";
import { Store as StoreIcon, Package, ShoppingBag, Users, Plus, ArrowRight, ShieldCheck, Globe, Loader2, ExternalLink, DollarSign, WalletCards, TrendingUp } from "lucide-react";

function getStoreUrl(subdomain: string): string {
  if (typeof window === 'undefined') return `https://${subdomain}.lojapod.com`;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;
  if (hostname.includes('localhost')) {
    return `${protocol}//${subdomain}.localhost${port}`;
  }
  return `${protocol}//${subdomain}.lojapod.com`;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function SuperAdminDashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
  const [billingOverview, setBillingOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storesService.getStores(),
      billingService.subscriptions().catch(() => []),
      billingService.overview().catch(() => null),
    ])
      .then(([storesData, subData, overviewData]) => {
        setStores(storesData);
        setSubscriptions(subData);
        setBillingOverview(overviewData);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalProducts = stores.reduce((acc, s) => acc + (s._count?.products || 0), 0);
  const totalOrders = stores.reduce((acc, s) => acc + (s._count?.orders || 0), 0);
  const totalCustomers = stores.reduce((acc, s) => acc + (s._count?.customers || 0), 0);

  // MRR Estimado das assinaturas ativas
  const mrr = subscriptions
    .filter((s) => s.status === 'ACTIVE' || s.store.isActive)
    .reduce((sum, item) => sum + (Number(item.monthlyFee) || 150), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 font-medium text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            Painel Geral do Super Admin
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Visão Geral da Plataforma Loja Pod</h1>
          <p className="text-indigo-200 text-sm mt-1 max-w-xl">
            Acompanhe o faturamento recorrente (MRR), quantidade de lojas ativas, catálogo global e atividade de vendas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/super-admin/assinaturas"
            className="flex items-center gap-2 bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <WalletCards className="h-4 w-4" />
            Ver Assinaturas
          </Link>
          <Link
            to="/super-admin/lojas"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Loja
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">MRR Atual</span>
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : formatCurrency(mrr)}
          </div>
          <p className="text-xs text-slate-400">Receita Mensal Recorrente</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Lojas</span>
            <StoreIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : stores.length}
          </div>
          <p className="text-xs text-slate-400">Lojas cadastradas</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Produtos</span>
            <Package className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : totalProducts}
          </div>
          <p className="text-xs text-slate-400">Catálogo consolidado</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pedidos</span>
            <ShoppingBag className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : totalOrders}
          </div>
          <p className="text-xs text-slate-400">Volume de vendas</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes</span>
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : totalCustomers}
          </div>
          <p className="text-xs text-slate-400">Base total</p>
        </div>
      </div>

      {/* Lojas Recentes */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lojas Registradas</h2>
            <p className="text-xs text-slate-500">Resumo dos tenants ativos na infraestrutura</p>
          </div>
          <Link
            to="/super-admin/lojas"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Ver Todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando dados...</span>
          </div>
        ) : stores.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Nenhuma loja cadastrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Loja</th>
                  <th className="py-3 px-4">Subdomínio</th>
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4 text-center">Produtos</th>
                  <th className="py-3 px-4 text-center">Pedidos</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-slate-700">
                {stores.slice(0, 5).map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{store.title}</td>
                    <td className="py-3.5 px-4">
                      <a
                        href={getStoreUrl(store.subdomain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded font-mono hover:bg-indigo-100 transition"
                        title="Abrir vitrine da loja em nova aba"
                      >
                        <Globe className="h-3 w-3" />
                        {store.subdomain}.lojapod.com
                        <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-75" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{store.adminEmail}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-800">{store._count?.products || 0}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-800">{store._count?.orders || 0}</td>
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
