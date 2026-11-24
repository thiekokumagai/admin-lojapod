import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Loader2, Scale, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useScale } from "@/hooks/useScale";
import {
  formatKg,
  isValidWeight,
  MAX_WEIGHT_KG,
  netWeightKg,
  parseWeightInput,
  weighedPrice,
  type WeightSource,
  type WeightUnit,
} from "@/lib/weight";
import { cn } from "@/lib/utils";

export interface WeighingProduct {
  id: string;
  title: string;
  price?: number;
  promotionalPrice?: number;
  tareWeightGrams?: number | null;
}

export interface WeighingResult {
  weightKg: number;
  unitPricePerKg: number;
  price: number;
  weightSource: WeightSource;
}

type Mode = "scale" | "manual";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Pesagem de um produto vendido por peso.
 * - Balança conectada (agente na loja): peso ao vivo e "Capturar" só com o peso estável.
 * - Sem balança, conexão caída ou peso parado há mais de 3 s: abre o modo de digitar o peso (g ou kg).
 * O operador troca de modo quando quiser. Enter confirma.
 */
export function WeighingDialog({
  open,
  onOpenChange,
  product,
  promoAllowed,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: WeighingProduct | null;
  promoAllowed: boolean;
  /** `keepOpen`: o operador quer pesar outra porção do mesmo produto em seguida. */
  onConfirm: (result: WeighingResult, keepOpen: boolean) => void;
}) {
  const scale = useScale({ enabled: open, watch: open });
  const [mode, setMode] = useState<Mode>("scale");
  const [userPickedMode, setUserPickedMode] = useState(false);
  const [autoFallbackNotice, setAutoFallbackNotice] = useState<string | null>(null);
  const [tareText, setTareText] = useState("");
  const [manualText, setManualText] = useState("");
  const [manualUnit, setManualUnit] = useState<WeightUnit>("g");
  const manualInputRef = useRef<HTMLInputElement>(null);

  const pricePerKg = product?.price ?? 0;

  // Reabre limpo a cada produto
  useEffect(() => {
    if (!open) return;
    setTareText(product?.tareWeightGrams ? String(product.tareWeightGrams) : "");
    setManualText("");
    setUserPickedMode(false);
    setAutoFallbackNotice(null);
    setMode("scale");
  }, [open, product?.id, product?.tareWeightGrams]);

  const hasDevice = scale.status === "online" && !!scale.selected;
  // Dá um instante para conectar antes de concluir que não há balança
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    if (!open) return;
    setGraceOver(false);
    const t = setTimeout(() => setGraceOver(true), 3000);
    return () => clearTimeout(t);
  }, [open, product?.id]);

  // Cai para o modo manual sozinho se não há balança ou se o peso parou de chegar
  useEffect(() => {
    if (!open || userPickedMode || mode !== "scale" || !graceOver) return;
    let reason: string | null = null;
    if (scale.status !== "online") reason = "Sem conexão com a balança. Digite o peso.";
    else if (!scale.selected) reason = "Nenhuma balança conectada nesta loja. Digite o peso.";
    else if (!scale.isFresh) reason = "A balança parou de responder. Digite o peso.";
    if (reason) {
      setAutoFallbackNotice(reason);
      setMode("manual");
    }
  }, [open, userPickedMode, mode, graceOver, scale.status, scale.selected, scale.isFresh]);

  useEffect(() => {
    if (mode === "manual" && open) setTimeout(() => manualInputRef.current?.focus(), 50);
  }, [mode, open]);

  const tareGrams = Math.min(5000, Math.max(0, Number.parseInt(tareText || "0", 10) || 0));
  const grossKg =
    mode === "scale"
      ? scale.reading?.weightKg ?? null
      : parseWeightInput(manualText, manualUnit);
  const netKg = grossKg === null ? null : netWeightKg(grossKg, tareGrams);
  const priced = useMemo(
    () =>
      netKg && netKg > 0
        ? weighedPrice({ weightKg: netKg, pricePerKg, promoPricePerKg: product?.promotionalPrice, promoAllowed })
        : null,
    [netKg, pricePerKg, product?.promotionalPrice, promoAllowed],
  );

  const scaleReady = mode === "scale" && hasDevice && scale.isFresh && !!scale.reading?.stable;
  const weightOk = netKg !== null && isValidWeight(netKg);
  const canConfirm = !!product && pricePerKg > 0 && weightOk && !!priced && (mode === "manual" || scaleReady);

  const confirm = (keepOpen: boolean) => {
    if (!canConfirm || !priced || netKg === null) return;
    onConfirm(
      {
        weightKg: netKg,
        unitPricePerKg: priced.unitPricePerKg,
        price: priced.price,
        weightSource: mode === "scale" ? "SCALE" : "MANUAL",
      },
      keepOpen,
    );
    if (keepOpen) setManualText("");
  };

  const pickMode = (value: string) => {
    if (value !== "scale" && value !== "manual") return;
    setUserPickedMode(true);
    setAutoFallbackNotice(null);
    setMode(value);
  };

  let weightHint: string | null = null;
  if (netKg !== null && netKg > MAX_WEIGHT_KG) weightHint = `Peso acima de ${MAX_WEIGHT_KG} kg.`;
  else if (grossKg !== null && netKg === 0) weightHint = "O peso é menor que a tara.";
  else if (mode === "scale" && hasDevice && scale.reading && !scale.reading.stable) weightHint = "Aguardando o peso estabilizar…";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            confirm(false);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-600" /> Pesar {product?.title}
          </DialogTitle>
          <DialogDescription>
            {pricePerKg > 0 ? (
              <>
                {brl.format(priced?.unitPricePerKg ?? pricePerKg)}/kg
                {priced && priced.unitPricePerKg < pricePerKg && " (promocional)"}
              </>
            ) : (
              <span className="text-rose-600">Produto sem preço por kg no cadastro.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ToggleGroup type="single" value={mode} onValueChange={pickMode} className="grid grid-cols-2 gap-2">
          <ToggleGroupItem value="scale" className="gap-2 border" aria-label="Usar balança">
            <Scale className="h-4 w-4" /> Balança
          </ToggleGroupItem>
          <ToggleGroupItem value="manual" className="gap-2 border" aria-label="Digitar peso">
            <Keyboard className="h-4 w-4" /> Digitar
          </ToggleGroupItem>
        </ToggleGroup>

        {autoFallbackNotice && mode === "manual" && (
          <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <WifiOff className="h-3.5 w-3.5 shrink-0" /> {autoFallbackNotice}
          </p>
        )}

        {mode === "scale" ? (
          <div className="space-y-3">
            {scale.devices.length > 1 && (
              <div className="space-y-1">
                <Label>Balança</Label>
                <Select value={scale.selected?.deviceId} onValueChange={scale.setDeviceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a balança" />
                  </SelectTrigger>
                  <SelectContent>
                    {scale.devices.map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div
              className={cn(
                "rounded-2xl border-2 p-4 text-center transition-colors",
                scaleReady ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50",
              )}
              data-testid="scale-live-weight"
            >
              {!hasDevice ? (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Procurando balança…
                </div>
              ) : (
                <>
                  <div className="text-xs font-medium text-slate-500">{scale.selected?.name}</div>
                  <div className="text-4xl font-extrabold tabular-nums text-slate-800">
                    {scale.reading ? formatKg(scale.reading.weightKg) : "—"}
                  </div>
                  <div className={cn("text-xs font-semibold", scaleReady ? "text-emerald-700" : "text-slate-500")}>
                    {!scale.isFresh ? "Sem leitura" : scale.reading?.stable ? "Peso estável" : "Estabilizando…"}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="manual-weight">Peso na balança</Label>
            <div className="flex gap-2">
              <Input
                id="manual-weight"
                ref={manualInputRef}
                inputMode="decimal"
                autoComplete="off"
                placeholder={manualUnit === "g" ? "Ex: 650" : "Ex: 0,650"}
                value={manualText}
                onChange={(e) => setManualText(e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))}
                className="h-12 text-lg font-semibold"
              />
              <ToggleGroup
                type="single"
                value={manualUnit}
                onValueChange={(v) => (v === "g" || v === "kg") && setManualUnit(v)}
                className="shrink-0"
              >
                <ToggleGroupItem value="g" className="h-12 border px-4">g</ToggleGroupItem>
                <ToggleGroupItem value="kg" className="h-12 border px-4">kg</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-slate-50 p-2">
            <div className="text-[11px] text-slate-500">Bruto</div>
            <div className="font-semibold tabular-nums">{grossKg !== null ? formatKg(grossKg) : "—"}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <Label htmlFor="tare" className="text-[11px] font-normal text-slate-500">Tara (g)</Label>
            <Input
              id="tare"
              inputMode="numeric"
              value={tareText}
              onChange={(e) => setTareText(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-0.5 h-7 text-center font-semibold"
              placeholder="0"
            />
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <div className="text-[11px] text-slate-500">Líquido</div>
            <div className="font-semibold tabular-nums">{netKg !== null ? formatKg(netKg) : "—"}</div>
          </div>
        </div>

        <div className="flex items-baseline justify-between rounded-xl bg-violet-50 px-4 py-3">
          <span className="text-sm font-medium text-violet-800">Valor</span>
          <span className="text-2xl font-extrabold text-violet-900 tabular-nums" data-testid="weighing-price">
            {priced ? brl.format(priced.price) : "—"}
          </span>
        </div>
        {weightHint && <p className="text-xs font-medium text-amber-700">{weightHint}</p>}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" disabled={!canConfirm} onClick={() => confirm(true)}>
            Adicionar e pesar outro
          </Button>
          <Button type="button" disabled={!canConfirm} onClick={() => confirm(false)}>
            {mode === "scale" ? "Capturar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
