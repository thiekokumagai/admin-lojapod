import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Courier, couriersService } from "@/services/couriers.service";
import { formatCurrency } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, ArrowUpRight, ArrowDownRight, User } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CourierDetailsPage() {
  const { id } = useParams();
  const [courier, setCourier] = useState<Courier | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("TODAY");

  const fetchCourier = async () => {
    try {
      if (!id) return;
      setLoading(true);
      const data = await couriersService.getCourier(id);
      setCourier(data);
    } catch (error: any) {
      toast.error("Erro ao carregar detalhes do motoboy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourier();
  }, [id]);

  const handleDelete = async (txId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      await couriersService.deleteTransaction(txId);
      toast.success("Lançamento excluído com sucesso!");
      fetchCourier();
    } catch (error: any) {
      toast.error("Erro ao excluir lançamento");
    }
  };

  if (loading) {
    return <div className="p-8">Carregando detalhes...</div>;
  }

  if (!courier) {
    return <div className="p-8">Motoboy não encontrado.</div>;
  }

  const filteredTransactions = courier.transactions?.filter((tx) => {
    if (filterPeriod === "ALL") return true;
    const date = new Date(tx.date);
    if (filterPeriod === "TODAY") return isToday(date);
    if (filterPeriod === "WEEK") return isThisWeek(date, { weekStartsOn: 1 });
    if (filterPeriod === "MONTH") return isThisMonth(date);
    return true;
  }) || [];

  const totalFee = filteredTransactions.filter(t => t.type === "FEE").reduce((acc, t) => acc + t.amount, 0);
  const totalReceived = filteredTransactions.filter(t => t.type === "PAYMENT").reduce((acc, t) => acc + t.amount, 0);
  const totalDeliveries = filteredTransactions.filter(t => t.type === "FEE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/motoboys">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <User className="h-6 w-6 md:h-7 md:w-7 text-indigo-600" />
              {courier.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Telefone: {courier.phone}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Resumo Financeiro</h2>
        <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todo o Período</SelectItem>
            <SelectItem value="TODAY">Hoje</SelectItem>
            <SelectItem value="WEEK">Nesta Semana</SelectItem>
            <SelectItem value="MONTH">Neste Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-100 bg-indigo-50/10 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-indigo-800 font-bold">Saldo Atual A Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-indigo-600">
              {formatCurrency(courier.balance)}
            </p>
            <p className="text-[10px] text-indigo-500 mt-1 uppercase font-semibold">Valor fixo</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/10 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-emerald-800 font-bold">Total de Entregas (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(totalFee)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/10 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-rose-800 font-bold">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-rose-600">
              {formatCurrency(totalReceived)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/10 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-amber-800 font-bold">Qtd de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-600">
              {totalDeliveries}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b py-4">
          <CardTitle className="text-base font-bold text-slate-700">Histórico de Corridas e Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Grid View */}
          <div className="grid md:hidden gap-3 p-4 bg-slate-50/30">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="border rounded-lg p-4 flex flex-col gap-3 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-sm">{tx.description}</span>
                    <span className="text-xs text-slate-500 font-medium mt-1">
                      {format(new Date(tx.date), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <span className={`font-black ${tx.type === "FEE" ? "text-emerald-600" : "text-rose-600"}`}>
                    {tx.type === "FEE" ? "+" : "-"} {formatCurrency(tx.amount)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {tx.type === "FEE" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                      <ArrowUpRight className="h-3 w-3 text-emerald-600" /> Corrida (Taxa)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-100">
                      <ArrowDownRight className="h-3 w-3 text-rose-600" /> Pagamento
                    </span>
                  )}
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100 mt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tx.id)}
                    className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500 border rounded-lg bg-white text-sm">
                Nenhuma movimentação registrada.
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-slate-500 text-xs font-medium">
                      {format(new Date(tx.date), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-700">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      {tx.type === "FEE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                          Corrida (Taxa)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-100">
                          <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                          Pagamento
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-black ${tx.type === "FEE" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tx.type === "FEE" ? "+" : "-"} {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tx.id)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhuma movimentação registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
