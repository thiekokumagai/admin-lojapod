import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Trash2,
  Edit,
  Receipt,
  DollarSign,
  Calendar,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { fixedCostService, FixedCost } from "@/services/fixed-cost.service";
import PayFixedCostDialog from "@/components/admin/PayFixedCostDialog";

const fixedCostSchema = z.object({
  name: z.string().min(2, "O nome deve conter pelo menos 2 caracteres"),
  value: z.coerce.number().min(0, "O valor deve ser positivo"),
  repeats: z.boolean().default(true),
  type: z.string().default("ALWAYS"),
  installmentsCount: z.coerce.number().nullable().optional(),
});

type FixedCostFormData = z.infer<typeof fixedCostSchema>;

export default function CustosFixosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [payingCost, setPayingCost] = useState<FixedCost | null>(null);

  // Queries
  const { data: costs, isLoading } = useQuery<FixedCost[]>({
    queryKey: ["fixed-costs"],
    queryFn: fixedCostService.findAll,
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FixedCostFormData>({
    resolver: zodResolver(fixedCostSchema),
    defaultValues: {
      name: "",
      value: 0,
      repeats: true,
      type: "ALWAYS",
      installmentsCount: 1,
    },
  });

  const watchRepeats = watch("repeats");
  const watchType = watch("type");

  // Mutações
  const createMutation = useMutation({
    mutationFn: fixedCostService.create,
    onSuccess: () => {
      toast({ title: "Conta criada!", description: "Conta fixa configurada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
      handleCloseSheet();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fixedCostService.update(id, data),
    onSuccess: () => {
      toast({ title: "Conta atualizada!", description: "Conta fixa editada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
      handleCloseSheet();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: fixedCostService.delete,
    onSuccess: () => {
      toast({ title: "Conta removida!", description: "Conta excluída com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
    },
  });

  const handleOpenCreateSheet = () => {
    setEditingCost(null);
    reset({
      name: "",
      value: 0,
      repeats: true,
      type: "ALWAYS",
      installmentsCount: 1,
    });
    setIsSheetOpen(true);
  };

  const handleOpenEditSheet = (cost: FixedCost) => {
    setEditingCost(cost);
    reset({
      name: cost.name,
      value: cost.value,
      repeats: cost.repeats,
      type: cost.type,
      installmentsCount: cost.installmentsCount || 1,
    });
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingCost(null);
  };

  const onSubmitForm = (data: FixedCostFormData) => {
    const payload = {
      name: data.name,
      value: data.value,
      repeats: data.repeats,
      type: data.repeats ? data.type : "ALWAYS",
      installmentsCount:
        data.repeats && data.type === "INSTALLMENTS"
          ? data.installmentsCount
          : null,
    };

    if (editingCost) {
      updateMutation.mutate({ id: editingCost.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente remover esta conta fixa?")) {
      deleteMutation.mutate(id);
    }
  };

  // Cálculos de resumo
  const totalCostValue = costs?.reduce((acc, c) => acc + c.value, 0) || 0;
  const totalAccounts = costs?.length || 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Custos Fixos / Contas Fixas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie seus custos fixos estimados como aluguel, luz, marketing e registre saídas diretamente no caixa vigente.
          </p>
        </div>
        <Button onClick={handleOpenCreateSheet} className="gap-2 font-semibold w-full md:w-auto">
          <Plus className="h-5 w-5" />
          Nova Conta Fixa
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">
              Total de Contas Cadastradas
            </CardTitle>
            <Receipt className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{totalAccounts}</div>
            <CardDescription className="text-xs text-gray-400 mt-1">
              Contas configuradas no painel
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-gray-500">
              Custo Mensal Estimado
            </CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              R$ {totalCostValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <CardDescription className="text-xs text-gray-400 mt-1">
              Soma total dos valores bases estimados
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Listagem */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-800">Suas Contas Fixas</CardTitle>
          <CardDescription>Visualização completa dos custos configurados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Carregando custos fixos...</div>
          ) : !costs || costs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Landmark className="h-12 w-12 mx-auto text-gray-200" />
              <p className="font-semibold text-gray-500">Nenhum custo fixo cadastrado</p>
              <p className="text-xs text-gray-400">Clique em "Nova Conta Fixa" para registrar sua primeira conta.</p>
            </div>
          ) : (
            <>
              {/* Mobile Grid View */}
              <div className="grid md:hidden gap-3">
                 {costs.map((cost) => (
                    <div key={cost.id} className="border rounded-lg p-4 flex flex-col gap-3 bg-white shadow-sm">
                       <div className="flex justify-between items-start">
                         <div className="flex flex-col">
                           <span className="font-bold text-gray-800">{cost.name}</span>
                           <span className="font-medium text-gray-600 mt-1">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cost.value)}</span>
                         </div>
                         <div className="flex text-right">
                           {!cost.repeats ? (
                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">Não repete</span>
                           ) : cost.type === "ALWAYS" ? (
                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800">Mensal</span>
                           ) : (
                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800">Parcelado ({cost.installmentsCount}x)</span>
                           )}
                         </div>
                       </div>
                       <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100">
                           <Button size="sm" variant="outline" className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border-emerald-100/50 gap-1 font-semibold" onClick={() => setPayingCost(cost)}>
                             <DollarSign className="h-4 w-4" /> Pagar / Lançar Saída
                           </Button>
                           <div className="grid grid-cols-2 gap-2">
                             <Button size="sm" variant="outline" className="w-full font-medium" onClick={() => handleOpenEditSheet(cost)}>
                               <Edit className="h-4 w-4 mr-1" /> Editar
                             </Button>
                             <Button size="sm" variant="outline" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100 font-medium" onClick={() => handleDelete(cost.id)}>
                               <Trash2 className="h-4 w-4 mr-1" /> Excluir
                             </Button>
                           </div>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg overflow-hidden overflow-x-auto bg-white">
                <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-bold text-gray-700">Nome da Conta</TableHead>
                    <TableHead className="font-bold text-gray-700">Valor Base</TableHead>
                    <TableHead className="font-bold text-gray-700">Repetição</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id} className="hover:bg-gray-50/30 transition-colors">
                      <TableCell className="font-semibold text-gray-800">{cost.name}</TableCell>
                      <TableCell className="font-medium text-gray-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        }).format(cost.value)}
                      </TableCell>
                      <TableCell>
                        {!cost.repeats ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            Não repete
                          </span>
                        ) : cost.type === "ALWAYS" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800">
                            Sempre repetir (Mensal)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800">
                            Parcelado ({cost.installmentsCount}x)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border-emerald-100/50 gap-1 font-semibold"
                            onClick={() => setPayingCost(cost)}
                          >
                            <DollarSign className="h-4 w-4" />
                            Pagar / Lançar Saída
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleOpenEditSheet(cost)}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDelete(cost.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50/50 border-red-100/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Cadastro e Edição */}
      <Dialog open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingCost ? "Editar Conta Fixa" : "Nova Conta Fixa"}
            </DialogTitle>
            <DialogDescription>
              Configure o valor e os critérios de recorrência da conta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name" className="font-semibold text-gray-700">
                  Nome da Conta / Custo
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Aluguel, Internet, Luz"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="value" className="font-semibold text-gray-700">
                  Valor Estimado
                </Label>
                <Controller
                  name="value"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                      <Input
                        id="value"
                        placeholder="0,00"
                        value={field.value !== undefined ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          field.onChange(digits ? Number(digits) / 100 : 0);
                        }}
                        className={`pl-9 ${errors.value ? "border-red-500" : ""}`}
                      />
                    </div>
                  )}
                />
                {errors.value && (
                  <p className="text-xs text-red-500 font-medium">{errors.value.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
                <div className="space-y-0.5">
                  <Label className="font-semibold text-gray-800">Conta Recorrente / Repetitiva</Label>
                  <p className="text-xs text-gray-400">Ative se a conta se repete mensalmente.</p>
                </div>
                <Switch
                  checked={watchRepeats}
                  onCheckedChange={(val) => setValue("repeats", val)}
                />
              </div>

              {watchRepeats && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col space-y-1.5">
                    <Label className="font-semibold text-gray-700">Tipo de Repetição</Label>
                    <Select
                      value={watchType}
                      onValueChange={(val) => setValue("type", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALWAYS">Sempre repetir (Infinitamente)</SelectItem>
                        <SelectItem value="INSTALLMENTS">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {watchType === "INSTALLMENTS" && (
                    <div className="flex flex-col space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                      <Label htmlFor="installmentsCount" className="font-semibold text-gray-700">
                        Número de Parcelas (1 a 12)
                      </Label>
                      <Select
                        value={watch("installmentsCount")?.toString() || "1"}
                        onValueChange={(val) => setValue("installmentsCount", parseInt(val))}
                      >
                        <SelectTrigger id="installmentsCount">
                          <SelectValue placeholder="Selecione as parcelas" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? "parcela" : "parcelas"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseSheet}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingCost
                  ? "Salvar Alterações"
                  : "Criar Conta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Pagamento */}
      <PayFixedCostDialog
        fixedCost={payingCost}
        isOpen={payingCost !== null}
        onClose={() => setPayingCost(null)}
      />
    </div>
  );
}
