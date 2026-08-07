import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storesService, Store } from "../services/stores.service";
import { Store as StoreIcon, Package, ShoppingBag, Users, Plus, ArrowRight, ShieldCheck, Globe, Loader2 } from "lucide-react";

export default function SuperAdminDashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storesService.getStores()
      .then(setStores)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalProducts = stores.reduce((acc, s) => acc + (s._count?.products || 0), 0);
  const totalOrders = stores.reduce((acc, s) => acc + (s._count?.orders || 0), 0);
  const totalCustomers = stores.reduce((acc, s) => acc + (s._count?.customers || 0), 0);

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
            Acompanhe a quantidade de lojas ativas, catálogo global e atividade de vendas em tempo real.
          </p>
        </div>

        <Link
          to="/super-admin/lojas"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Gerenciar Lojas
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Lojas</span>
            <StoreIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : stores.length}
          </div>
          <p className="text-xs text-slate-400">Lojas ativas na plataforma</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Produtos Cadastrados</span>
            <Package className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : totalProducts}
          </div>
          <p className="text-xs text-slate-400">Em todas as lojas</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pedidos Realizados</span>
            <ShoppingBag className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : totalOrders}
          </div>
          <p className="text-xs text-slate-400">Volume total de vendas</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes Totais</span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : totalCustomers}
          </div>
          <p className="text-xs text-slate-400">Base consolidada</p>
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
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded font-mono">
                        <Globe className="h-3 w-3" />
                        {store.subdomain}.lojapod.store
                      </span>
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
