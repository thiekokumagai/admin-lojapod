import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cashRegisterService } from "@/services/cash-register.service";

export default function CashRegistersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    initialValue: "",
  });

  const { data: registers, isLoading } = useQuery({
    queryKey: ["cash-registers"],
    queryFn: cashRegisterService.findAll,
  });

  const createMutation = useMutation({
    mutationFn: cashRegisterService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      toast.success("Caixa criado com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao criar caixa."),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => cashRegisterService.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register-summary"] });
      toast.success("Caixa atualizado com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar caixa."),
  });

  const deleteMutation = useMutation({
    mutationFn: cashRegisterService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      toast.success("Caixa excluído com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir caixa."),
  });

  const resetForm = () => {
    setFormData({ title: "", startDate: "", endDate: "", initialValue: "" });
    setEditingId(null);
  };

  const handleEdit = (register: any) => {
    setFormData({
      title: register.title,
      startDate: register.startDate.split("T")[0],
      endDate: register.endDate.split("T")[0],
      initialValue: register.initialValue 
        ? Number(register.initialValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
        : "",
    });
    setEditingId(register.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedInitialValue: number = 0;
    if (formData.initialValue) {
      parsedInitialValue = parseFloat(formData.initialValue.replace(/\./g, '').replace(',', '.'));
    }
    if (isNaN(parsedInitialValue)) parsedInitialValue = 0;

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData, initialValue: parsedInitialValue });
    } else {
      createMutation.mutate({
        ...formData,
        initialValue: parsedInitialValue,
      });
    }
  };

  if (isLoading) return <div className="p-8">Carregando caixas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Caixas</h1>
        <Button
          className="w-full md:w-auto"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Caixa
        </Button>
      </div>

      {/* Mobile Grid View */}
      <div className="grid md:hidden gap-3">
        {registers?.map((register) => (
          <div key={register.id} className="bg-white rounded-lg border shadow-sm p-4 flex flex-col gap-3">
             <div className="flex flex-col">
               <span className="font-bold text-slate-800">{register.title}</span>
               <span className="text-xs text-slate-500 mt-1">
                 {format(new Date(register.startDate.split("T")[0] + "T00:00:00"), "dd/MM/yyyy")} até {format(new Date(register.endDate.split("T")[0] + "T00:00:00"), "dd/MM/yyyy")}
               </span>
             </div>
             <div className="flex justify-between items-center pt-3 border-t border-slate-100">
               <div className="flex gap-2">
                 <Button variant="ghost" size="icon" onClick={() => handleEdit(register)} className="h-8 w-8 text-slate-500">
                   <Edit className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => { if (confirm("Tem certeza que deseja excluir?")) deleteMutation.mutate(register.id); }} className="h-8 w-8 text-red-500 hover:bg-red-50">
                   <Trash className="h-4 w-4" />
                 </Button>
               </div>
               <Link to={`/caixa/${register.id}`}>
                 <Button variant="outline" size="sm" className="h-8 text-xs font-bold">Relatório <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
               </Link>
             </div>
          </div>
        ))}
        {registers?.length === 0 && (
          <div className="text-center py-8 text-gray-500 border rounded-lg bg-white">Nenhum caixa encontrado.</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg border shadow-sm overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registers?.map((register) => (
              <TableRow key={register.id}>
                <TableCell className="font-medium">{register.title}</TableCell>
                <TableCell>
                  {format(new Date(register.startDate.split("T")[0] + "T00:00:00"), "dd/MM/yyyy")} até{" "}
                  {format(new Date(register.endDate.split("T")[0] + "T00:00:00"), "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(register)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir?")) {
                          deleteMutation.mutate(register.id);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                    <Link to={`/caixa/${register.id}`}>
                      <Button variant="outline" size="sm">
                        Relatório <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {registers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  Nenhum caixa encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Caixa" : "Novo Caixa"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título (ex: Março 2026)</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Fim</Label>
                <Input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Inicial de Caixa</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">R$</span>
                <Input
                  value={formData.initialValue}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (!val) {
                      setFormData({ ...formData, initialValue: "" });
                      return;
                    }
                    const num = Number(val) / 100;
                    setFormData({ 
                      ...formData, 
                      initialValue: num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    });
                  }}
                  placeholder="0,00"
                  className="pl-8"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
