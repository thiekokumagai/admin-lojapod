import { useEffect, useState } from 'react';
import { storesService, Store } from '../services/stores.service';
import { Store as StoreIcon, Plus, Building, Mail, Globe, Package, ShoppingBag, Loader2, ExternalLink, Pencil, Trash2, Power } from 'lucide-react';

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

export default function SuperAdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    subdomain: '',
    title: '',
    adminEmail: '',
    password: '',
  });

  const [editForm, setEditForm] = useState({
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

  const RESERVED_SUBDOMAINS = ['app', 'admin', 'api', 'www', 'localhost', 'superadmin'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const sub = form.subdomain.trim().toLowerCase();
    if (RESERVED_SUBDOMAINS.includes(sub)) {
      setError(`O subdomínio "${sub}" é reservado pelo sistema e não pode ser utilizado.`);
      return;
    }

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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    setError('');
    setSuccess('');

    const sub = editForm.subdomain.trim().toLowerCase();
    if (RESERVED_SUBDOMAINS.includes(sub)) {
      setError(`O subdomínio "${sub}" é reservado pelo sistema e não pode ser utilizado.`);
      return;
    }

    setSubmitting(true);

    try {
      await storesService.updateStore(editingStore.id, editForm);
      setSuccess(`Loja "${editForm.title}" atualizada com sucesso!`);
      setShowEditModal(false);
      setEditingStore(null);
      loadStores();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar loja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await storesService.toggleStoreActive(id);
      setSuccess(`Loja ${currentStatus ? 'desativada' : 'ativada'} com sucesso!`);
      loadStores();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status da loja');
    }
  };

  const handleDelete = async () => {
    if (!deletingStore) return;
    setSubmitting(true);
    setError('');
    try {
      await storesService.deleteStore(deletingStore.id);
      setSuccess(`Loja "${deletingStore.title}" excluída permanentemente!`);
      setDeletingStore(null);
      loadStores();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir loja');
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
            Cadastre novas lojas, edite subdomínios ativos e gerencie tenants do sistema.
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
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg text-slate-900">{store.title}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${store.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {store.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <a
                    href={getStoreUrl(store.subdomain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 w-fit hover:bg-indigo-100 transition"
                    title="Abrir vitrine da loja em nova aba"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{store.subdomain}.lojapod.com</span>
                    <ExternalLink className="h-3 w-3 ml-0.5 opacity-75" />
                  </a>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(store.id, store.isActive)}
                    className={`p-2 rounded-lg transition ${store.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-50'}`}
                    title={store.isActive ? "Desativar Loja" : "Ativar Loja"}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setError('');
                      setEditingStore(store);
                      setEditForm({
                        title: store.title,
                        subdomain: store.subdomain,
                        adminEmail: store.adminEmail,
                        password: '',
                      });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                    title="Editar Loja"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingStore(store)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir Loja Permanentemente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
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
                  <span className="bg-slate-100 px-3 py-2 text-xs font-mono text-slate-500 border-l">.lojapod.com</span>
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

      {/* Modal de Edição */}
      {showEditModal && editingStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Editar Loja: {editingStore.title}</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título da Loja</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vape Pod Brasil"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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
                    value={editForm.subdomain}
                    onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-3 py-2 text-sm outline-none"
                  />
                  <span className="bg-slate-100 px-3 py-2 text-xs font-mono text-slate-500 border-l">.lojapod.com</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail do Administrador</label>
                <input
                  type="email"
                  required
                  placeholder="admin@vapepod.com"
                  value={editForm.adminEmail}
                  onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Redefinir Senha do Admin (Opcional)</label>
                <input
                  type="password"
                  minLength={6}
                  placeholder="Deixe em branco para não alterar"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>



              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStore(null);
                  }}
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
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deletingStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Excluir Loja Permanentemente</h2>
            </div>
            
            <div className="space-y-3 py-2">
              <p className="text-slate-700 text-sm">
                Tem certeza que deseja excluir a loja <strong>{deletingStore.title}</strong>?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">
                  ⚠️ AVISO: Esta ação é irreversível. Todos os dados associados a esta loja (produtos, pedidos, clientes, etc.) serão apagados para sempre.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => setDeletingStore(null)}
                className="px-4 py-2 border text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Excluindo...' : 'Sim, Excluir Loja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
