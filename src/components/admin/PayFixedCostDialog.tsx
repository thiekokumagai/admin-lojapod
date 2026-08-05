import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { fixedCostService, FixedCost } from "@/services/fixed-cost.service";
import { cashRegisterService } from "@/services/cash-register.service";

interface PayFixedCostDialogProps {
  fixedCost: FixedCost | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PayFixedCostDialog({
  fixedCost,
  isOpen,
  onClose,
}: PayFixedCostDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Load cash registers to find the active one
  const { data: registers, isLoading: isLoadingRegisters } = useQuery({
    queryKey: ["cash-registers"],
    queryFn: cashRegisterService.findAll,
    enabled: isOpen,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openRegister = registers?.find((r) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  });

  // Initialize form values when dialog opens
  useEffect(() => {
    if (isOpen && fixedCost) {
      setAmount(fixedCost.value.toString());
      setDescription(`Pagamento: ${fixedCost.name}`);
    }
  }, [isOpen, fixedCost]);

  // Trigger when fixedCost changes
  const handleOpenChange = (open: boolean) => {
    if (open && fixedCost) {
      setAmount(fixedCost.value.toString());
      setDescription(`Pagamento: ${fixedCost.name}`);
    }
    if (!open) onClose();
  };

  const payMutation = useMutation({
    mutationFn: () => {
      if (!fixedCost) throw new Error("Sem conta fixa selecionada");
      return fixedCostService.pay(fixedCost.id, {
        amount: parseFloat(amount),
        cashRegisterId: openRegister?.id,
        description,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Pagamento registrado com sucesso no caixa ativo.",
      });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao pagar",
        description: error?.message || "Ocorreu um erro no registro.",
        variant: "destructive",
      });
    },
  });

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openRegister) return;
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do pagamento deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    payMutation.mutate();
  };

  if (!fixedCost) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Landmark className="h-5 w-5 text-primary" />
            Lançar Saída de Caixa
          </DialogTitle>
          <DialogDescription>
            Registre um pagamento para a conta fixa de **{fixedCost.name}**.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-6 py-4">
          {!isLoadingRegisters && !openRegister ? (
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Caixa Fechado</AlertTitle>
              <AlertDescription className="text-sm">
                Não há nenhum caixa ativo aberto para a data de hoje. Abra um caixa antes de registrar este pagamento.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-sky-50/10 text-sky-800 border-sky-200/20">
              <InfoAlertIcon />
              <AlertTitle className="font-semibold">Aviso de Conta Fixa</AlertTitle>
              <AlertDescription className="text-xs">
                Esta é uma conta fixa configurada. Alterar o valor abaixo registrará a saída real no caixa atual, sem alterar o valor base original da conta (**R$ {fixedCost.value.toFixed(2)}**).
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount" className="font-semibold text-gray-700">
                Valor Pago
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                <Input
                  id="amount"
                  value={amount !== "" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount)) : ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setAmount(digits ? (Number(digits) / 100).toString() : "");
                  }}
                  disabled={!openRegister || payMutation.isPending}
                  className="text-lg font-semibold h-11 pl-9"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description" className="font-semibold text-gray-700">
                Descrição no Extrato
              </Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!openRegister || payMutation.isPending}
                placeholder="Descrição opcional..."
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={payMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!openRegister || payMutation.isPending}
              className="bg-primary text-white hover:bg-primary/95"
            >
              {payMutation.isPending ? "Processando..." : "Confirmar Lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InfoAlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-sky-600 mr-2 inline-block"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
