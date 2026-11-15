import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { couriersService } from "@/services/couriers.service";
import { dismissCourierImpact, useCourierImpact } from "@/lib/courier-impact-store";
import { formatCurrency } from "@/utils/formatters";
import { parseMoneyInput } from "@/utils/money-input";

const toInput = (value: number) => value.toFixed(2).replace(".", ",");

/**
 * Modal global: aparece depois de cancelar (ou reativar) um pedido que estava numa rota de motoboy.
 * Cancelar: já vem com a taxa reduzida sugerida, editável. Reativar: só avisa, com a taxa atual, sem recalcular.
 */
export default function CourierFeeAdjustDialog() {
  const impact = useCourierImpact();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!impact) return;
    setValue(toInput(impact.kind === "CANCELLED" ? (impact.suggestedAmount ?? impact.amount) : impact.amount));
  }, [impact]);

  if (!impact) return null;

  const isCancel = impact.kind === "CANCELLED";
  const parsed = parseMoneyInput(value);
  const orderLabel = impact.orderNumber ? `#${impact.orderNumber}` : "do pedido";

  const apply = async () => {
    if (parsed === null) return;
    // Mesmo valor que já está lá: nada a gravar
    if (Math.round(parsed * 100) === Math.round(impact.amount * 100)) {
      dismissCourierImpact();
      return;
    }
    setSaving(true);
    try {
      await couriersService.adjustFee(impact.transactionId, parsed);
      toast.success(`Taxa de ${impact.courierName} ajustada para ${formatCurrency(parsed)}`);
      queryClient.invalidateQueries({ queryKey: ["courier-route"] });
      queryClient.invalidateQueries({ queryKey: ["couriers"] });
      dismissCourierImpact();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ajustar a taxa do motoboy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && dismissCourierImpact()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCancel ? `Pedido ${orderLabel} cancelado: taxa do motoboy` : `Pedido ${orderLabel} reativado: confira a taxa`}
          </DialogTitle>
          <DialogDescription>
            {isCancel
              ? `Este pedido estava na rota de ${impact.courierName}. O motoboy não recebe por pedido cancelado.`
              : `Este pedido voltou para a rota de ${impact.courierName}. Se a taxa foi reduzida quando ele foi cancelado, ela não voltou sozinha: ajuste abaixo se quiser.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Taxa atual da rota</span>
            <span className="font-bold text-slate-800">{formatCurrency(impact.amount)}</span>
          </div>
          {isCancel && (
            <p className="text-xs text-slate-500">
              Sugestão: {formatCurrency(impact.amount)} dividido por {impact.activeOrdersBefore}{" "}
              {impact.activeOrdersBefore === 1 ? "pedido ativo" : "pedidos ativos"} tira{" "}
              {formatCurrency(impact.shareAmount ?? 0)} do pedido cancelado.
            </p>
          )}
          <div className="space-y-1">
            <label htmlFor="courier-fee-amount" className="text-xs font-bold uppercase tracking-wide text-slate-600">
              {isCancel ? "Novo valor da taxa (R$)" : "Valor da taxa (R$)"}
            </label>
            <Input
              id="courier-fee-amount"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void apply();
              }}
              aria-invalid={parsed === null}
              disabled={saving}
            />
            {parsed === null && <p className="text-xs font-semibold text-rose-600">Informe um valor válido (zero ou mais).</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => dismissCourierImpact()} disabled={saving}>
            Manter valor
          </Button>
          <Button type="button" onClick={() => void apply()} disabled={saving || parsed === null}>
            {saving ? "Aplicando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
