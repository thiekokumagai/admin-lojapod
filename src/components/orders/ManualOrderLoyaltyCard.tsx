import { useState, useMemo, useEffect } from "react";
import { Gift, Award, Sparkles, CheckCircle2, Percent, DollarSign, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loyaltyService, LoyaltyCard, LoyaltyProgram } from "@/services/loyalty.service";

export interface SelectedLoyaltyReward {
  rewardType: string;
  rewardTitle: string;
  discountValue?: number;
}

interface ManualOrderLoyaltyCardProps {
  customerPhone?: string;
  subtotal: number;
  selectedReward: SelectedLoyaltyReward | null;
  onSelectReward: (reward: SelectedLoyaltyReward | null) => void;
}

export function ManualOrderLoyaltyCard({
  customerPhone,
  subtotal,
  selectedReward,
  onSelectReward,
}: ManualOrderLoyaltyCardProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ card: LoyaltyCard | null; program: LoyaltyProgram | null } | null>(null);

  const cleanPhone = useMemo(() => {
    return (customerPhone || "").replace(/\D/g, "");
  }, [customerPhone]);

  useEffect(() => {
    if (!cleanPhone || cleanPhone.length < 8) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    loyaltyService
      .getCustomerCard(cleanPhone)
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn("[ManualOrderLoyaltyCard] Erro ao buscar cartão:", err);
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanPhone]);

  const program = data?.program;
  const card = data?.card;

  const isCardExpired =
    card?.status === "EXPIRED" ||
    (card?.expiresAt && new Date().getTime() > new Date(card.expiresAt).getTime());

  const progType = program?.type || "FREE_PRODUCT";
  const maxStamps = program?.stampsRequired || 10;
  const currentStamps = isCardExpired || card?.status === "REDEEMED" ? 0 : card?.currentStamps || 0;

  const isStampsCompleted =
    !isCardExpired &&
    (progType === "FREE_PRODUCT" || progType === "HYBRID") &&
    (currentStamps >= maxStamps || card?.status === "COMPLETED");

  const cashbackBalance = isCardExpired || card?.status === "REDEEMED" ? 0 : Number(card?.cashbackBalance) || 0;
  const pointsBalance = isCardExpired || card?.status === "REDEEMED" ? 0 : Number(card?.pointsBalance) || 0;
  const pointsRedemptionVal = Number(program?.pointsRedemptionValue) || 0.05;
  const pointsMoneyValue = pointsBalance * pointsRedemptionVal;
  const minPointsToRedeem = Number(program?.minPointsToRedeem) || 0;
  const hasReachedMinPoints = minPointsToRedeem <= 0 || pointsBalance >= minPointsToRedeem;

  // Tiers de desconto progressivo
  const progressiveTiers = useMemo(() => {
    if (Array.isArray(program?.progressiveTiers) && program.progressiveTiers.length > 0) {
      return [...program.progressiveTiers].sort((a, b) => a.minOrders - b.minOrders);
    }
    return [
      { minOrders: 3, discountPercent: 3 },
      { minOrders: 5, discountPercent: 5 },
      { minOrders: 10, discountPercent: 10 },
    ];
  }, [program?.progressiveTiers]);

  const currentTier = useMemo(() => {
    if (progType !== "PROGRESSIVE_DISCOUNT") return null;
    const qualified = progressiveTiers.filter((t) => currentStamps >= t.minOrders);
    return qualified.length > 0 ? qualified[qualified.length - 1] : null;
  }, [progType, progressiveTiers, currentStamps]);

  const progressiveDiscountValue = useMemo(() => {
    if (!currentTier || currentTier.discountPercent <= 0) return 0;
    return Math.round(subtotal * (currentTier.discountPercent / 100) * 100) / 100;
  }, [currentTier, subtotal]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Se não tem telefone ou programa inativo, não renderiza
  if (!cleanPhone || cleanPhone.length < 8) return null;
  if (!loading && (!program || !program.isActive)) return null;

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-500 animate-pulse">
        <Sparkles className="h-4 w-4 text-violet-500 animate-spin" />
        <span>Consultando fidelidade do cliente...</span>
      </div>
    );
  }

  // Verifica se o cliente possui algum benefício elegível para resgate
  const hasStampsReward = isStampsCompleted;
  const hasCashbackReward = progType === "CASHBACK" && cashbackBalance > 0;
  const hasPointsReward = (progType === "POINTS_DISCOUNT" || progType === "HYBRID") && pointsMoneyValue > 0 && hasReachedMinPoints;
  const hasProgressiveReward = progType === "PROGRESSIVE_DISCOUNT" && !!currentTier && currentTier.discountPercent > 0;

  const hasAnyReward = hasStampsReward || hasCashbackReward || hasPointsReward || hasProgressiveReward;

  const handleApplyStampsReward = () => {
    const title = program?.rewardText || "Brinde do Cartão Fidelidade";
    onSelectReward({
      rewardType: progType === "HYBRID" ? "HYBRID" : "FREE_PRODUCT",
      rewardTitle: `Brinde: ${title}`,
      discountValue: 0,
    });
  };

  const handleApplyCashbackReward = () => {
    // Abate até o valor do subtotal do pedido
    const appliedVal = Math.min(cashbackBalance, subtotal);
    onSelectReward({
      rewardType: "CASHBACK",
      rewardTitle: `Cashback: ${formatBRL(appliedVal)}`,
      discountValue: appliedVal,
    });
  };

  const handleApplyPointsReward = () => {
    const appliedVal = Math.min(pointsMoneyValue, subtotal);
    onSelectReward({
      rewardType: "POINTS_DISCOUNT",
      rewardTitle: `Pontos (${pointsBalance} pts): ${formatBRL(appliedVal)} OFF`,
      discountValue: appliedVal,
    });
  };

  const handleApplyProgressiveReward = () => {
    if (!currentTier) return;
    onSelectReward({
      rewardType: "PROGRESSIVE_DISCOUNT",
      rewardTitle: `Desconto Progressivo (${currentTier.discountPercent}% OFF): ${formatBRL(progressiveDiscountValue)}`,
      discountValue: progressiveDiscountValue,
    });
  };

  const handleRemoveReward = () => {
    onSelectReward(null);
  };

  return (
    <div className={`rounded-xl border transition-all p-4 ${
      hasAnyReward
        ? "bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-teal-50/60 border-emerald-300 shadow-xs"
        : "bg-slate-50 border-slate-200"
    }`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs ${
            hasAnyReward ? "bg-emerald-600" : "bg-violet-600"
          }`}>
            {progType === "CASHBACK" ? (
              <Percent className="h-4 w-4" />
            ) : progType === "POINTS_DISCOUNT" ? (
              <DollarSign className="h-4 w-4" />
            ) : progType === "PROGRESSIVE_DISCOUNT" ? (
              <Percent className="h-4 w-4" />
            ) : (
              <Gift className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800">
                Fidelidade: {
                  progType === "CASHBACK"
                    ? "Programa de Cashback"
                    : progType === "POINTS_DISCOUNT"
                    ? "Programa de Pontos"
                    : progType === "PROGRESSIVE_DISCOUNT"
                    ? "Desconto Progressivo"
                    : "Cartão de Selos"
                }
              </span>
              {hasAnyReward && (
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Sparkles className="h-3 w-3" /> Prêmio Disponível!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {progType === "CASHBACK" && (
                <>Saldo do cliente: <strong className="text-emerald-700 font-extrabold">{formatBRL(cashbackBalance)}</strong> ({program?.cashbackPercent || 5}% de volta por pedido)</>
              )}
              {progType === "POINTS_DISCOUNT" && (
                <>Saldo do cliente: <strong className="text-amber-700 font-extrabold">{pointsBalance} pontos</strong> (equivale a {formatBRL(pointsMoneyValue)})</>
              )}
              {progType === "PROGRESSIVE_DISCOUNT" && (
                <>{currentTier ? `Nível atual: ${currentTier.discountPercent}% OFF (${currentStamps} compras)` : `${currentStamps} pedidos realizados`}</>
              )}
              {(progType === "FREE_PRODUCT" || progType === "HYBRID") && (
                <>Progresso: <strong className="text-violet-700 font-extrabold">{currentStamps} de {maxStamps} selos</strong></>
              )}
            </p>
          </div>
        </div>

        {card?.totalCompleted ? (
          <span className="text-[11px] font-semibold text-slate-500 bg-white/80 px-2 py-1 rounded-md border border-slate-200">
            Resgatou {card.totalCompleted}x 🏆
          </span>
        ) : null}
      </div>

      {/* Mini Cartela de Selos */}
      {(progType === "FREE_PRODUCT" || progType === "HYBRID") && (
        <div className="mt-3 pt-3 border-t border-emerald-200/50">
          <div className="flex flex-wrap gap-1 items-center">
            {Array.from({ length: maxStamps }).map((_, idx) => {
              const hasStamp = idx < currentStamps;
              const isLast = idx === maxStamps - 1;
              return (
                <div
                  key={idx}
                  title={`Selo ${idx + 1}`}
                  className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                    hasStamp
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : isLast
                      ? "bg-amber-100 border border-amber-300 text-amber-700"
                      : "bg-white border border-slate-200 text-slate-400"
                  }`}
                >
                  {hasStamp ? <CheckCircle2 className="h-3 w-3" /> : isLast ? <Gift className="h-3 w-3" /> : idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ações de Resgate */}
      {hasAnyReward && (
        <div className="mt-3 pt-3 border-t border-emerald-200">
          {selectedReward ? (
            <div className="bg-emerald-600 text-white rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
                <span>{selectedReward.rewardTitle}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveReward}
                className="h-7 px-2 text-xs text-white hover:bg-emerald-700 hover:text-white"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Remover
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                  Deseja resgatar o benefício do cliente neste pedido?
                </span>

                <div className="flex gap-2 flex-wrap">
                  {hasStampsReward && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyStampsReward}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      <Gift className="h-3.5 w-3.5 mr-1.5" />
                      Resgatar Brinde ({program?.rewardText || "Prêmio"})
                    </Button>
                  )}

                  {hasCashbackReward && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyCashbackReward}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      <Percent className="h-3.5 w-3.5 mr-1.5" />
                      Abater Cashback ({formatBRL(Math.min(cashbackBalance, subtotal))})
                    </Button>
                  )}

                  {hasPointsReward && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyPointsReward}
                      className="h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                    >
                      <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                      Abater Pontos ({formatBRL(Math.min(pointsMoneyValue, subtotal))})
                    </Button>
                  )}

                  {hasProgressiveReward && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyProgressiveReward}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      <Percent className="h-3.5 w-3.5 mr-1.5" />
                      Aplicar {currentTier?.discountPercent}% OFF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
