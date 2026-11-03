import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  orderBumpService,
  OrderBumpItem,
  CreateOrderBumpPayload,
} from "@/services/order-bump.service";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Package,
  Layers,
  ArrowRight,
  Loader2,
  X,
  CheckCircle2,
  Eye,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { buildImageUrl } from "@/utils/image-url";

export default function OrderBumpsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal de criação / edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderBumpItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("Peça também");
  const [formTriggerType, setFormTriggerType] = useState<"ALL" | "CATEGORY" | "PRODUCT">("ALL");
  const [formTriggerProductId, setFormTriggerProductId] = useState("");
  const [formTriggerCategoryId, setFormTriggerCategoryId] = useState("");
  const [formSuggestedProductId, setFormSuggestedProductId] = useState("");
  const [formPricingType, setFormPricingType] = useState<"ORIGINAL" | "CUSTOM" | "PERCENT">("ORIGINAL");
  const [formCustomPrice, setFormCustomPrice] = useState("");
  const [formDiscountPercent, setFormDiscountPercent] = useState("");
  const [formPriority, setFormPriority] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);

  // Estados de busca para seleção de produtos estilo combo
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [triggerSearch, setTriggerSearch] = useState("");

  // Queries
  const { data: orderBumps = [], isLoading } = useQuery({
    queryKey: ["order-bumps"],
    queryFn: () => orderBumpService.list(),
  });

  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 1000 });
  const products = productsData?.products || [];
  const activeProducts = products.filter((p) => p.status === "active");

  const selectedSuggestedProduct = activeProducts.find((p) => p.id === formSuggestedProductId);
  const selectedTriggerProduct = activeProducts.find((p) => p.id === formTriggerProductId);

  const filteredSuggested = activeProducts.filter((p) =>
    p.title.toLowerCase().includes(suggestedSearch.toLowerCase())
  );

  const filteredTrigger = activeProducts.filter((p) =>
    p.title.toLowerCase().includes(triggerSearch.toLowerCase())
  );

  const { data: categories = [] } = useCategories();

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateOrderBumpPayload) => orderBumpService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Regra de sugestão criada com sucesso!");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar regra");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateOrderBumpPayload> }) =>
      orderBumpService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Regra atualizada com sucesso!");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar regra");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => orderBumpService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Status alterado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao alterar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orderBumpService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Regra excluída com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir regra");
    },
  });

  // Abertura do modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle("Peça também");
    setFormTriggerType("ALL");
    setFormTriggerProductId("");
    setFormTriggerCategoryId("");
    setFormSuggestedProductId("");
    setSuggestedSearch("");
    setTriggerSearch("");
    setFormPricingType("ORIGINAL");
    setFormCustomPrice("");
    setFormDiscountPercent("");
    setFormPriority("0");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: OrderBumpItem) => {
    setEditingItem(item);
    setFormTitle(item.title || "Peça também");
    setFormTriggerType(item.triggerType);
    setFormTriggerProductId(item.triggerProductId || "");
    setFormTriggerCategoryId(item.triggerCategoryId || "");
    setFormSuggestedProductId(item.suggestedProductId);
    setSuggestedSearch("");
    setTriggerSearch("");

    if (item.customPrice !== null && item.customPrice !== undefined) {
      setFormPricingType("CUSTOM");
      setFormCustomPrice(
        new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(item.customPrice))
      );
      setFormDiscountPercent("");
    } else if (item.discountPercent !== null && item.discountPercent !== undefined) {
      setFormPricingType("PERCENT");
      setFormDiscountPercent(String(item.discountPercent));
      setFormCustomPrice("");
    } else {
      setFormPricingType("ORIGINAL");
      setFormCustomPrice("");
      setFormDiscountPercent("");
    }

    setFormPriority(String(item.priority || 0));
    setFormIsActive(item.isActive);
    setIsModalOpen(true);
  };

  // Salvar
  const handleSave = () => {
    if (!formSuggestedProductId) {
      toast.error("Selecione o produto que será sugerido");
      return;
    }

    if (formTriggerType === "PRODUCT" && !formTriggerProductId) {
      toast.error("Selecione o produto gatilho");
      return;
    }

    if (formTriggerType === "CATEGORY" && !formTriggerCategoryId) {
      toast.error("Selecione a categoria gatilho");
      return;
    }

    const numericCustomPrice =
      formPricingType === "CUSTOM" && formCustomPrice
        ? Number(formCustomPrice.replace(/\./g, "").replace(",", "."))
        : null;

    const payload: CreateOrderBumpPayload = {
      title: formTitle.trim() || "Peça também",
      triggerType: formTriggerType,
      triggerProductId: formTriggerType === "PRODUCT" ? formTriggerProductId : null,
      triggerCategoryId: formTriggerType === "CATEGORY" ? formTriggerCategoryId : null,
      suggestedProductId: formSuggestedProductId,
      priority: Number(formPriority) || 0,
      isActive: formIsActive,
      customPrice: numericCustomPrice,
      discountPercent:
        formPricingType === "PERCENT" && formDiscountPercent
          ? Number(formDiscountPercent.replace(",", "."))
          : null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filtragem
  const filteredBumps = orderBumps.filter((item) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && item.isActive) ||
      (statusFilter === "INACTIVE" && !item.isActive);

    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.suggestedProduct?.title || "").toLowerCase().includes(q) ||
      (item.triggerProduct?.title || "").toLowerCase().includes(q) ||
      (item.triggerCategory?.title || "").toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const totalActive = orderBumps.filter((b) => b.isActive).length;
  const totalViews = orderBumps.reduce((sum, b) => sum + (b.viewsCount || 0), 0);
  const totalConversions = orderBumps.reduce((sum, b) => sum + (b.conversionsCount || 0), 0);
  const totalRevenue = orderBumps.reduce((sum, b) => sum + Number(b.totalRevenue || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peça também (Order Bump)</h1>
          <p className="text-sm text-muted-foreground">
            Configure sugestões automáticas na sacola de compras para aumentar o ticket médio da sua loja.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0 rounded-xl">
          <Plus className="h-4 w-4" />
          Nova Sugestão
        </Button>
      </div>

      {/* Cards de Resumo & Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold flex items-center justify-between">
              <span>Regras Ativas</span>
              <Layers className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{totalActive}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold flex items-center justify-between">
              <span>Visualizações</span>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{totalViews}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-xs">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold flex items-center justify-between">
              <span>Vendas via Bump</span>
              <ShoppingCart className="h-4 w-4 text-purple-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600">
              {totalConversions}
              <span className="text-xs font-normal text-muted-foreground ml-2">
                ({conversionRate}%)
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold flex items-center justify-between">
              <span>Receita Gerada</span>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">
              R$ {totalRevenue.toFixed(2).replace(".", ",")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Toolbar / Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-xs">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por título ou produto sugerido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200 rounded-xl font-medium"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-11 border-slate-200 rounded-xl font-semibold text-slate-700">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="font-semibold">Todos os status</SelectItem>
              <SelectItem value="ACTIVE" className="font-semibold">Ativos</SelectItem>
              <SelectItem value="INACTIVE" className="font-semibold">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card rounded-2xl border">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Carregando sugestões...
        </div>
      ) : filteredBumps.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card rounded-2xl border p-6">
          <Package className="h-8 w-8 opacity-40" />
          <p className="font-medium">Nenhuma sugestão de Order Bump encontrada.</p>
          <Button variant="outline" size="sm" onClick={handleOpenCreate} className="mt-2 rounded-xl">
            Criar primeira sugestão
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Grid */}
          <div className="grid md:hidden gap-3">
            {filteredBumps.map((bump) => (
              <div
                key={bump.id}
                className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {bump.suggestedProduct?.images?.[0]?.url ? (
                      <img
                        src={buildImageUrl(bump.suggestedProduct.images[0].url)}
                        alt={bump.suggestedProduct.title}
                        className="h-12 w-12 rounded-xl object-cover border shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-slate-100 border flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 line-clamp-1">
                        {bump.suggestedProduct?.title || "Produto não identificado"}
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Título na sacola: <strong>{bump.title}</strong>
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={bump.isActive}
                    onCheckedChange={() => toggleMutation.mutate(bump.id)}
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Gatilho</span>
                    {bump.triggerType === "ALL" && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[11px]">
                        Qualquer Pedido
                      </Badge>
                    )}
                    {bump.triggerType === "CATEGORY" && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-semibold text-[11px]">
                        Categoria: {bump.triggerCategory?.title || "Categoria"}
                      </Badge>
                    )}
                    {bump.triggerType === "PRODUCT" && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold text-[11px]">
                        Produto: {bump.triggerProduct?.title || "Produto"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Preço na Sacola</span>
                    {bump.customPrice ? (
                      <div className="font-bold text-emerald-600">
                        R$ {Number(bump.customPrice).toFixed(2).replace(".", ",")}
                      </div>
                    ) : bump.discountPercent ? (
                      <div className="font-bold text-emerald-600">
                        {bump.discountPercent}% OFF
                      </div>
                    ) : (
                      <div className="font-medium text-slate-600">Preço Normal</div>
                    )}
                  </div>
                </div>

                {/* Métricas no Card Mobile */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Views</span>
                    <span className="font-semibold text-slate-700">{bump.viewsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Vendas</span>
                    <span className="font-bold text-purple-600">{bump.conversionsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Receita</span>
                    <span className="font-bold text-emerald-600">
                      R$ {Number(bump.totalRevenue || 0).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(bump)}
                    className="h-8 rounded-xl gap-1 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm("Deseja realmente excluir esta sugestão?")) {
                        deleteMutation.mutate(bump.id);
                      }
                    }}
                    className="h-8 w-8 rounded-xl text-slate-400 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto Sugerido</TableHead>
                  <TableHead>Gatilho de Disparo</TableHead>
                  <TableHead>Preço na Sacola</TableHead>
                  <TableHead className="text-center">Visualizações</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-center">Conversão</TableHead>
                  <TableHead className="text-center">Receita</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBumps.map((bump) => {
                  const views = bump.viewsCount || 0;
                  const convs = bump.conversionsCount || 0;
                  const rate = views > 0 ? ((convs / views) * 100).toFixed(1) : "0.0";
                  const rev = Number(bump.totalRevenue || 0);

                  return (
                    <TableRow key={bump.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {bump.suggestedProduct?.images?.[0]?.url ? (
                            <img
                              src={buildImageUrl(bump.suggestedProduct.images[0].url)}
                              alt={bump.suggestedProduct.title}
                              className="h-12 w-12 rounded-xl object-cover border min-w-12 min-h-12 block"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-muted border flex items-center justify-center text-muted-foreground text-xs min-w-12 min-h-12">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">
                              {bump.suggestedProduct?.title || "Produto não identificado"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Título: <strong>{bump.title}</strong>
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {bump.triggerType === "ALL" && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Qualquer Pedido
                          </Badge>
                        )}
                        {bump.triggerType === "CATEGORY" && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Categoria: {bump.triggerCategory?.title || "Categoria"}
                          </Badge>
                        )}
                        {bump.triggerType === "PRODUCT" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Produto: {bump.triggerProduct?.title || "Produto"}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {bump.customPrice ? (
                          <div className="font-bold text-emerald-600 text-sm">
                            R$ {Number(bump.customPrice).toFixed(2).replace(".", ",")}
                          </div>
                        ) : bump.discountPercent ? (
                          <div className="font-bold text-emerald-600 text-sm">
                            {bump.discountPercent}% OFF
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground font-medium">Preço Normal</div>
                        )}
                      </TableCell>

                      <TableCell className="text-center font-medium text-xs text-slate-600">
                        {views}
                      </TableCell>

                      <TableCell className="text-center font-bold text-xs text-purple-600">
                        {convs}
                      </TableCell>

                      <TableCell className="text-center font-semibold text-xs">
                        {views > 0 ? (
                          <span className="text-emerald-600 font-bold">{rate}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center font-bold text-xs text-slate-800">
                        R$ {rev.toFixed(2).replace(".", ",")}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={bump.isActive}
                            onCheckedChange={() => toggleMutation.mutate(bump.id)}
                          />
                        </div>
                      </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(bump)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm("Deseja realmente excluir esta sugestão?")) {
                              deleteMutation.mutate(bump.id);
                            }
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Modal de Criação / Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingItem ? "Editar Sugestão" : "Nova Sugestão de Carrinho"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina quando e qual produto deve ser sugerido para o cliente na sacola de compras.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Título exibido na sacola */}
            <div>
              <Label className="text-xs font-semibold">Título da Seção na Sacola</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Peça também, Aproveite para levar"
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            {/* Quando Disparar (Gatilho) */}
            <div>
              <Label className="text-xs font-semibold">Quando sugerir?</Label>
              <Select
                value={formTriggerType}
                onValueChange={(val) => setFormTriggerType(val as any)}
              >
                <SelectTrigger className="mt-1 h-10 rounded-xl">
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL" className="font-medium">Em qualquer pedido (Geral)</SelectItem>
                  <SelectItem value="CATEGORY" className="font-medium">Quando o carrinho tiver itens de uma Categoria</SelectItem>
                  <SelectItem value="PRODUCT" className="font-medium">Quando o carrinho tiver um Produto Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Categoria Gatilho */}
            {formTriggerType === "CATEGORY" && (
              <div>
                <Label className="text-xs font-semibold">Selecione a Categoria Gatilho</Label>
                <Select
                  value={formTriggerCategoryId}
                  onValueChange={setFormTriggerCategoryId}
                >
                  <SelectTrigger className="mt-1 h-10 rounded-xl">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Seletor de Produto Gatilho Estilo Combo */}
            {formTriggerType === "PRODUCT" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Selecione o Produto Gatilho *</Label>
                {selectedTriggerProduct ? (
                  <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-white overflow-hidden shrink-0 border border-indigo-100 flex items-center justify-center">
                        {selectedTriggerProduct.images?.[0]?.url ? (
                          <img
                            src={buildImageUrl(selectedTriggerProduct.images[0].url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                          Gatilho Selecionado
                        </p>
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {selectedTriggerProduct.title}
                        </p>
                        <p className="text-xs font-semibold text-slate-600">
                          R$ {Number(selectedTriggerProduct.promotionalPrice || selectedTriggerProduct.price || 0).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormTriggerProductId("");
                        setTriggerSearch("");
                      }}
                      className="text-xs font-semibold border-indigo-200 hover:bg-white text-indigo-700 h-8"
                    >
                      Trocar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite o nome do produto gatilho para buscar..."
                        value={triggerSearch}
                        onChange={(e) => setTriggerSearch(e.target.value)}
                        className="pl-9 pr-8 h-10 rounded-xl"
                      />
                      {triggerSearch && (
                        <button
                          type="button"
                          onClick={() => setTriggerSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {triggerSearch.trim().length > 0 && (
                      <div className="max-h-52 overflow-y-auto border rounded-xl divide-y bg-white shadow-sm">
                        {isLoadingProducts ? (
                          <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            Carregando produtos...
                          </div>
                        ) : filteredTrigger.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            Nenhum produto ativo encontrado com "{triggerSearch}".
                          </div>
                        ) : (
                          filteredTrigger.slice(0, 20).map((prod) => {
                            const promo = prod.promotionalPrice ? Number(prod.promotionalPrice) : 0;
                            const normal = prod.price ? Number(prod.price) : 0;
                            const pPrice = promo > 0 ? promo : normal;
                            const img = prod.images?.[0]?.url;

                            return (
                              <div
                                key={prod.id}
                                onClick={() => {
                                  setFormTriggerProductId(prod.id);
                                  setTriggerSearch("");
                                }}
                                className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-indigo-50/70 transition-colors text-left"
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                  <div className="w-9 h-9 rounded-md bg-muted overflow-hidden shrink-0 border">
                                    {img ? (
                                      <img src={buildImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Package className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{prod.title}</p>
                                    <p className="text-xs text-muted-foreground">Estoque: {prod.totalStock ?? 0}</p>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 shrink-0">
                                  R$ {pPrice.toFixed(2).replace(".", ",")}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Produto Sugerido (Bump) Estilo Combo */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Qual produto sugerir para o cliente? *</Label>
              {selectedSuggestedProduct ? (
                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-white overflow-hidden shrink-0 border border-indigo-100 flex items-center justify-center">
                      {selectedSuggestedProduct.images?.[0]?.url ? (
                        <img
                          src={buildImageUrl(selectedSuggestedProduct.images[0].url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                        Produto Sugerido
                      </p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {selectedSuggestedProduct.title}
                      </p>
                      <p className="text-xs font-semibold text-slate-600">
                        R$ {Number(selectedSuggestedProduct.promotionalPrice || selectedSuggestedProduct.price || 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormSuggestedProductId("");
                      setSuggestedSearch("");
                    }}
                    className="text-xs font-semibold border-indigo-200 hover:bg-white text-indigo-700 h-8"
                  >
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite o nome do produto para buscar e sugerir..."
                      value={suggestedSearch}
                      onChange={(e) => setSuggestedSearch(e.target.value)}
                      className="pl-9 pr-8 h-10 rounded-xl"
                    />
                    {suggestedSearch && (
                      <button
                        type="button"
                        onClick={() => setSuggestedSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {suggestedSearch.trim().length > 0 && (
                    <div className="max-h-52 overflow-y-auto border rounded-xl divide-y bg-white shadow-sm">
                      {isLoadingProducts ? (
                        <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          Carregando produtos...
                        </div>
                      ) : filteredSuggested.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          Nenhum produto ativo encontrado com "{suggestedSearch}".
                        </div>
                      ) : (
                        filteredSuggested.slice(0, 20).map((prod) => {
                          const promo = prod.promotionalPrice ? Number(prod.promotionalPrice) : 0;
                          const normal = prod.price ? Number(prod.price) : 0;
                          const pPrice = promo > 0 ? promo : normal;
                          const img = prod.images?.[0]?.url;

                          return (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setFormSuggestedProductId(prod.id);
                                setSuggestedSearch("");
                              }}
                              className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-indigo-50/70 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="w-9 h-9 rounded-md bg-muted overflow-hidden shrink-0 border">
                                  {img ? (
                                    <img src={buildImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">{prod.title}</p>
                                  <p className="text-xs text-muted-foreground">Estoque: {prod.totalStock ?? 0}</p>
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-emerald-600 shrink-0">
                                R$ {pPrice.toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Condição de Preço */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Preço no Carrinho
              </Label>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={formPricingType === "ORIGINAL" ? "default" : "outline"}
                  onClick={() => setFormPricingType("ORIGINAL")}
                  className="h-9 text-xs rounded-xl"
                >
                  Preço Normal
                </Button>
                <Button
                  type="button"
                  variant={formPricingType === "CUSTOM" ? "default" : "outline"}
                  onClick={() => setFormPricingType("CUSTOM")}
                  className="h-9 text-xs rounded-xl"
                >
                  Preço Fixo (R$)
                </Button>
                <Button
                  type="button"
                  variant={formPricingType === "PERCENT" ? "default" : "outline"}
                  onClick={() => setFormPricingType("PERCENT")}
                  className="h-9 text-xs rounded-xl"
                >
                  Desconto (%)
                </Button>
              </div>

              {formPricingType === "CUSTOM" && (
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Preço Promocional Exclusivo na Sacola (R$)</Label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="0,00"
                      className="pl-9 font-semibold w-full h-10 rounded-xl bg-white"
                      value={
                        formCustomPrice
                          ? new Intl.NumberFormat("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(formCustomPrice.replace(/\D/g, "")) / 100)
                          : ""
                      }
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        if (!digits) {
                          setFormCustomPrice("");
                        } else {
                          const formatted = new Intl.NumberFormat("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(digits) / 100);
                          setFormCustomPrice(formatted);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {formPricingType === "PERCENT" && (
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Percentual de Desconto na Sacola (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={formDiscountPercent}
                    onChange={(e) => setFormDiscountPercent(e.target.value)}
                    placeholder="Ex: 15"
                    className="h-10 rounded-xl bg-white"
                  />
                </div>
              )}
            </div>

            {/* Status da Regra */}
            <div className="pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <Label className="text-xs font-semibold block">Status da Sugestão</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Ative ou pause a exibição desta sugestão na sacola a qualquer momento.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                  <span className="text-xs font-semibold">
                    {formIsActive ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl font-bold"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              {editingItem ? "Salvar Alterações" : "Criar Sugestão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
