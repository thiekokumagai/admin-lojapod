import { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  DollarSign,
  Clock,
  Globe,
  Tag,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { billingService, BillingPlan } from '@/services/billing.service';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [priceDisplay, setPriceDisplay] = useState('R$ 150,00');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 150,
    trialDays: 7,
    isActive: true,
    isPublic: true,
    checkoutType: 'RECURRING_SUBSCRIPTION' as 'SINGLE_PRODUCT' | 'RECURRING_SUBSCRIPTION',
    providerProductId: '',
    nextSubscriptionPlanId: '',
  });

  const handlePriceChange = (valStr: string) => {
    const digits = valStr.replace(/\D/g, '');
    const cents = Number(digits) / 100;
    const formatted = formatCurrency(cents);
    setPriceDisplay(formatted);
    setForm((prev) => ({ ...prev, price: cents }));
  };

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await billingService.getAdminPlans();
      setPlans(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar planos de cobrança');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPriceDisplay(formatCurrency(150));
    setForm({
      name: '',
      description: '',
      price: 150,
      trialDays: 7,
      isActive: true,
      isPublic: true,
      checkoutType: 'RECURRING_SUBSCRIPTION',
      providerProductId: '',
      nextSubscriptionPlanId: '',
    });
    setShowModal(true);
  };

  const openEditModal = (plan: BillingPlan) => {
    setEditingPlan(plan);
    const planPrice = Number(plan.price);
    setPriceDisplay(formatCurrency(planPrice));
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: planPrice,
      trialDays: plan.trialDays,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      checkoutType: plan.checkoutType,
      providerProductId: plan.providerProductId || '',
      nextSubscriptionPlanId: plan.nextSubscriptionPlanId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const payload = {
      ...form,
      nextSubscriptionPlanId: form.nextSubscriptionPlanId?.trim() ? form.nextSubscriptionPlanId.trim() : undefined,
      providerProductId: form.providerProductId?.trim() ? form.providerProductId.trim() : undefined,
    };

    try {
      if (editingPlan) {
        await billingService.updatePlan(editingPlan.id, payload);
        setSuccess(`Plano "${form.name}" atualizado com sucesso!`);
      } else {
        await billingService.createPlan(payload);
        setSuccess(`Plano "${form.name}" criado com sucesso!`);
      }
      setShowModal(false);
      await loadPlans();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar plano');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (plan: BillingPlan) => {
    try {
      await billingService.updatePlan(plan.id, { isActive: !plan.isActive });
      await loadPlans();
    } catch (e: any) {
      setError(e.message || 'Erro ao atualizar status do plano');
    }
  };

  const [syncingCakto, setSyncingCakto] = useState(false);

  const handleSyncCakto = async () => {
    setSyncingCakto(true);
    setError('');
    setSuccess('');
    try {
      const res = await billingService.syncCaktoProducts();
      setSuccess(res.message || 'Produtos sincronizados da Cakto com sucesso!');
      await loadPlans();
    } catch (e: any) {
      setError(e.message || 'Erro ao sincronizar produtos com a Cakto');
    } finally {
      setSyncingCakto(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            Configuração Dinâmica de Ofertas
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Planos e Produtos de Cobrança</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Crie e gerencie ofertas sem alterar código. Vincule produtos avulsos de implantação com assinaturas recorrentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncCakto}
            disabled={syncingCakto}
            className="inline-flex items-center gap-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
            title="Buscar e importar ofertas/produtos cadastrados diretamente na conta Cakto"
          >
            {syncingCakto ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <RefreshCw className="h-4 w-4 text-indigo-600" />}
            Importar da Cakto
          </button>
          <button
            onClick={() => void loadPlans()}
            className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition shrink-0"
          >
            <Plus className="h-4 w-4" />
            Criar Novo Plano
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl p-4 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Tabela de Planos */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Carregando planos cadastrados...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhum plano cadastrado. Clique em <strong>"Criar Novo Plano"</strong> para iniciar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-5">Plano / Nome</th>
                  <th className="py-3.5 px-4">Preço</th>
                  <th className="py-3.5 px-4">Tipo de Checkout</th>
                  <th className="py-3.5 px-4 text-center">Visibilidade</th>
                  <th className="py-3.5 px-4">Produto Cakto / Próximo Plano</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{plan.name}</div>
                      {plan.description && (
                        <div className="text-xs text-slate-500 max-w-xs truncate">{plan.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900">
                      {formatCurrency(Number(plan.price))}
                    </td>
                    <td className="py-4 px-4">
                      {plan.checkoutType === 'SINGLE_PRODUCT' ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-semibold">
                          <Tag className="h-3 w-3" /> Produto Único
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs px-2.5 py-1 rounded-full font-semibold">
                          <ShieldCheck className="h-3 w-3" /> Assinatura Recorrente
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {plan.isActive ? (
                          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-200">
                            Ativo
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded border border-slate-200">
                            Inativo
                          </span>
                        )}
                        {plan.isPublic && (
                          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded border border-blue-200">
                            Exibe no Site
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-600">
                      <div>ID: {plan.providerProductId || '—'}</div>
                      {plan.nextSubscriptionPlan && (
                        <div className="text-indigo-600 font-sans font-semibold text-[11px] mt-0.5">
                          ➔ Recorrência pós-compra: {plan.nextSubscriptionPlan.name}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Editar Plano"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(plan)}
                          className={`p-2 border rounded-lg transition ${
                            plan.isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={plan.isActive ? 'Desativar Plano' : 'Ativar Plano'}
                        >
                          {plan.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Plano */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPlan ? 'Editar Plano de Cobrança' : 'Criar Novo Plano de Cobrança'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ERP + Implantação ou Assinatura Mensal"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Resumo dos benefícios do plano..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={priceDisplay}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Checkout
                  </label>
                  <select
                    value={form.checkoutType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        checkoutType: e.target.value as 'SINGLE_PRODUCT' | 'RECURRING_SUBSCRIPTION',
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="RECURRING_SUBSCRIPTION">Assinatura Recorrente</option>
                    <option value="SINGLE_PRODUCT">Produto Único (Implantação/Taxa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ID do Produto no Provedor (Cakto)
                </label>
                <input
                  type="text"
                  placeholder="Ex: product_38qqq7m"
                  value={form.providerProductId}
                  onChange={(e) => setForm({ ...form, providerProductId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {form.checkoutType === 'SINGLE_PRODUCT' && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Plano Recorrente Automático Pós-Implantação
                  </label>
                  <select
                    value={form.nextSubscriptionPlanId}
                    onChange={(e) => setForm({ ...form, nextSubscriptionPlanId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg bg-white text-indigo-900 font-medium"
                  >
                    <option value="">Selecione o plano recorrente...</option>
                    {plans
                      .filter((p) => p.checkoutType === 'RECURRING_SUBSCRIPTION' && p.id !== editingPlan?.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(Number(p.price))}/mês
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-indigo-700">
                    Ao confirmar a compra deste produto único, a loja será ativada e este plano de assinatura recorrente será criado automaticamente para iniciar cobrança em 30 dias.
                  </p>
                </div>
              )}



              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Plano Ativo no Sistema
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Exibir no Site / Opções da Loja
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-sm transition flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
