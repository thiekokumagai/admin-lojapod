import { useEffect, useMemo, useState } from 'react';
import { storesService, Store } from '../services/stores.service';
import type { BusinessType } from '@/types/settings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Store as StoreIcon,
  Plus,
  Building,
  Mail,
  Globe,
  Package,
  ShoppingBag,
  Users,
  Loader2,
  ExternalLink,
  Pencil,
  Trash2,
  Power,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Layers,
  KeyRound,
  Calendar,
} from 'lucide-react';
import { formatStoreHost, getStoreDomainSuffix, getStoreUrl } from '../utils/store-url';

const BUSINESS_TYPE_META: Record<
  BusinessType,
  { label: string; badgeClass: string; avatarClass: string }
> = {
  POD: {
    label: 'Varejo / Loja Geral',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    avatarClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  FOOD: {
    label: 'Delivery / Alimentação',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    avatarClass: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  ACAI: {
    label: 'Delivery / Alimentação',
    badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200/80',
    avatarClass: 'bg-orange-50 text-orange-700 border-orange-100',
  },
};

const RESERVED_SUBDOMAINS = ['app', 'admin', 'api', 'www', 'localhost', 'superadmin'];

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type SegmentFilter = 'ALL' | 'POD' | 'FOOD';

interface ApiErrorLike {
  message?: string;
  status?: number;
  data?: {
    code?: string;
    customizableProductsCount?: number;
  };
}

function normalizeSegment(businessType?: BusinessType): 'POD' | 'FOOD' {
  return businessType === 'FOOD' || businessType === 'ACAI' ? 'FOOD' : 'POD';
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

function formatCreatedDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export default function SuperAdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [podConfirmCount, setPodConfirmCount] = useState<number | null>(null);

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [createPasswordUnlocked, setCreatePasswordUnlocked] = useState(false);
  const [editPasswordUnlocked, setEditPasswordUnlocked] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('ALL');

  const [form, setForm] = useState({
    subdomain: '',
    title: '',
    adminEmail: '',
    password: '',
    businessType: 'POD' as BusinessType,
  });

  const [editForm, setEditForm] = useState({
    subdomain: '',
    title: '',
    adminEmail: '',
    password: '',
    businessType: 'POD' as BusinessType,
  });

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await storesService.getStores();
      setStores(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao carregar lista de lojas'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const stats = useMemo(() => {
    const total = stores.length;
    const active = stores.filter((s) => s.isActive).length;
    const inactive = total - active;
    const vape = stores.filter((s) => normalizeSegment(s.businessType) === 'POD').length;
    const food = stores.filter((s) => normalizeSegment(s.businessType) === 'FOOD').length;
    return { total, active, inactive, vape, food };
  }, [stores]);

  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return stores.filter((store) => {
      if (statusFilter === 'ACTIVE' && !store.isActive) return false;
      if (statusFilter === 'INACTIVE' && store.isActive) return false;

      const segment = normalizeSegment(store.businessType);
      if (segmentFilter !== 'ALL' && segment !== segmentFilter) return false;

      if (!query) return true;

      const matchesTitle = store.title.toLowerCase().includes(query);
      const matchesSubdomain = store.subdomain.toLowerCase().includes(query);
      const matchesDomain = (store.customDomain ?? '').toLowerCase().includes(query);
      const matchesEmail = store.adminEmail.toLowerCase().includes(query);
      return matchesTitle || matchesSubdomain || matchesDomain || matchesEmail;
    });
  }, [stores, searchQuery, statusFilter, segmentFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== 'ALL' || segmentFilter !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSegmentFilter('ALL');
  };

  const openCreateModal = () => {
    setError('');
    setForm({
      subdomain: '',
      title: '',
      adminEmail: '',
      password: '',
      businessType: 'POD',
    });
    setShowCreatePassword(false);
    setCreatePasswordUnlocked(false);
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setShowCreatePassword(false);
    setCreatePasswordUnlocked(false);
    setForm((prev) => ({ ...prev, password: '' }));
  };

  const openEditModal = (store: Store) => {
    setError('');
    setEditingStore(store);
    setEditForm({
      title: store.title,
      subdomain: store.subdomain,
      adminEmail: store.adminEmail,
      password: '',
      businessType: normalizeSegment(store.businessType),
    });
    setShowEditPassword(false);
    setEditPasswordUnlocked(false);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingStore(null);
    setShowEditPassword(false);
    setEditPasswordUnlocked(false);
    setEditForm((prev) => ({ ...prev, password: '' }));
  };

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
      setForm({ subdomain: '', title: '', adminEmail: '', password: '', businessType: 'POD' });
      setShowCreatePassword(false);
      setCreatePasswordUnlocked(false);
      setShowModal(false);
      loadStores();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao cadastrar loja'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitEditStore = async (forceDisableCustomizations = false) => {
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
      const payload = {
        title: editForm.title,
        subdomain: editForm.subdomain,
        adminEmail: editForm.adminEmail,
        businessType: editForm.businessType,
        ...(editForm.password.trim() ? { password: editForm.password.trim() } : {}),
        ...(forceDisableCustomizations
          ? { forceDisableCustomizations: true }
          : {}),
      };
      const updated = await storesService.updateStore(editingStore.id, payload);
      setStores((prev) =>
        prev.map((s) => (s.id === editingStore.id ? { ...s, ...updated } : s)),
      );
      setPodConfirmCount(null);
      setSuccess(`Loja "${editForm.title}" atualizada com sucesso!`);
      closeEditModal();
      await loadStores();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorLike;
      if (
        apiErr?.status === 409 &&
        apiErr?.data?.code === 'CUSTOMIZABLE_PRODUCTS_EXIST'
      ) {
        setPodConfirmCount(Number(apiErr.data.customizableProductsCount) || 1);
        return;
      }
      setError(getErrorMessage(err, 'Erro ao atualizar loja'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitEditStore(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await storesService.toggleStoreActive(id);
      setSuccess(`Loja ${currentStatus ? 'desativada' : 'ativada'} com sucesso!`);
      loadStores();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao alterar status da loja'));
    }
  };

  const handleDelete = async () => {
    if (!deletingStore) return;

    const expectedName = deletingStore.title.trim().toLowerCase();
    const expectedSubdomain = deletingStore.subdomain.trim().toLowerCase();
    const inputClean = deleteConfirmInput.trim().toLowerCase();

    if (inputClean !== expectedName && inputClean !== expectedSubdomain && inputClean !== 'excluir') {
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await storesService.deleteStore(deletingStore.id);
      setSuccess(`Loja "${deletingStore.title}" excluída permanentemente!`);
      setDeletingStore(null);
      setDeleteConfirmInput('');
      loadStores();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erro ao excluir loja'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-indigo-200 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-indigo-300" />
            <span>Super Admin • Multi-Tenant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gerenciamento de Lojas
          </h1>
          <p className="text-indigo-100/85 text-sm max-w-xl">
            Cadastre novos tenants, gerencie subdomínios, segmentos de atuação e acessos administrativos em um só lugar.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nova Loja
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total de Lojas
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {stats.total}
            </p>
            <p className="text-xs text-slate-500 mt-1">Tenants cadastrados</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <StoreIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ativas
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {stats.active}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% em operação`
                : 'Nenhuma loja ativa'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inativas
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1">
              {stats.inactive}
            </p>
            <p className="text-xs text-slate-500 mt-1">Pausadas ou suspensas</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Por Segmento
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                Varejo: {stats.vape}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                Delivery: {stats.food}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Distribuição de nichos</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Fechar alerta de erro"
            className="text-red-500 hover:text-red-700 p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess('')}
            aria-label="Fechar alerta de sucesso"
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Barra de Busca e Filtros */}
      {!loading && stores.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Buscar lojas"
                placeholder="Buscar por nome, subdomínio ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtros de Status e Segmento */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1" role="group" aria-label="Filtrar por status">
                {(
                  [
                    { key: 'ALL', label: `Todas (${stats.total})` },
                    { key: 'ACTIVE', label: `Ativas (${stats.active})` },
                    { key: 'INACTIVE', label: `Inativas (${stats.inactive})` },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatusFilter(item.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      statusFilter === item.key
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1" role="group" aria-label="Filtrar por segmento">
                {(
                  [
                    { key: 'ALL', label: 'Todos os nichos' },
                    { key: 'POD', label: 'Varejo' },
                    { key: 'FOOD', label: 'Alimentação' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSegmentFilter(item.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      segmentFilter === item.key
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Exibindo <strong className="text-slate-700">{filteredStores.length}</strong> de{' '}
              <strong className="text-slate-700">{stores.length}</strong> lojas
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid de Lojas */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 text-slate-500 gap-3 bg-white border border-slate-200/80 rounded-2xl">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Carregando lojas...</span>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Building className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Nenhuma loja cadastrada</h3>
          <p className="text-slate-500 text-sm mt-1 mb-5 max-w-sm mx-auto">
            Adicione o primeiro tenant para começar a gerenciar domínios, segmentos e acessos.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Primeira Loja
          </button>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="text-center py-14 bg-white border border-slate-200/80 rounded-2xl p-8 space-y-3">
          <Search className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-slate-800">Nenhuma loja encontrada</h3>
          <p className="text-slate-500 text-sm">
            Tente ajustar a busca ou limpar os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg hover:bg-indigo-100 transition"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStores.map((store) => {
            const typeMeta = BUSINESS_TYPE_META[store.businessType ?? 'POD'];
            const createdLabel = formatCreatedDate(store.createdAt);
            const initial = (store.title.trim().charAt(0) || 'L').toUpperCase();

            return (
              <div
                key={store.id}
                className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200/80 transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Faixa superior de status */}
                <div
                  className={`h-1.5 w-full ${
                    store.isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-slate-200'
                  }`}
                />

                <div className="p-5 space-y-4 flex-1">
                  {/* Topo: Avatar + Título + Badges */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-11 w-11 rounded-xl border flex items-center justify-center font-extrabold text-base shrink-0 ${typeMeta.avatarClass}`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-base text-slate-900 truncate" title={store.title}>
                        {store.title}
                      </h2>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            store.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-red-50 text-red-700 border border-red-200/80'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              store.isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {store.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeMeta.badgeClass}`}
                        >
                          {typeMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Link do Subdomínio */}
                  <a
                    href={getStoreUrl(store.subdomain, store.customDomain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 text-xs font-mono text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-3 py-2 rounded-xl hover:bg-indigo-100/80 transition group"
                    title="Abrir vitrine da loja em nova aba"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Globe className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{formatStoreHost(store.subdomain, store.customDomain)}</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70 group-hover:opacity-100 transition" />
                  </a>

                  {/* E-mail e Data */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={store.adminEmail}>
                        {store.adminEmail}
                      </span>
                    </div>
                    {createdLabel && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Criada em {createdLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50/90 border border-slate-100 rounded-xl px-2.5 py-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {store._count?.products || 0}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">produtos</p>
                    </div>
                    <div className="bg-slate-50/90 border border-slate-100 rounded-xl px-2.5 py-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {store._count?.orders || 0}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">pedidos</p>
                    </div>
                    <div className="bg-slate-50/90 border border-slate-100 rounded-xl px-2.5 py-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {store._count?.customers || 0}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500">clientes</p>
                    </div>
                  </div>
                </div>

                {/* Barra de Ações */}
                <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(store.id, store.isActive)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      store.isActive
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70'
                        : 'text-slate-600 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                    }`}
                    title={store.isActive ? 'Desativar Loja' : 'Ativar Loja'}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{store.isActive ? 'Desativar' : 'Ativar'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(store)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition"
                      title="Editar Loja"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingStore(store);
                        setDeleteConfirmInput('');
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition"
                      title="Excluir Loja Permanentemente"
                      aria-label={`Excluir ${store.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Cadastrar Nova Loja</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure a identidade, o subdomínio e o acesso inicial do administrador.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                aria-label="Fechar modal de criação"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
                    {error}
                  </div>
                )}

                {/* Identificação */}
                <div className="space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Identificação da Loja
                  </p>
                  <div>
                    <label
                      htmlFor="create-store-title"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Título da Loja
                    </label>
                    <input
                      id="create-store-title"
                      type="text"
                      required
                      placeholder="Ex: Vape Pod Brasil"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="create-store-subdomain"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Subdomínio (URL)
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition">
                      <input
                        id="create-store-subdomain"
                        type="text"
                        required
                        placeholder="vapepod"
                        value={form.subdomain}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-sm outline-none"
                      />
                      <span className="bg-slate-100 px-3 py-2.5 text-xs font-mono text-slate-500 border-l border-slate-200">
                        {getStoreDomainSuffix()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="create-store-business-type"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Segmento da loja
                    </label>
                    <select
                      id="create-store-business-type"
                      aria-label="Segmento da loja"
                      value={form.businessType}
                      onChange={(e) =>
                        setForm({ ...form, businessType: e.target.value as BusinessType })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="POD">Varejo / Loja Geral</option>
                      <option value="FOOD">Delivery / Alimentação</option>
                    </select>
                  </div>
                </div>

                {/* Acesso do Administrador */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Acesso do Administrador
                  </p>
                  <div>
                    <label
                      htmlFor="create-store-email"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      E-mail do Administrador
                    </label>
                    <input
                      id="create-store-email"
                      name="store-admin-initial-email"
                      type="email"
                      autoComplete="off"
                      required
                      placeholder="admin@vapepod.com"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="create-store-password"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Senha Inicial do Admin
                    </label>
                    <div className="relative">
                      <input
                        id="create-store-password"
                        name="store-admin-initial-password"
                        type={showCreatePassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        readOnly={!createPasswordUnlocked}
                        onFocus={() => setCreatePasswordUnlocked(true)}
                        onPointerDown={() => setCreatePasswordUnlocked(true)}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-3.5 pr-11 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword((prev) => !prev)}
                        aria-label={showCreatePassword ? 'Ocultar senha inicial' : 'Mostrar senha inicial'}
                        title={showCreatePassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                      >
                        {showCreatePassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 px-6 py-4 bg-slate-50/70 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                  <Pencil className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 truncate">
                    Editar Loja: {editingStore.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atualize dados do tenant, segmento ou redefina a senha do administrador.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Fechar modal de edição"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} autoComplete="off">
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
                    {error}
                  </div>
                )}

                {/* Identificação */}
                <div className="space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Dados da Loja
                  </p>
                  <div>
                    <label
                      htmlFor="edit-store-title"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Título da Loja
                    </label>
                    <input
                      id="edit-store-title"
                      type="text"
                      required
                      placeholder="Ex: Vape Pod Brasil"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-store-subdomain"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Subdomínio (URL)
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition">
                      <input
                        id="edit-store-subdomain"
                        type="text"
                        required
                        placeholder="vapepod"
                        value={editForm.subdomain}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-sm outline-none"
                      />
                      <span className="bg-slate-100 px-3 py-2.5 text-xs font-mono text-slate-500 border-l border-slate-200">
                        {getStoreDomainSuffix()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-store-business-type"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Segmento da loja
                    </label>
                    <select
                      id="edit-store-business-type"
                      aria-label="Segmento da loja"
                      value={editForm.businessType}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessType: e.target.value as BusinessType,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="POD">Varejo / Loja Geral</option>
                      <option value="FOOD">Delivery / Alimentação</option>
                    </select>
                  </div>
                </div>

                {/* Acesso do Administrador */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Acesso do Administrador
                  </p>
                  <div>
                    <label
                      htmlFor="edit-store-email"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      E-mail do Administrador
                    </label>
                    <input
                      id="edit-store-email"
                      name="store-admin-edit-email"
                      type="email"
                      autoComplete="off"
                      required
                      placeholder="admin@vapepod.com"
                      value={editForm.adminEmail}
                      onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="edit-store-password"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                        <span>Redefinir Senha do Admin (Opcional)</span>
                      </label>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        Opcional
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="edit-store-password"
                        name="store-admin-reset-password"
                        type={showEditPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        readOnly={!editPasswordUnlocked}
                        onFocus={() => setEditPasswordUnlocked(true)}
                        onPointerDown={() => setEditPasswordUnlocked(true)}
                        minLength={6}
                        placeholder="Deixe em branco para não alterar"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full px-3.5 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword((prev) => !prev)}
                        aria-label={showEditPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                        title={showEditPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                      >
                        {showEditPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Preencha apenas se quiser definir uma nova senha (mínimo 6 caracteres).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 px-6 py-4 bg-slate-50/70 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão Segura de Loja */}
      {deletingStore && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200/80">
            {/* Header com ícone de perigo */}
            <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-4">
              <div className="p-3 bg-red-100/80 text-red-600 rounded-xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Excluir Loja Permanentemente</h2>
                <p className="text-xs text-red-600 font-medium">Ação destrutiva e irreversível</p>
              </div>
            </div>

            {/* Alerta e Lista de Impactos */}
            <div className="space-y-3">
              <p className="text-slate-700 text-sm leading-relaxed">
                Você está prestes a excluir a loja <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-bold">{deletingStore.title}</strong> (<code>{formatStoreHost(deletingStore.subdomain)}</code>).
              </p>

              <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <Trash2 className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Todos os dados abaixo serão EXCLUÍDOS PERMANENTEMENTE:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-rose-700">
                  <li><strong>Catálogo:</strong> Todos os produtos, imagens e variações ({deletingStore._count?.products || 0} produtos)</li>
                  <li><strong>Vendas:</strong> Histórico de pedidos e faturamento ({deletingStore._count?.orders || 0} pedidos)</li>
                  <li><strong>Clientes &amp; Usuários:</strong> Base de clientes e acessos administrativos</li>
                  <li><strong>Configurações:</strong> Domínios, cupons, taxas e parametrizações da loja</li>
                </ul>
              </div>

              {/* Campo de Verificação */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Para confirmar a exclusão, digite o nome da loja <span className="text-red-600 font-bold">&quot;{deletingStore.title}&quot;</span> ou a palavra <span className="text-red-600 font-bold">&quot;EXCLUIR&quot;</span>:
                </label>
                <input
                  type="text"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder={`Digite "${deletingStore.title}" ou "EXCLUIR"`}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-medium"
                  autoFocus
                />
              </div>
            </div>

            {/* Botões do Modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeletingStore(null);
                  setDeleteConfirmInput('');
                }}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={
                  submitting ||
                  (deleteConfirmInput.trim().toLowerCase() !== deletingStore.title.trim().toLowerCase() &&
                   deleteConfirmInput.trim().toLowerCase() !== deletingStore.subdomain.trim().toLowerCase() &&
                   deleteConfirmInput.trim().toUpperCase() !== 'EXCLUIR')
                }
                className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-sm"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Excluindo Loja...' : 'Excluir Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={podConfirmCount !== null}
        onOpenChange={(open) => {
          if (!open) setPodConfirmCount(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Produtos personalizáveis ativos</AlertDialogTitle>
            <AlertDialogDescription>
              Existem {podConfirmCount} produto(s) personalizável(is). Deseja
              desmarcar &apos;Personalizável&apos; em todos eles e trocar para
              Varejo / Loja Geral? Grupos e pedidos antigos não serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitEditStore(true)}>
              Desmarcar e trocar para Varejo / Loja Geral
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
