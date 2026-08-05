import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useCreateCoupon, useUpdateCoupon } from "@/hooks/useCoupons";
import { Coupon } from "@/services/coupon.service";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon;
}

export default function CouponFormModal({ isOpen, onClose, coupon }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"VALUE" | "PERCENTAGE" | "FREE_SHIPPING">("PERCENTAGE");
  const [value, setValue] = useState<number | "">("");
  const [validUntilDate, setValidUntilDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [minOrderValue, setMinOrderValue] = useState<number | "">("");
  const [applyToPromotionalItems, setApplyToPromotionalItems] = useState(false);
  const [status, setStatus] = useState(true);

  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (coupon) {
      setTitle(coupon.title);
      setType(coupon.type);
      setValue(coupon.value ?? "");
      setValidUntilDate(coupon.validUntilDate ? new Date(coupon.validUntilDate).toISOString().split('T')[0] : "");
      setStartTime(coupon.startTime ? new Date(coupon.startTime).toISOString().substring(11, 16) : "");
      setEndTime(coupon.endTime ? new Date(coupon.endTime).toISOString().substring(11, 16) : "");
      setMaxUses(coupon.maxUses ?? "");
      setMinOrderValue(coupon.minOrderValue ?? "");
      setApplyToPromotionalItems(coupon.applyToPromotionalItems);
      setStatus(coupon.status);
    } else {
      setTitle("");
      setType("PERCENTAGE");
      setValue("");
      setValidUntilDate("");
      setStartTime("");
      setEndTime("");
      setMaxUses("");
      setMinOrderValue("");
      setApplyToPromotionalItems(false);
      setStatus(true);
    }
  }, [coupon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Título é obrigatório");

    if (type !== "FREE_SHIPPING" && (value === "" || Number(value) <= 0)) {
      return toast.error("Informe um valor de desconto válido.");
    }

    let startFullTime = "";
    if (startTime) {
      const today = new Date().toISOString().split('T')[0];
      startFullTime = `${today}T${startTime}:00Z`;
    }

    let endFullTime = "";
    if (endTime) {
      const today = new Date().toISOString().split('T')[0];
      endFullTime = `${today}T${endTime}:00Z`;
    }

    const payload = {
      title: title.toUpperCase(),
      type,
      status,
      value: type === "FREE_SHIPPING" ? undefined : Number(value),
      validUntilDate: validUntilDate ? new Date(validUntilDate).toISOString() : undefined,
      startTime: startFullTime || undefined,
      endTime: endFullTime || undefined,
      maxUses: maxUses === "" ? undefined : Number(maxUses),
      minOrderValue: minOrderValue === "" ? undefined : Number(minOrderValue),
      applyToPromotionalItems,
    };

    if (coupon) {
      updateMutation.mutate(
        { id: coupon.id, payload },
        {
          onSuccess: () => {
            toast.success("Cupom atualizado com sucesso!");
            onClose();
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || "Erro ao atualizar cupom");
          }
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Cupom criado com sucesso!");
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Erro ao criar cupom");
        }
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden p-0 rounded-2xl border-slate-200">
        <DialogHeader className="bg-slate-50/80 px-6 py-5 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {coupon ? "Editar Cupom" : "Novo Cupom"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
          <form id="coupon-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title" className="text-slate-700 font-bold">Código do Cupom</Label>
                <Input 
                  id="title" 
                  placeholder="EX: BEMVINDO10" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-700 font-bold">Tipo de Desconto</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-violet-600 font-medium">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Porcentagem (%)</SelectItem>
                    <SelectItem value="VALUE">Valor Fixo (R$)</SelectItem>
                    <SelectItem value="FREE_SHIPPING">Frete Grátis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="text-slate-700 font-bold">Valor do Desconto</Label>
                {type === "VALUE" ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                    <Input 
                      id="value" 
                      placeholder="0,00" 
                      value={value !== "" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) : ""}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setValue(digits ? Number(digits) / 100 : "");
                      }}
                      className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium pl-9"
                    />
                  </div>
                ) : (
                  <Input 
                    id="value" 
                    type="number" 
                    step="0.01"
                    placeholder={type === "FREE_SHIPPING" ? "N/A" : "EX: 10"} 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={type === "FREE_SHIPPING"}
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium"
                  />
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="minOrderValue" className="text-slate-700 font-bold">Valor Mínimo do Pedido</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                  <Input 
                    id="minOrderValue" 
                    placeholder="Deixe em branco se não houver" 
                    value={minOrderValue !== "" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(minOrderValue)) : ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setMinOrderValue(digits ? Number(digits) / 100 : "");
                    }}
                    className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="validUntilDate" className="text-slate-700 font-bold">Data de Validade</Label>
                <Input 
                  id="validUntilDate" 
                  type="date" 
                  value={validUntilDate}
                  onChange={(e) => setValidUntilDate(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-slate-700 font-bold">Hora Inicial</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-slate-700 font-bold">Hora Final</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="maxUses" className="text-slate-700 font-bold">Nº Máximo de Usos</Label>
                <Input 
                  id="maxUses" 
                  type="number" 
                  placeholder="Deixe em branco se não houver limite" 
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-violet-600 font-medium"
                />
              </div>

              <div className="col-span-2 flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-800">Aplicar em Itens Promocionais?</Label>
                  <p className="text-[13px] text-slate-500">
                    Permite usar o cupom em produtos que já estão em promoção.
                  </p>
                </div>
                <Switch 
                  checked={applyToPromotionalItems}
                  onCheckedChange={setApplyToPromotionalItems}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>

              <div className="col-span-2 flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-800">Status do Cupom</Label>
                  <p className="text-[13px] text-slate-500">
                    Habilita ou desabilita o uso imediato do cupom.
                  </p>
                </div>
                <Switch 
                  checked={status}
                  onCheckedChange={setStatus}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="bg-slate-50/80 p-5 border-t border-slate-100 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="h-11 font-bold text-slate-600 hover:bg-slate-200/50 hover:text-slate-800 rounded-xl"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="coupon-form"
            disabled={isSubmitting}
            className="h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 rounded-xl shadow-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
            ) : coupon ? "Salvar Alterações" : "Criar Cupom"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
