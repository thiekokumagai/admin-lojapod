import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Courier, couriersService } from "@/services/couriers.service";
import { formatCurrency, formatPhone } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, ArrowUpRight, ArrowDownRight, User, Pencil } from "lucide-react";
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

  // Edit Courier form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const openEditModal = () => {
    if (!courier) return;
    setEditName(courier.name);
    setEditPhone(formatPhone(courier.phone));
    setEditIsActive(courier.isActive ?? true);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courier || isSavingEdit) return;
    try {
      setIsSavingEdit(true);
      await couriersService.updateCourier(courier.id, {
        name: editName,
        phone: editPhone,
        isActive: editIsActive,
      });
      toast.success("Motoboy atualizado com sucesso");
      setIsEditOpen(false);
      fetchCourier();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar motoboy");
    } finally {
      setIsSavingEdit(false);
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
              {!courier.isActive && (
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-0.5 rounded-full">Inativo</span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Telefone: {formatPhone(courier.phone)}</p>
          </div>
        </div>
        <Button variant="outline" onClick={openEditModal} className="font-bold text-xs">
          <Pencil className="w-3.5 h-3.5 mr-2" /> Editar Motoboy
        </Button>
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

      {/* Modal Editar Motoboy */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Motoboy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Telefone / WhatsApp</label>
              <Input 
                value={editPhone} 
                onChange={(e) => setEditPhone(formatPhone(e.target.value))} 
                required 
                placeholder="(11) 99999-9999" 
                maxLength={15}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="editIsActiveDetails"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="editIsActiveDetails" className="text-sm font-medium text-slate-700 cursor-pointer">
                Motoboy Ativo
              </label>
            </div>
            <Button type="submit" disabled={isSavingEdit} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {isSavingEdit ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
