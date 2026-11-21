import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Info,
} from "lucide-react";
import { compositionService } from "@/services/composition.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";
import type {
  CompositionGroup,
  CompositionOption,
  CreateCompositionGroupPayload,
  CreateCompositionOptionPayload,
} from "@/types/composition";

export default function CompositionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Modal de Grupo
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CompositionGroup | null>(null);
  const [groupForm, setGroupForm] = useState<CreateCompositionGroupPayload>({
    name: "",
    description: "",
    minQuantity: 0,
    maxQuantity: 1,
    freeQuantity: 0,
    sortOrder: 0,
    isActive: true,
  });

  // Modal de Opção
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<CompositionOption | null>(null);
  const [optionForm, setOptionForm] = useState<CreateCompositionOptionPayload>({
    name: "",
    description: "",
    price: 0,
    maxQuantityPerItem: 1,
    sortOrder: 0,
    isActive: true,
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["composition-groups"],
    queryFn: () => compositionService.listGroups(),
  });

  // Mutations Grupo
  const saveGroupMutation = useMutation({
    mutationFn: async () => {
      if (editingGroup) {
        return compositionService.updateGroup(editingGroup.id, groupForm);
      }
      return compositionService.createGroup(groupForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["composition-groups"] });
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      toast({ title: editingGroup ? "Grupo atualizado com sucesso!" : "Grupo criado com sucesso!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro ao salvar grupo", description: err.message });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => compositionService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["composition-groups"] });
      toast({ title: "Grupo excluído com sucesso!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro ao excluir grupo", description: err.message });
    },
  });

  // Mutations Opção
  const saveOptionMutation = useMutation({
    mutationFn: async () => {
      if (editingOption) {
        return compositionService.updateOption(editingOption.id, optionForm);
      }
      if (!targetGroupId) throw new Error("Grupo não selecionado");
      return compositionService.createOption(targetGroupId, optionForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["composition-groups"] });
      setIsOptionDialogOpen(false);
      setEditingOption(null);
      toast({ title: editingOption ? "Opção atualizada com sucesso!" : "Opção adicionada com sucesso!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro ao salvar opção", description: err.message });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: (id: string) => compositionService.deleteOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["composition-groups"] });
      toast({ title: "Opção excluída com sucesso!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro ao excluir opção", description: err.message });
    },
  });

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: "",
      description: "",
      minQuantity: 0,
      maxQuantity: 1,
      freeQuantity: 0,
      sortOrder: groups.length,
      isActive: true,
    });
    setIsGroupDialogOpen(true);
  };

  const openEditGroup = (group: CompositionGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      minQuantity: group.minQuantity,
      maxQuantity: group.maxQuantity,
      freeQuantity: group.freeQuantity,
      sortOrder: group.sortOrder,
      isActive: group.isActive,
    });
    setIsGroupDialogOpen(true);
  };

  const openCreateOption = (groupId: string, optionsCount: number) => {
    setTargetGroupId(groupId);
    setEditingOption(null);
    setOptionForm({
      name: "",
      description: "",
      price: 0,
      maxQuantityPerItem: 1,
      sortOrder: optionsCount,
      isActive: true,
    });
    setIsOptionDialogOpen(true);
  };

  const openEditOption = (option: CompositionOption) => {
    setEditingOption(option);
    setTargetGroupId(option.groupId);
    setOptionForm({
      name: option.name,
      description: option.description || "",
      price: Number(option.price) || 0,
      maxQuantityPerItem: option.maxQuantityPerItem,
      sortOrder: option.sortOrder,
      isActive: option.isActive,
    });
    setIsOptionDialogOpen(true);
  };

  const filteredGroups = groups.filter((g) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      (g.description && g.description.toLowerCase().includes(term)) ||
      g.options.some((opt) => opt.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Montagem de Produtos (Etapas e Complementos)
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie grupos de complementos, ingredientes e adicionais que podem ser reutilizados em qualquer produto personalizável.
          </p>
        </div>
        <Button onClick={openCreateGroup} className="rounded-2xl px-5 font-semibold gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Novo Grupo de Etapas
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupo ou ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-2xl bg-background"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Carregando grupos de montagem...</div>
      ) : filteredGroups.length === 0 ? (
        <Card className="rounded-3xl border border-dashed p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">Nenhum grupo encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre grupos de etapas como "Escolha sua Proteína", "Molhos", "Acompanhamentos" ou "Adicionais Pagos" para compor seus produtos.
            </p>
            <Button onClick={openCreateGroup} className="rounded-2xl font-semibold">
              Criar Primeiro Grupo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroupId === group.id;
            return (
              <Card key={group.id} className="rounded-3xl border bg-card shadow-sm transition-all overflow-hidden">
                <CardHeader className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30" onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}>
                  <div className="flex items-start md:items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base">{group.name}</span>
                        {!group.isActive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                        <Badge variant="outline" className="text-xs">
                          {group.options.length} {group.options.length === 1 ? "opção" : "opções"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span>Mín: <b>{group.minQuantity}</b></span>
                        <span>Máx: <b>{group.maxQuantity}</b></span>
                        {group.freeQuantity > 0 && <span>Grátis: <b>{group.freeQuantity}</b></span>}
                        {group.description && <span className="truncate max-w-[300px]">({group.description})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 gap-1"
                      onClick={() => openCreateOption(group.id, group.options.length)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Opção
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={() => openEditGroup(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Excluir o grupo "${group.name}" e todas as suas opções?`)) {
                          deleteGroupMutation.mutate(group.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-5 pt-0 border-t bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between pt-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Opções / Itens do Grupo
                      </Label>
                    </div>

                    {group.options.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Nenhuma opção cadastrada neste grupo.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`flex items-center justify-between p-3 rounded-2xl border bg-background shadow-xs ${
                              !opt.isActive ? "opacity-60" : ""
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-sm truncate">{opt.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                <span className={Number(opt.price) > 0 ? "text-primary font-medium" : ""}>
                                  {Number(opt.price) > 0
                                    ? `+${formatCurrency(Number(opt.price))}`
                                    : "Sem custo extra"}
                                </span>
                                {opt.maxQuantityPerItem > 1 && <span>(Máx: {opt.maxQuantityPerItem})</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => openEditOption(opt)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm(`Excluir a opção "${opt.name}"?`)) {
                                    deleteOptionMutation.mutate(opt.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Grupo */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Editar Grupo de Etapas" : "Novo Grupo de Etapas"}</DialogTitle>
            <DialogDescription>
              Configure o nome e os limites de seleção padrão para este grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Nome do Grupo *</Label>
              <Input
                id="group-name"
                placeholder="Ex: Escolha o Ponto da Carne, Ingredientes, Molhos"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-desc">Descrição / Instruções (Opcional)</Label>
              <Input
                id="group-desc"
                placeholder="Ex: Escolha até 2 opções grátis"
                value={groupForm.description || ""}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="group-min">Qtd Mínima</Label>
                <Input
                  id="group-min"
                  type="number"
                  min={0}
                  value={groupForm.minQuantity}
                  onChange={(e) => setGroupForm({ ...groupForm, minQuantity: Number(e.target.value) })}
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="group-max">Qtd Máxima</Label>
                <Input
                  id="group-max"
                  type="number"
                  min={1}
                  value={groupForm.maxQuantity}
                  onChange={(e) => setGroupForm({ ...groupForm, maxQuantity: Number(e.target.value) })}
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="group-free">Qtd Grátis</Label>
                <Input
                  id="group-free"
                  type="number"
                  min={0}
                  value={groupForm.freeQuantity}
                  onChange={(e) => setGroupForm({ ...groupForm, freeQuantity: Number(e.target.value) })}
                  className="h-11 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="group-active">Grupo Ativo</Label>
                <p className="text-xs text-muted-foreground">Grupos inativos não aparecem para novos pedidos.</p>
              </div>
              <Switch
                id="group-active"
                checked={groupForm.isActive}
                onCheckedChange={(checked) => setGroupForm({ ...groupForm, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)} className="rounded-2xl">
              Cancelar
            </Button>
            <Button
              onClick={() => saveGroupMutation.mutate()}
              disabled={!groupForm.name.trim() || saveGroupMutation.isPending}
              className="rounded-2xl font-semibold"
            >
              {saveGroupMutation.isPending ? "Salvando..." : "Salvar Grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Opção */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingOption ? "Editar Opção" : "Nova Opção / Ingrediente"}</DialogTitle>
            <DialogDescription>
              Informe o nome e o acréscimo de preço cobrado quando o cliente selecionar esta opção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="option-name">Nome da Opção *</Label>
              <Input
                id="option-name"
                placeholder="Ex: Bacon Extra, Cheddar Cremoso, Molho Especial"
                value={optionForm.name}
                onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="option-desc">Descrição (Opcional)</Label>
              <Input
                id="option-desc"
                placeholder="Ex: Fatias crocantes de bacon artesanal"
                value={optionForm.description || ""}
                onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="option-price">Preço Adicional (R$)</Label>
                <Input
                  id="option-price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={optionForm.price}
                  onChange={(e) => setOptionForm({ ...optionForm, price: Number(e.target.value) })}
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="option-max">Máx por Pedido</Label>
                <Input
                  id="option-max"
                  type="number"
                  min={1}
                  value={optionForm.maxQuantityPerItem}
                  onChange={(e) => setOptionForm({ ...optionForm, maxQuantityPerItem: Number(e.target.value) })}
                  className="h-11 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="option-active">Opção Disponível</Label>
                <p className="text-xs text-muted-foreground">Desative temporariamente se faltar estoque.</p>
              </div>
              <Switch
                id="option-active"
                checked={optionForm.isActive}
                onCheckedChange={(checked) => setOptionForm({ ...optionForm, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptionDialogOpen(false)} className="rounded-2xl">
              Cancelar
            </Button>
            <Button
              onClick={() => saveOptionMutation.mutate()}
              disabled={!optionForm.name.trim() || saveOptionMutation.isPending}
              className="rounded-2xl font-semibold"
            >
              {saveOptionMutation.isPending ? "Salvando..." : "Salvar Opção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
