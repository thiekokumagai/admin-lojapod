import { useEffect, useState } from 'react';
import {
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  FileText,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import {
  billingService,
  BillingSubscription,
  BillingPlan,
  BillingPaymentReceipt,
  BillingStatus,
} from '@/services/billing.service';

const statusLabels: Record<BillingStatus, string> = {
  TRIALING: 'Em Período de Teste Grátis',
  ACTIVE: 'Assinatura Ativa',
  PAST_DUE: 'Em Atraso (Período de Carência)',
  SUSPENDED: 'Assinatura Suspensa',
  CANCELED: 'Assinatura Cancelada',
};

const statusBadge: Record<BillingStatus, string> = {
  TRIALING: 'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAST_DUE: 'bg-amber-50 text-amber-800 border-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  CANCELED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const paymentStatusBadges: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PAID: {
    label: 'Pago',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  REFUSED: {
    label: 'Recusado',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertTriangle,
  },
  REFUNDED: {
    label: 'Reembolsado',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: RotateCcw,
  },
  CHARGEBACK: {
    label: 'Estornado (Chargeback)',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
    icon: AlertCircle,
  },
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDateUTC(dateStr?: string | Date | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatDateTimeUTC(dateStr?: string | Date | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', { timeZone: 'UTC' });
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [payments, setPayments] = useState<BillingPaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadSubscription = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await billingService.getMySubscription();
      setSubscription(res.subscription);
      
      // Se a loja tiver um plano específico vinculado, exibe apenas ele para pagamento
      if (res.subscription?.plan) {
        setPlans([res.subscription.plan]);
      } else {
        setPlans(res.availablePlans || []);
      }

      setPayments(res.payments || []);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar faturamento da loja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscription();
  }, []);

  const handleOpenCheckout = async (planId?: string) => {
    setLoadingCheckout(planId || 'DEFAULT');
    setError('');
    try {
      const res = await billingService.getCheckout(planId);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setError('URL de checkout não disponível no momento.');
      }
    } catch (e: any) {
      setError(e.message || 'Não foi possível gerar a URL de checkout.');
    } finally {
      setLoadingCheckout(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Carregando dados de faturamento...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
          <ShieldCheck className="h-4 w-4" />
          Faturamento & Licenciamento
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Minha Assinatura</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Acompanhe a situação do plano, datas de vencimento, recibos e opções de atualização.
        </p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Card da Assinatura Atual */}
      {subscription && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Atual</span>
              <div className="mt-1 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                    statusBadge[subscription.status]
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {statusLabels[subscription.status]}
                </span>

                {subscription.supportSelected && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    Implantação ERP Ativa
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Mensal</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {formatCurrency(Number(subscription.monthlyFee) || 150)}
                <span className="text-xs font-normal text-slate-500">/mês</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border rounded-xl p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Próxima Renovação</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {subscription.currentPeriodEndsAt
                    ? formatDateUTC(subscription.currentPeriodEndsAt)
                    : subscription.trialEndsAt
                    ? `Trial até ${formatDateUTC(subscription.trialEndsAt)}`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border rounded-xl p-4 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Forma de Pagamento</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {subscription.paymentMethod === 'PIX_AUTO'
                    ? 'Pix'
                    : subscription.paymentMethod === 'CREDIT_CARD'
                    ? 'Cartão de Crédito'
                    : 'Processamento Seguro via Cakto'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planos Disponíveis para Seleção/Contratação */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {subscription?.plan ? 'Sua Assinatura Vinculada' : 'Planos e Ofertas Disponíveis'}
          </h2>
          <p className="text-xs text-slate-500">
            {subscription?.plan
              ? 'Clique no botão abaixo para efetuar o pagamento da mensalidade ou renovar sua assinatura.'
              : 'Selecione o plano desejado para regularizar ou assinar o serviço.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isStorePlan = subscription?.plan?.id === plan.id;
            const isSuspendedOrDue = subscription?.status === 'PAST_DUE' || subscription?.status === 'SUSPENDED';

            const targetDate = subscription?.currentPeriodEndsAt || subscription?.trialEndsAt;
            let daysRemaining = 999;
            if (targetDate) {
              const exp = new Date(targetDate);
              const now = new Date();
              const diffTime = exp.getTime() - now.getTime();
              daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            const canRenew = daysRemaining <= 5 || isSuspendedOrDue;

            let buttonText = `Contratar ${plan.name}`;
            if (isStorePlan || plans.length === 1) {
              if (isSuspendedOrDue) {
                buttonText = 'Regularizar Assinatura Agora';
              } else {
                buttonText = 'Renovar Assinatura via Cakto';
              }
            }

            return (
              <div
                key={plan.id}
                className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                      {plan.checkoutType === 'SINGLE_PRODUCT' ? (
                        <span className="inline-block mt-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                          Produto Único + Assinatura
                        </span>
                      ) : (
                        <span className="inline-block mt-1 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                          Assinatura Recorrente
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">
                        {formatCurrency(Number(plan.price))}
                      </div>
                      {plan.checkoutType === 'RECURRING_SUBSCRIPTION' && (
                        <span className="text-xs text-slate-500 font-medium">/mês</span>
                      )}
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        + R$ 0,99 de taxa de serviço
                      </div>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{plan.description}</p>
                  )}

                  <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Acesso completo ao ERP e Vitrine Online</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Cobrança segura e automatizada via Cakto</span>
                    </li>
                    {plan.checkoutType === 'SINGLE_PRODUCT' && (
                      <li className="flex items-center gap-1.5 font-semibold text-indigo-900">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>Inclui 1ª mensalidade + Suporte de Implantação</span>
                      </li>
                    )}
                  </ul>
                </div>

                {!canRenew && (isStorePlan || plans.length === 1) ? (
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Assinatura Ativa & Em Dia
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Próxima renovação em {formatDateUTC(targetDate)}. O botão de renovação ficará disponível 5 dias antes do vencimento.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => void handleOpenCheckout(plan.id)}
                    disabled={loadingCheckout === plan.id}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-3 font-semibold text-sm hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loadingCheckout === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {buttonText}
                        <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-75" />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico Financeiro e Recibos */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              Histórico Financeiro & Recibos
            </h2>
            <p className="text-xs text-slate-500">
              Registro completo de todos os pagamentos e confirmações efetuadas.
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhum histórico de pagamento registrado até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-5">Data do Pagamento</th>
                  <th className="py-3.5 px-4">Tipo / Lançamento</th>
                  <th className="py-3.5 px-4">Método</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-5 text-right">Status do Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-5 font-medium text-slate-900">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleString('pt-BR')
                        : new Date(payment.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {payment.kind.includes('SETUP') ? 'Implantação ERP + 1ª Mensalidade' : 'Mensalidade Recorrente'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {payment.method === 'PIX_AUTO'
                        ? 'Pix'
                        : payment.method === 'CREDIT_CARD'
                        ? 'Cartão de Crédito'
                        : 'Provedor Cakto'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(Number(payment.amount))}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {(() => {
                        const statusConfig = paymentStatusBadges[payment.status] || {
                          label: payment.status,
                          className: 'bg-slate-100 text-slate-600 border-slate-200',
                          icon: Clock,
                        };
                        const IconComponent = statusConfig.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 border text-xs font-bold px-2.5 py-1 rounded-full ${statusConfig.className}`}
                          >
                            <IconComponent className="h-3 w-3 shrink-0" />
                            {statusConfig.label}
                          </span>
                        );
                      })()}
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

