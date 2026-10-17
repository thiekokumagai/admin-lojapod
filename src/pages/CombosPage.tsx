import { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Search,
  Copy,
  Trash2,
  Pencil,
  Power,
  Package,
  Layers,
  Sparkles,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { buildImageUrl } from "@/utils/image-url";
import { comboService, type Combo } from "@/services/combo.service";
import { ComboModal } from "@/components/combo/ComboModal";

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comboToEdit, setComboToEdit] = useState<Combo | null>(null);

  // Exclusão
  const [comboToDelete, setComboToDelete] = useState<Combo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detalhes
  const [selectedComboDetails, setSelectedComboDetails] = useState<Combo | null>(null);

  useEffect(() => {
    loadCombos();
  }, [statusFilter]);

  const loadCombos = async () => {
    try {
      setIsLoading(true);
      const data = await comboService.list({
        search: searchTerm || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter,
      });
      setCombos(data);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar lista de combos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCombos();
  };

  const handleToggleActive = async (combo: Combo) => {
    try {
      await comboService.toggleActive(combo.id);
      toast.success(
        combo.isActive ? "Combo desativado com sucesso!" : "Combo ativado com sucesso!",
      );
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status.");
    }
  };

  const handleDuplicate = async (combo: Combo) => {
    try {
      await comboService.duplicate(combo.id);
      toast.success("Combo duplicado com sucesso! Foi criado como inativo para revisão.");
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao duplicar combo.");
    }
  };

  const handleDelete = async () => {
    if (!comboToDelete) return;
    try {
      setIsDeleting(true);
      await comboService.delete(comboToDelete.id);
      toast.success("Combo excluído com sucesso!");
      setComboToDelete(null);
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir combo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-indigo-600" />
            Combos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie e gerencie combos promocionais unindo produtos do catálogo com estoque integrado.
          </p>
        </div>

        <Button
          onClick={() => {
            setComboToEdit(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Combo
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar combos por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </form>

        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="true">Ativos</SelectItem>
              <SelectItem value="false">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Combos */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          Carregando combos...
        </div>
      ) : combos.length === 0 ? (
        <div className="bg-white border border-dashed rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Boxes className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            Nenhum combo encontrado
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Crie combos com desconto unindo diferentes produtos para impulsionar suas vendas.
          </p>
          <Button
            onClick={() => {
              setComboToEdit(null);
              setIsModalOpen(true);
            }}
            variant="outline"
            className="mt-4 gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Combo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {combos.map((combo) => {
            const hasStock = (combo.stock ?? 0) > 0;

            return (
              <div
                key={combo.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-all"
              >
                {/* Header do Card com Imagem e Status */}
                <div className="relative h-44 bg-slate-100 border-b overflow-hidden group">
                  {combo.imageUrl ? (
                    <img
                      src={buildImageUrl(combo.imageUrl)}
                      alt={combo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Boxes className="w-12 h-12" />
                      <span className="text-xs font-medium mt-1 text-slate-400">Sem imagem</span>
                    </div>
                  )}

                  {/* Badges Flutuantes */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                    <Badge
                      variant={combo.isActive ? "default" : "secondary"}
                      className={
                        combo.isActive
                          ? "bg-emerald-600 hover:bg-emerald-600 text-white font-medium text-[11px]"
                          : "bg-slate-200 text-slate-700 font-medium text-[11px]"
                      }
                    >
                      {combo.isActive ? "Ativo" : "Inativo"}
                    </Badge>

                    {combo.discountPercentage > 0 && (
                      <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-semibold text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {combo.discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 z-10">
                    <Badge
                      className={
                        hasStock
                          ? "bg-white/90 text-slate-700 backdrop-blur font-semibold text-[11px] border shadow-xs"
                          : "bg-red-500 text-white font-bold text-[11px]"
                      }
                    >
                      {hasStock ? `${combo.stock} un. em estoque` : "Esgotado"}
                    </Badge>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {combo.categoryTitle && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        {combo.categoryTitle}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-1 mt-0.5">
                      {combo.name}
                    </h3>
                    {combo.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {combo.description}
                      </p>
                    )}
                  </div>

                  {/* Componentes do Combo Resumo */}
                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Itens inclusos ({combo.items?.length || 0}):
                    </span>
                    <ul className="space-y-0.5">
                      {(combo.items || []).slice(0, 3).map((it, i) => (
                        <li key={i} className="truncate flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                          <span>
                            {it.quantity}x {it.productName}
                            {it.variation ? ` (${it.variation})` : ""}
                          </span>
                        </li>
                      ))}
                      {(combo.items?.length || 0) > 3 && (
                        <li className="text-slate-400 font-medium">
                          + {(combo.items?.length || 0) - 3} outro(s) produto(s)
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Preço e Total Vendido */}
                  <div className="flex items-end justify-between pt-1 border-t border-slate-100">
                    <div>
                      {combo.originalPrice > combo.price && (
                        <span className="text-xs text-slate-400 line-through block">
                          R$ {combo.originalPrice.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                      <span className="text-lg font-bold text-indigo-600">
                        R$ {combo.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Vendas</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {combo.totalSold} vendidos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="bg-slate-50/80 border-t px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedComboDetails(combo)}
                      title="Visualizar detalhes"
                      className="h-8 w-8 text-slate-600 hover:text-slate-900"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setComboToEdit(combo);
                        setIsModalOpen(true);
                      }}
                      title="Editar combo"
                      className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(combo)}
                      title="Duplicar combo"
                      className="h-8 w-8 text-slate-600 hover:text-slate-900"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(combo)}
                      title={combo.isActive ? "Desativar" : "Ativar"}
                      className={`h-8 w-8 ${
                        combo.isActive
                          ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setComboToDelete(combo)}
                    title="Excluir combo"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <ComboModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setComboToEdit(null);
        }}
        comboToEdit={comboToEdit}
        onSuccess={loadCombos}
      />

      {/* Modal de Visualização de Detalhes */}
      <Dialog
        open={!!selectedComboDetails}
        onOpenChange={(open) => !open && setSelectedComboDetails(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-600" />
              Detalhes do Combo
            </DialogTitle>
          </DialogHeader>

          {selectedComboDetails && (
            <div className="space-y-4 pt-2">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-lg overflow-hidden border bg-slate-100 shrink-0">
                  {selectedComboDetails.imageUrl ? (
                    <img
                      src={buildImageUrl(selectedComboDetails.imageUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Boxes className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedComboDetails.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedComboDetails.isActive ? "default" : "secondary"}>
                      {selectedComboDetails.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-sm font-bold text-indigo-600">
                      R$ {selectedComboDetails.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              {selectedComboDetails.description && (
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border">
                  {selectedComboDetails.description}
                </p>
              )}

              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Produtos que compõem o combo:
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedComboDetails.items.map((ci) => (
                    <div
                      key={ci.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-50/50 text-sm"
                    >
                      <div>
                        <span className="font-medium text-slate-800 block">
                          {ci.quantity}x {ci.productName}
                        </span>
                        {ci.variation && (
                          <span className="text-xs text-slate-500 font-medium">
                            Variação: {ci.variation}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">
                          Estoque: {ci.currentStock} un.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center text-xs text-slate-500">
                <span>Total vendido: <b>{selectedComboDetails.totalSold}</b></span>
                <span>Estoque máximo calculado: <b>{selectedComboDetails.stock}</b></span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog
        open={!!comboToDelete}
        onOpenChange={(open) => !open && setComboToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Excluir Combo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o combo "<b>{comboToDelete?.name}</b>". Os pedidos já
              realizados contendo este combo não serão afetados, pois o histórico da venda fica
              preservado com integridade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Sim, Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
