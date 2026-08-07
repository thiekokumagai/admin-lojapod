import { useEffect, useState } from 'react';
import { storesService, Store } from '../services/stores.service';
import { Store as StoreIcon, Plus, Building, Mail, Globe, Package, ShoppingBag, Loader2 } from 'lucide-react';

export default function SuperAdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    subdomain: '',
    title: '',
    adminEmail: '',
    password: '',
  });

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await storesService.getStores();
      setStores(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de lojas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await storesService.createStore(form);
      setSuccess(`Loja "${form.title}" criada com sucesso!`);
      setForm({ subdomain: '', title: '', adminEmail: '', password: '' });
      setShowModal(false);
      loadStores();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar loja');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StoreIcon className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Gerenciamento de Lojas (Super Admin)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre novas lojas, visualize subdomínios ativos e gerencie tenants do sistema.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nova Loja
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm">{success}</div>}

      {/* Grid de Lojas */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span>Carregando lojas...</span>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border rounded-xl p-8">
          <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">Nenhuma loja cadastrada</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">Clique no botão abaixo para adicionar a primeira loja.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700"
          >
            Cadastrar Primeira Loja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">{store.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 w-fit">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{store.subdomain}.lojapod.store</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{store.adminEmail}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t text-xs text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span><strong>{store._count?.products || 0}</strong> produtos</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded">
                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                  <span><strong>{store._count?.orders || 0}</strong> pedidos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Cadastrar Nova Loja</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título da Loja</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vape Pod Brasil"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subdomínio (URL)</label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <input
                    type="text"
                    required
                    placeholder="vapepod"
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-3 py-2 text-sm outline-none"
                  />
                  <span className="bg-slate-100 px-3 py-2 text-xs font-mono text-slate-500 border-l">.lojapod.store</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail do Administrador</label>
                <input
                  type="email"
                  required
                  placeholder="admin@vapepod.com"
                  value={form.adminEmail}
                  onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha Inicial do Admin</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Criando...' : 'Salvar Loja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
