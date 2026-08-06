import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentService } from "@/services/investment.service";
import { toast } from "@/components/ui/use-toast";
import { fixedCostService } from "@/services/fixed-cost.service";

export function useInvestmentSummary() {
  return useQuery({
    queryKey: ["investment-summary"],
    queryFn: investmentService.getSummary,
  });
}

export function useInvestmentTransactions() {
  return useQuery({
    queryKey: ["investment-transactions"],
    queryFn: investmentService.getTransactions,
  });
}

export function usePurchaseAnalysis(params: import("@/services/investment.service").PurchaseAnalysisParams, enabled: boolean) {
  return useQuery({
    queryKey: ["purchase-analysis", params],
    queryFn: () => investmentService.getPurchaseAnalysis(params),
    enabled,
  });
}

export function useAddInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { amount: number; description?: string; cashRegisterId?: string }) => {
      const result = await investmentService.addInvestment({
        amount: payload.amount,
        description: payload.description,
      });

      if (payload.cashRegisterId) {
        try {
          await fixedCostService.createManualTransaction(payload.cashRegisterId, {
            type: "OUTFLOW",
            amount: payload.amount,
            description: payload.description || "Transferência para Investimento",
            category: "INVESTMENT",
          });
        } catch (err) {
          console.error("Erro ao descontar do caixa:", err);
          throw new Error("Investimento adicionado, mas falhou ao descontar do caixa atual.");
        }
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Investimento adicionado", description: "O valor foi transferido com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
      queryClient.invalidateQueries({ queryKey: ["investment-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-summary"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar investimento",
        description: error.message || "Ocorreu um erro.",
      });
    },
  });
}

export function useRegisterPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: investmentService.registerPurchase,
    onSuccess: () => {
      toast({ title: "Compra registrada", description: "O valor foi subtraído da sua carteira de investimentos." });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
      queryClient.invalidateQueries({ queryKey: ["investment-transactions"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao registrar compra",
        description: error.message || "Ocorreu um erro.",
      });
    },
  });
}

export function useDeleteInvestmentTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: investmentService.deleteTransaction,
    onSuccess: () => {
      toast({ title: "Transação excluída", description: "A transação de investimento foi excluída com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["investment-summary"] });
      queryClient.invalidateQueries({ queryKey: ["investment-transactions"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir transação",
        description: error.message || "Ocorreu um erro.",
      });
    },
  });
}
