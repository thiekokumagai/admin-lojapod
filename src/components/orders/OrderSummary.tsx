import { useState } from "react";
import { CreditCard, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useCoupons } from "@/hooks/useCoupons";
import type { Coupon } from "@/services/coupon.service";
import { useToast } from "@/components/ui/use-toast";

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  coupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
  paymentMethod: string;
  onPaymentMethodChange: (val: string) => void;
  creditInstallments: number;
  onCreditInstallmentsChange: (val: number) => void;
  installmentsOptions: { value: number; interest: number }[];
  isPaid: boolean;
  onIsPaidChange: (val: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  pixDiscountAmount: number;
  creditInterestAmount: number;
  isCalculatingFreight: boolean;
  isBudgetMode?: boolean;
  customTotal: string;
  onCustomTotalChange: (val: string) => void;
  showProductPrices: boolean;
  onShowProductPricesChange: (val: boolean) => void;
  needsChange: boolean;
  onNeedsChangeChange: (val: boolean) => void;
  changeFor: string;
  onChangeForChange: (val: string) => void;
}

export function OrderSummary({
  subtotal,
  deliveryFee,
  discount,
  total,
  coupon,
  onApplyCoupon,
  paymentMethod,
  onPaymentMethodChange,
  creditInstallments,
  onCreditInstallmentsChange,
  installmentsOptions,
  isPaid,
  onIsPaidChange,
  onSubmit,
  isSubmitting,
  isValid,
  pixDiscountAmount,
  creditInterestAmount,
  isCalculatingFreight,
  isBudgetMode,
  customTotal,
  onCustomTotalChange,
  showProductPrices,
  onShowProductPricesChange,
  needsChange,
  onNeedsChangeChange,
  changeFor,
  onChangeForChange
}: OrderSummaryProps) {
  const [couponCode, setCouponCode] = useState("");
  const { data: coupons } = useCoupons();
  const { toast } = useToast();

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      onApplyCoupon(null);
      return;
    }

    const found = coupons?.find(c => c.title.toUpperCase() === couponCode.trim().toUpperCase() && c.status);
    if (found) {
      if (found.minOrderValue && subtotal < found.minOrderValue) {
        toast({
          title: "Cupom inválido",
          description: `O valor mínimo para este cupom é ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(found.minOrderValue)}`,
          variant: "destructive"
        });
        return;
      }
      onApplyCoupon(found);
      toast({
        title: "Cupom aplicado!",
        description: "Desconto adicionado ao pedido."
      });
    } else {
      toast({
        title: "Cupom não encontrado",
        description: "Verifique o código e tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Coupon */}
      <div className="space-y-3">
        <Label className="text-slate-700 font-semibold flex items-center gap-2">
          <Tag className="h-4 w-4" /> Cupom de Desconto
        </Label>
        <div className="flex gap-2">
          <Input 
            placeholder="Código do cupom" 
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="h-10 uppercase"
          />
          <Button 
            variant="outline" 
            className="h-10 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
            onClick={handleApplyCoupon}
          >
            Aplicar
          </Button>
        </div>
        {coupon && (
          <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-md border border-emerald-100 flex items-center justify-between">
            <span>Cupom {coupon.title} aplicado!</span>
            <button onClick={() => { setCouponCode(""); onApplyCoupon(null); }} className="text-slate-400 hover:text-slate-600">
              Remover
            </button>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Payment Method */}
      <div className="space-y-3">
        <Label className="text-slate-700 font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Forma de Pagamento
        </Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PIX">Pix</SelectItem>
            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
          </SelectContent>
        </Select>

        {paymentMethod === "Cartão de Crédito" && installmentsOptions.length > 0 && (
          <div className="mt-3">
            <Select 
              value={creditInstallments.toString()} 
              onValueChange={(val) => onCreditInstallmentsChange(Number(val))}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione o parcelamento" />
              </SelectTrigger>
              <SelectContent>
                {installmentsOptions.map(opt => {
                  const baseForCredit = Math.max(0, subtotal - discount) + deliveryFee;
                  const totalWithInterest = baseForCredit * (1 + (opt.interest / 100));
                  const installmentValue = totalWithInterest / opt.value;
                  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentValue);

                  return (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.value}x de {formattedValue} {opt.interest > 0 ? `(com juros)` : `(sem juros)`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        {paymentMethod === "Dinheiro" && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="needs-change" className="text-slate-700 font-bold cursor-pointer">Precisa de troco?</Label>
              <Switch 
                id="needs-change" 
                checked={needsChange}
                onCheckedChange={onNeedsChangeChange}
              />
            </div>
            {needsChange && (
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-700">Troco para quanto?</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">R$</span>
                  <Input 
                    value={changeFor}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (!val) {
                        onChangeForChange("");
                        return;
                      }
                      const num = Number(val) / 100;
                      onChangeForChange(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    }}
                    placeholder="0,00"
                    className="pl-8"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
        <Label htmlFor="is-paid" className="text-slate-700 font-bold cursor-pointer">Pedido já está pago?</Label>
        <Switch 
          id="is-paid" 
          checked={isPaid}
          onCheckedChange={onIsPaidChange}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mt-3">
        <Label htmlFor="show-product-prices" className="text-slate-700 font-bold cursor-pointer">Mostrar Preços na Impressão</Label>
        <Switch 
          id="show-product-prices" 
          checked={showProductPrices}
          onCheckedChange={onShowProductPricesChange}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      <hr className="border-slate-100" />

      {/* Totals */}
      <div className="space-y-3">
        <div className="flex justify-between text-slate-500 font-medium">
          <span>Subtotal</span>
          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-slate-500 font-medium">
          <span>Frete</span>
          {isCalculatingFreight ? (
            <span className="text-slate-400 text-sm">Calculando...</span>
          ) : (
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
          )}
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Desconto (Cupom)</span>
            <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</span>
          </div>
        )}

        {pixDiscountAmount > 0 && paymentMethod === "PIX" && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Desconto (Pix)</span>
            <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pixDiscountAmount)}</span>
          </div>
        )}

        {creditInterestAmount > 0 && paymentMethod === "Cartão de Crédito" && (
          <div className="flex justify-between text-rose-600 font-bold">
            <span>Juros Cartão</span>
            <span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(creditInterestAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center text-slate-800 font-black text-xl pt-3 border-t border-slate-100">
          <span>Total Calculado</span>
          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
        </div>
        
        <div className="flex justify-between items-center pt-3">
          <Label className="text-slate-700 font-bold">Total Final (Editar) <span className="font-normal text-slate-400 text-xs ml-1">(Opcional)</span></Label>
          <div className="relative w-32">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">R$</span>
            <Input 
              value={customTotal} 
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "");
                if (!val) {
                  onCustomTotalChange("");
                  return;
                }
                const num = Number(val) / 100;
                onCustomTotalChange(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
              }} 
              placeholder={total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              className="pl-8 font-bold h-10"
            />
          </div>
        </div>
      </div>

      <Button 
        className={`w-full h-12 rounded-xl font-bold text-white shadow-sm ${isBudgetMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-violet-600 hover:bg-violet-700'}`}
        disabled={!isValid || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? "Finalizando..." : (isBudgetMode ? "Orçamento (Não Salva)" : "Finalizar Pedido")}
      </Button>
    </div>
  );
}
