import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRegisterPurchase } from "@/hooks/useInvestments";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterPurchaseModal({ isOpen, onClose }: Props) {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const registerMutation = useRegisterPurchase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;

    registerMutation.mutate(
      { amount: Number(amount), description },
      {
        onSuccess: () => {
          setAmount("");
          setDescription("");
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Compra / Gasto</DialogTitle>
          <DialogDescription>
            Registre a compra de produtos com fornecedores. Este valor será subtraído da sua carteira de investimentos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor da Compra (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input
                id="amount"
                value={amount !== "" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount)) : ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setAmount(digits ? (Number(digits) / 100).toString() : "");
                }}
                className="pl-9"
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compra de 50 camisetas com fornecedor X"
              required
            />
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={registerMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Registrando..." : "Registrar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
