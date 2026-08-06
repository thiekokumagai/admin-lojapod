import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import CashRegisterDetailsPage from "./CashRegisterDetailsPage";
import { Button } from "@/components/ui/button";
import { cashRegisterService } from "@/services/cash-register.service";

export default function CurrentCashRegisterPage() {
  const { data: registers, isLoading } = useQuery({
    queryKey: ["cash-registers"],
    queryFn: cashRegisterService.findAll,
  });

  if (isLoading) return <div className="p-8">Verificando caixa atual...</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openRegister = registers?.find((r) => {
    const start = new Date(r.startDate.split("T")[0] + "T00:00:00");
    const end = new Date(r.endDate.split("T")[0] + "T00:00:00");
    
    // Normalize to midnight for fair comparison
    start.setHours(0, 0, 0, 0);
    // End date should be at the very end of the day, or we just compare midnight <= midnight
    // Since endDate is inclusive, if today is <= endDate, it's open.
    end.setHours(23, 59, 59, 999);

    return today >= start && today <= end;
  });

  if (openRegister) {
    return <CashRegisterDetailsPage currentId={openRegister.id} />;
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <h2 className="text-3xl font-bold text-gray-800">Nenhum Caixa Aberto</h2>
      <p className="text-gray-500 max-w-md">
        Você não possui nenhum caixa aberto ou vigente para a data de hoje. 
        Para registrar recebimentos corretamente, você precisa abrir um caixa para este período.
      </p>
      <Link to="/caixa">
        <Button size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Gerenciar Caixas
        </Button>
      </Link>
    </div>
  );
}
