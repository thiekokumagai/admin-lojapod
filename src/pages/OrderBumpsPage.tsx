import { useState, useEffect, useRef } from "react";
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
import { cn } from "@/lib/utils";
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
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { buildImageUrl } from "@/utils/image-url";
import {
  ORDER_BUMP_LOCATION_OPTIONS,
  normalizeOrderBumpLocation,
  orderBumpLocationLabel,
  type OrderBumpDisplayLocation,
} from "@/utils/order-bump-location";

const getEffectiveProductPrice = (product?: { price?: string | number | null; promotionalPrice?: string | number | null } | null): number => {
  if (!product) return 0;
  const promo = product.promotionalPrice ? Number(product.promotionalPrice) : 0;
  const normal = product.price ? Number(product.price) : 0;
  return promo > 0 ? promo : normal;
};

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
  const [formTriggerProductIds, setFormTriggerProductIds] = useState<string[]>([]);
  const [formTriggerCategoryIds, setFormTriggerCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [formSuggestedProductId, setFormSuggestedProductId] = useState("");
  const [formPricingType, setFormPricingType] = useState<"ORIGINAL" | "CUSTOM" | "PERCENT">("ORIGINAL");
  const [formCustomPrice, setFormCustomPrice] = useState("");
  const [formDiscountPercent, setFormDiscountPercent] = useState("");
  const [formPriority, setFormPriority] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayLocation, setFormDisplayLocation] = useState<OrderBumpDisplayLocation>("CART");

  // Estados de busca para seleção de produtos estilo combo
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [triggerSearch, setTriggerSearch] = useState("");

  // Queries
  const { data: orderBumps, isLoading } = useQuery({
    queryKey: ["order-bumps"],
    queryFn: () => orderBumpService.list(),
  });

  const [localBumps, setLocalBumps] = useState<OrderBumpItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (orderBumps) {
      setLocalBumps(orderBumps);
    }
  }, [orderBumps]);

  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 1000 });
  const products = productsData?.products || [];
  const activeProducts = products.filter((p) => p.status === "active");

  const selectedSuggestedProduct = activeProducts.find((p) => p.id === formSuggestedProductId);
  const selectedTriggerProducts = formTriggerProductIds
    .map((id) => activeProducts.find((p) => p.id === id) || editingItem?.triggerProducts?.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const getBumpTriggerTitles = (bump: OrderBumpItem): string[] => {
    if (Array.isArray(bump.triggerProducts) && bump.triggerProducts.length > 0) {
      return bump.triggerProducts.map((p) => p.title);
    }
    if (bump.triggerProduct?.title) {
      return [bump.triggerProduct.title];
    }
    return [];
  };

  const formatTriggerProductsLabel = (bump: OrderBumpItem): string => {
    const titles = getBumpTriggerTitles(bump);
    if (titles.length === 0) return "Produto";
    if (titles.length === 1) return titles[0];
    return `${titles[0]} +${titles.length - 1}`;
  };
  const getBumpTriggerCategoryTitles = (bump: OrderBumpItem): string[] => {
    if (Array.isArray(bump.triggerCategories) && bump.triggerCategories.length > 0) {
      return bump.triggerCategories.map((c) => c.title);
    }
    if (bump.triggerCategory?.title) {
      return [bump.triggerCategory.title];
    }
    if (Array.isArray(bump.triggerCategoryIds) && bump.triggerCategoryIds.length > 0) {
      return bump.triggerCategoryIds.map(
        (id) => categories.find((c) => c.id === id)?.title || "Categoria",
      );
    }
    return [];
  };

  const formatTriggerCategoriesLabel = (bump: OrderBumpItem): string => {
    const titles = getBumpTriggerCategoryTitles(bump);
    if (titles.length === 0) return "Categoria";
    if (titles.length === 1) return titles[0];
    return `${titles[0]} +${titles.length - 1}`;
  };



  const filteredSuggested = activeProducts.filter((p) =>
    p.title.toLowerCase().includes(suggestedSearch.toLowerCase())
  );

  const filteredTrigger = activeProducts.filter(
    (p) =>
      !formTriggerProductIds.includes(p.id) &&
      p.title.toLowerCase().includes(triggerSearch.toLowerCase())
  );

  const { data: categories = [] } = useCategories();
const selectedTriggerCategories = formTriggerCategoryIds
    .map((id) => {
      const fromList = categories.find((c) => c.id === id);
      if (fromList) return fromList;
      const fromEditing = editingItem?.triggerCategories?.find((c) => c.id === id);
      if (fromEditing) return fromEditing;
      if (editingItem?.triggerCategory?.id === id) return editingItem.triggerCategory;
      return null;
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const filteredTriggerCategories = categories.filter(
    (c) =>
      !formTriggerCategoryIds.includes(c.id) &&
      c.title.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );


  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateOrderBumpPayload) => orderBumpService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Regra de sugestão criada com sucesso!");
      setIsModalOpen(false);
    },
    onError: (err: { message?: string }) => {
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
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao atualizar regra");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => orderBumpService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Status alterado com sucesso!");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao alterar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orderBumpService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Regra excluída com sucesso!");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao excluir regra");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => orderBumpService.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.success("Ordem das sugestões atualizada!");
    },
    onError: (err: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["order-bumps"] });
      toast.error(err.message || "Erro ao reordenar sugestões");
    },
  });

  const scheduleSaveOrder = (items: OrderBumpItem[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      reorderMutation.mutate(items.map((i) => i.id));
    }, 250);
  };

  const handleReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setLocalBumps((prev) => {
      const items = [...prev];
      const fromIndex = items.findIndex((i) => i.id === fromId);
      const toIndex = items.findIndex((i) => i.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);

      const total = items.length;
      const updated = items.map((item, idx) => ({
        ...item,
        priority: total - idx,
      }));
      scheduleSaveOrder(updated);
      return updated;
    });
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    setLocalBumps((prev) => {
      const items = [...prev];
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= items.length) return prev;

      const temp = items[targetIdx];
      items[targetIdx] = items[idx];
      items[idx] = temp;

      const total = items.length;
      const updated = items.map((item, i) => ({
        ...item,
        priority: total - i,
      }));
      scheduleSaveOrder(updated);
      return updated;
    });
  };

  // Abertura do modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle("Peça também");
    setFormTriggerType("ALL");
    setFormTriggerProductIds([]);
    setFormTriggerCategoryIds([]);
    setCategorySearch("");
    setFormSuggestedProductId("");
    setSuggestedSearch("");
    setTriggerSearch("");
    setFormPricingType("ORIGINAL");
    setFormCustomPrice("");
    setFormDiscountPercent("");
    setFormPriority("0");
    setFormIsActive(true);
    setFormDisplayLocation("CART");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: OrderBumpItem) => {
    setEditingItem(item);
    setFormTitle(item.title || "Peça também");
    setFormTriggerType(item.triggerType);
    const initialTriggerIds =
      Array.isArray(item.triggerProductIds) && item.triggerProductIds.length > 0
        ? item.triggerProductIds
        : item.triggerProductId
          ? [item.triggerProductId]
          : [];
    setFormTriggerProductIds(initialTriggerIds);
    const initialTriggerCatIds =
      Array.isArray(item.triggerCategoryIds) && item.triggerCategoryIds.length > 0
        ? item.triggerCategoryIds
        : item.triggerCategoryId
          ? [item.triggerCategoryId]
          : [];
    setFormTriggerCategoryIds(initialTriggerCatIds);
    setCategorySearch("");
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
    setFormDisplayLocation(normalizeOrderBumpLocation(item.displayLocation));
    setIsModalOpen(true);
  };

  // Salvar
  const handleSave = () => {
    if (!formSuggestedProductId) {
      toast.error("Selecione o produto que será sugerido");
      return;
    }

    if (formTriggerType === "PRODUCT" && formTriggerProductIds.length === 0) {
      toast.error("Selecione pelo menos um produto gatilho");
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
      triggerProductId: formTriggerType === "PRODUCT" ? (formTriggerProductIds[0] ?? null) : null,
      triggerProductIds: formTriggerType === "PRODUCT" ? formTriggerProductIds : [],
      triggerCategoryId: formTriggerType === "CATEGORY" ? (formTriggerCategoryIds[0] ?? null) : null,
      triggerCategoryIds: formTriggerType === "CATEGORY" ? formTriggerCategoryIds : [],
      suggestedProductId: formSuggestedProductId,
      ...(editingItem ? { priority: Number(formPriority) || 0 } : {}),
      isActive: formIsActive,
      displayLocation: formDisplayLocation,
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
  const filteredBumps = localBumps.filter((item) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && item.isActive) ||
      (statusFilter === "INACTIVE" && !item.isActive);

    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.suggestedProduct?.title || "").toLowerCase().includes(q) ||
      getBumpTriggerTitles(item).some((t) => t.toLowerCase().includes(q)) ||
      getBumpTriggerCategoryTitles(item).some((t) => t.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const totalActive = localBumps.filter((b) => b.isActive).length;
  const totalViews = localBumps.reduce((sum, b) => sum + (b.viewsCount || 0), 0);
  const totalConversions = localBumps.reduce((sum, b) => sum + (b.conversionsCount || 0), 0);
  const totalRevenue = localBumps.reduce((sum, b) => sum + Number(b.totalRevenue || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peça também (Order Bump)</h1>
          <p className="text-sm text-muted-foreground">
            Configure sugestões automáticas no carrinho e na tela do produto para aumentar o ticket médio da sua loja.
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
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | "ACTIVE" | "INACTIVE")}>
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
            {filteredBumps.map((bump) => {
              const globalIdx = localBumps.findIndex((b) => b.id === bump.id);
              const isFirst = globalIdx <= 0;
              const isLast = globalIdx === -1 || globalIdx >= localBumps.length - 1;

              return (
              <div
                key={bump.id}
                draggable
                onDragStart={() => setDraggingId(bump.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggingId) handleReorder(draggingId, bump.id);
                  setDraggingId(null);
                }}
                onDragEnd={() => setDraggingId(null)}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col gap-3",
                  draggingId === bump.id && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 min-w-6 px-1.5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      #{globalIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">Ordem de exibição</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => handleMove(bump.id, "up")}
                      disabled={isFirst}
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => handleMove(bump.id, "down")}
                      disabled={isLast}
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

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
                        Título da seção: <strong>{bump.title}</strong>
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Onde aparece: <strong>{orderBumpLocationLabel(bump.displayLocation)}</strong>
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
                        {getBumpTriggerCategoryTitles(bump).length > 1 ? "Categorias" : "Categoria"}: {formatTriggerCategoriesLabel(bump)}
                      </Badge>
                    )}
                    {bump.triggerType === "PRODUCT" && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold text-[11px]">
                        {getBumpTriggerTitles(bump).length > 1 ? "Produtos" : "Produto"}: {formatTriggerProductsLabel(bump)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Preço da oferta</span>
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
                    className="h-8 w-8 rounded-xl text-slate-400 hover:text-destructive hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Ordem</TableHead>
                  <TableHead>Produto Sugerido</TableHead>
                  <TableHead>Gatilho de Disparo</TableHead>
                  <TableHead>Onde aparece</TableHead>
                  <TableHead>Preço da oferta</TableHead>
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
                  const globalIdx = localBumps.findIndex((b) => b.id === bump.id);
                  const isFirst = globalIdx <= 0;
                  const isLast = globalIdx === -1 || globalIdx >= localBumps.length - 1;

                  return (
                    <TableRow
                      key={bump.id}
                      draggable
                      onDragStart={() => setDraggingId(bump.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggingId) handleReorder(draggingId, bump.id);
                        setDraggingId(null);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      className={cn("hover:bg-muted/50", draggingId === bump.id && "opacity-50")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
                          <span className="text-xs font-bold text-muted-foreground min-w-[22px]">
                            #{globalIdx + 1}
                          </span>
                          <div className="flex flex-col">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:bg-slate-100 hover:text-slate-900"
                              disabled={isFirst}
                              onClick={() => handleMove(bump.id, "up")}
                              title="Mover para cima"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:bg-slate-100 hover:text-slate-900"
                              disabled={isLast}
                              onClick={() => handleMove(bump.id, "down")}
                              title="Mover para baixo"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
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
                            {getBumpTriggerCategoryTitles(bump).length > 1 ? "Categorias" : "Categoria"}: {formatTriggerCategoriesLabel(bump)}
                          </Badge>
                        )}
                        {bump.triggerType === "PRODUCT" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {getBumpTriggerTitles(bump).length > 1 ? "Produtos" : "Produto"}: {formatTriggerProductsLabel(bump)}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {orderBumpLocationLabel(bump.displayLocation)}
                        </Badge>
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
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-slate-100"
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
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
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] p-4 sm:p-6 overflow-y-auto rounded-2xl overscroll-contain">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold">
              {editingItem ? "Editar Sugestão" : "Nova Sugestão"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Defina quando e qual produto deve ser sugerido para o cliente, e onde: no carrinho, na tela do produto ou nos dois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Título exibido na seção (carrinho e tela do produto) */}
            <div>
              <Label className="text-xs font-semibold">Título da seção (carrinho e tela do produto)</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Peça também, Aproveite para levar"
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            {/* Onde mostrar: carrinho, tela do produto ou os dois */}
            <div>
              <Label className="text-xs font-semibold">Onde mostrar?</Label>
              <Select
                value={formDisplayLocation}
                onValueChange={(val) => setFormDisplayLocation(val as OrderBumpDisplayLocation)}
              >
                <SelectTrigger className="mt-1 h-10 rounded-xl" data-testid="order-bump-location">
                  <SelectValue placeholder="Selecione onde a oferta aparece" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {ORDER_BUMP_LOCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="font-medium">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {ORDER_BUMP_LOCATION_OPTIONS.find((opt) => opt.value === formDisplayLocation)?.hint}
              </p>
            </div>

            {/* Quando Disparar (Gatilho) */}
            <div>
              <Label className="text-xs font-semibold">Quando sugerir?</Label>
              <Select
                value={formTriggerType}
                onValueChange={(val) => setFormTriggerType(val as "ALL" | "CATEGORY" | "PRODUCT")}
              >
                <SelectTrigger className="mt-1 h-10 rounded-xl">
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL" className="font-medium">Em qualquer pedido (Geral)</SelectItem>
                  <SelectItem value="CATEGORY" className="font-medium">Quando o carrinho tiver itens de Categorias específicas</SelectItem>
                  <SelectItem value="PRODUCT" className="font-medium">Quando o carrinho tiver um Produto Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Categorias Gatilho (múltiplas — regra OU) */}
            {formTriggerType === "CATEGORY" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-semibold">Selecione as Categorias Gatilho *</Label>
                  {formTriggerCategoryIds.length > 0 && (
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      {formTriggerCategoryIds.length}{" "}
                      {formTriggerCategoryIds.length === 1 ? "selecionada" : "selecionadas"}
                    </span>
                  )}
                </div>

                {selectedTriggerCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTriggerCategories.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-800"
                      >
                        <span>{cat.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormTriggerCategoryIds((prev) => prev.filter((id) => id !== cat.id))
                          }
                          aria-label={`Remover categoria ${cat.title}`}
                          className="rounded-full p-0.5 text-purple-600 hover:bg-purple-200/60 hover:text-purple-900 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <Input
                  type="text"
                  placeholder={
                    formTriggerCategoryIds.length > 0
                      ? "Adicionar outra categoria gatilho..."
                      : "Buscar categoria gatilho..."
                  }
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="h-10 rounded-xl text-sm"
                />

                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {filteredTriggerCategories.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground text-center">
                      {categories.length === formTriggerCategoryIds.length
                        ? "Todas as categorias já foram selecionadas."
                        : "Nenhuma categoria encontrada."}
                    </p>
                  ) : (
                    filteredTriggerCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFormTriggerCategoryIds((prev) =>
                            prev.includes(cat.id) ? prev : [...prev, cat.id],
                          );
                          setCategorySearch("");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-purple-50/70 transition"
                      >
                        <span className="font-medium text-slate-700">{cat.title}</span>
                        <span className="text-xs font-semibold text-purple-600">+ Adicionar</span>
                      </button>
                    ))
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  A sugestão aparece se o carrinho tiver qualquer produto de qualquer uma das categorias marcadas (regra OU).
                </p>
              </div>
            )}

            {/* Seletor de Produtos Gatilho Estilo Combo (múltiplos — regra OU) */}
            {formTriggerType === "PRODUCT" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-semibold">Selecione os Produtos Gatilho *</Label>
                  {formTriggerProductIds.length > 0 && (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {formTriggerProductIds.length}{" "}
                      {formTriggerProductIds.length === 1 ? "selecionado" : "selecionados"}
                    </span>
                  )}
                </div>

                {selectedTriggerProducts.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedTriggerProducts.map((prod) => {
                      const img = prod.images?.[0]?.url;
                      const prodPrice = "promotionalPrice" in prod ? getEffectiveProductPrice(prod) : Number(prod.price) || 0;
                      return (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white overflow-hidden shrink-0 border border-indigo-100">
                              {img ? (
                                <img
                                  src={buildImageUrl(img)}
                                  alt={prod.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{prod.title}</p>
                              {prodPrice > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  R$ {prodPrice.toFixed(2).replace(".", ",")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Remover gatilho ${prod.title}`}
                            onClick={() =>
                              setFormTriggerProductIds((prev) => prev.filter((id) => id !== prod.id))
                            }
                            className="h-8 px-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Remover
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={
                        formTriggerProductIds.length > 0
                          ? "Buscar outro produto gatilho para adicionar..."
                          : "Digite o nome do produto gatilho para buscar..."
                      }
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
                          const pPrice = getEffectiveProductPrice(prod);
                          const img = prod.images?.[0]?.url;

                          return (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setFormTriggerProductIds((prev) =>
                                  prev.includes(prod.id) ? prev : [...prev, prod.id]
                                );
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
                  <p className="text-[11px] text-muted-foreground">
                    A oferta aparece quando o carrinho ou a tela atual tiver qualquer um dos produtos escolhidos.
                  </p>
                </div>
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
                      <p className="text-[11px] sm:text-xs text-indigo-600 font-semibold uppercase tracking-wider">
                        Produto Sugerido
                      </p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {selectedSuggestedProduct.title}
                      </p>
                      <p className="text-xs font-semibold text-slate-600">
                        R$ {getEffectiveProductPrice(selectedSuggestedProduct).toFixed(2).replace(".", ",")}
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
                    className="text-xs font-semibold border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 text-indigo-700 h-8 px-3 shrink-0 rounded-lg"
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
                          const pPrice = getEffectiveProductPrice(prod);
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
            <div className="p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                  Preço da Oferta
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formDisplayLocation === "PRODUCT"
                    ? "Defina o valor especial exibido na tela do produto."
                    : formDisplayLocation === "CART"
                    ? "Defina o valor especial exibido no carrinho."
                    : "Defina o valor especial exibido no carrinho e na tela do produto."}
                </p>
              </div>
              
              <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2.5 sm:gap-3">
                <Button
                  type="button"
                  variant={formPricingType === "ORIGINAL" ? "default" : "outline"}
                  onClick={() => setFormPricingType("ORIGINAL")}
                  className={cn(
                    "h-10 text-xs font-semibold rounded-xl transition-all",
                    formPricingType === "ORIGINAL"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700 border-slate-200"
                  )}
                >
                  Preço Normal
                </Button>
                <Button
                  type="button"
                  variant={formPricingType === "CUSTOM" ? "default" : "outline"}
                  onClick={() => setFormPricingType("CUSTOM")}
                  className={cn(
                    "h-10 text-xs font-semibold rounded-xl transition-all",
                    formPricingType === "CUSTOM"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700 border-slate-200"
                  )}
                >
                  Preço Fixo (R$)
                </Button>
                <Button
                  type="button"
                  variant={formPricingType === "PERCENT" ? "default" : "outline"}
                  onClick={() => setFormPricingType("PERCENT")}
                  className={cn(
                    "h-10 text-xs font-semibold rounded-xl transition-all",
                    formPricingType === "PERCENT"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700 border-slate-200"
                  )}
                >
                  Desconto (%)
                </Button>
              </div>

              {formPricingType === "CUSTOM" && (
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Preço Promocional Exclusivo da Oferta (R$)</Label>
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
                  <Label className="text-xs font-semibold mb-1 block">Percentual de Desconto da Oferta (%)</Label>
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
              <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-3">
                <div className="min-w-0 pr-2">
                  <Label className="text-xs font-semibold block">Status da Sugestão</Label>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Ative ou pause a exibição desta sugestão a qualquer momento.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                  <span className="text-xs font-semibold text-slate-700 min-w-[42px] text-right">
                    {formIsActive ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2.5 sm:gap-3 mt-4 pt-3 flex flex-col-reverse sm:flex-row sm:justify-end w-full border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto h-11 sm:h-10 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {editingItem ? "Salvar Alterações" : "Criar Sugestão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
