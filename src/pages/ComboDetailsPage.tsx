import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Plus, Package, Upload, Loader2, Sparkles, Check, X, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/common/PageLoader";
import { RichTextEditor } from "@/components/ui/richtexteditor";
import { toast } from "sonner";
import { buildImageUrl } from "@/utils/image-url";
import { comboService, type Combo, type ComboItemInput } from "@/services/combo.service";
import { getProducts } from "@/services/product.service";
import { getCategories } from "@/services/category.service";
import type { ProductResponse } from "@/types/product";
import type { Category } from "@/types/category";

export default function ComboDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewCombo = !id || id === "novo";

  const [isLoading, setIsLoading] = useState(!isNewCombo);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [price, setPrice] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxPerOrder, setMaxPerOrder] = useState("");
  const [maxTotalSales, setMaxTotalSales] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [items, setItems] = useState<ComboItemInput[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductResponse[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Submodal para adicionar item ao combo
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [selectedProductItemId, setSelectedProductItemId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<string>("1");

  useEffect(() => {
    loadCategories();
    loadProducts();
    if (!isNewCombo) {
      loadComboData();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await getProducts({ limit: 1000, page: 1 });
      setAvailableProducts(res.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadComboData = async () => {
    if (!id || id === "novo") return;
    try {
      setIsLoading(true);
      const combo = await comboService.getById(id);
      setName(combo.name);
      setDescription(combo.description || "");
      setCategoryId(combo.categoryId || "none");
      setPrice(
        combo.price !== undefined && combo.price !== null
          ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
              Number(combo.price)
            )
          : ""
      );
      setIsActive(combo.isActive);
      setStartDate(combo.startDate ? combo.startDate.slice(0, 10) : "");
      setEndDate(combo.endDate ? combo.endDate.slice(0, 10) : "");
      setMaxPerOrder(combo.maxPerOrder ? String(combo.maxPerOrder) : "");
      setMaxTotalSales(combo.maxTotalSales ? String(combo.maxTotalSales) : "");
      setImageUrl(combo.imageUrl || "");
      setImagePreview(combo.imageUrl ? buildImageUrl(combo.imageUrl) : null);
      setImageFile(null);
      setItems(
        (combo.items || []).map((ci) => ({
          productId: ci.productId,
          productItemId: ci.productItemId || undefined,
          quantity: ci.quantity,
          variation: ci.variation || undefined,
        }))
      );
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar dados do combo.");
      navigate("/combos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Cálculo da soma dos preços individuais dos componentes
  const originalTotalPrice = items.reduce((acc, it) => {
    const prod = availableProducts.find((p) => p.id === it.productId);
    if (!prod) return acc;
    const promo = prod.promotionalPrice ? Number(prod.promotionalPrice) : 0;
    const normal = prod.price ? Number(prod.price) : 0;
    const pPrice = promo > 0 ? promo : normal;
    return acc + pPrice * it.quantity;
  }, 0);

  const priceDigits = price.replace(/\D/g, "");
  const numericPrice = priceDigits ? Number(priceDigits) / 100 : 0;
  const discountSavings = Math.max(0, originalTotalPrice - numericPrice);
  const discountPct =
    originalTotalPrice > 0 && numericPrice > 0
      ? Math.round(((originalTotalPrice - numericPrice) / originalTotalPrice) * 100)
      : 0;

  const handleAddItemToCombo = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto.");
      return;
    }
    const qtyNum = parseInt(itemQuantity.replace(/\D/g, ""), 10);
    if (!qtyNum || qtyNum < 1) {
      toast.error("A quantidade deve ser de no mínimo 1.");
      return;
    }

    const prod = availableProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    let varText = selectedVariation;
    let itemId = selectedProductItemId;

    if (itemId === "none") {
      itemId = "";
      varText = "";
    } else if (
      !itemId &&
      prod.items &&
      prod.items.length === 1 &&
      (!prod.items[0].options || prod.items[0].options.length === 0)
    ) {
      itemId = prod.items[0].id;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: selectedProductId,
        productItemId: itemId || undefined,
        quantity: qtyNum,
        variation: varText || undefined,
      },
    ]);

    setSelectedProductId("");
    setSelectedVariation("");
    setSelectedProductItemId("");
    setItemQuantity("1");
    setProductSearch("");
    setIsAddItemOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCombo = async () => {
    if (!name.trim()) {
      toast.error("O nome do combo é obrigatório.");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto ao combo.");
      return;
    }

    const priceDigits = price.replace(/\D/g, "");
    const priceNum = priceDigits ? Number(priceDigits) / 100 : 0;
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Informe um preço de venda válido maior que zero.");
      return;
    }

    try {
      setIsSaving(true);

      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await comboService.uploadImage(imageFile);
        finalImageUrl = uploadRes.url;
      }

      const cleanedDescription = description ? description.replace(/<p><\/p>/g, "").trim() : "";

      const payload = {
        name: name.trim(),
        description: cleanedDescription || undefined,
        imageUrl: finalImageUrl || undefined,
        categoryId: !categoryId || categoryId === "none" ? null : categoryId,
        price: priceNum,
        isActive,
        startDate: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : null,
        endDate: endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : null,
        maxPerOrder: maxPerOrder ? parseInt(maxPerOrder, 10) : null,
        maxTotalSales: maxTotalSales ? parseInt(maxTotalSales, 10) : null,
        items,
      };

      if (!isNewCombo && id) {
        await comboService.update(id, payload);
        toast.success("Combo atualizado com sucesso!");
      } else {
        const created = await comboService.create(payload);
        toast.success("Combo criado com sucesso!");
        navigate(`/combos/${created.id}`, { replace: true });
        return;
      }

      loadComboData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar combo.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProdForAdd = availableProducts.find((p) => p.id === selectedProductId);

  if (isLoading) {
    return <PageLoader message="Carregando combo..." />;
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Padronizado */}
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => navigate("/combos")}
            className="-ml-3 w-fit hover:bg-transparent flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para combos</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNewCombo ? "Novo combo" : name || "Editar combo"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure informações, produtos inclusos, preço e limites do combo promocional.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="combo-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="combo-active" className="cursor-pointer font-semibold">
              {isActive ? "Ativo" : "Inativo"}
            </Label>
          </div>
          <Button
            type="button"
            className="h-12 rounded-2xl px-8 font-semibold shadow-lg transition-all hover:scale-[1.02] bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isSaving}
            onClick={() => void handleSaveCombo()}
          >
            {isSaving ? (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Salvando...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Salvar combo
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        <Tabs defaultValue="combo" className="w-full">
          <TabsList className="mb-8 border-b rounded-none w-full justify-start bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="combo"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent pb-3 pt-2 px-1 text-base font-semibold data-[state=active]:bg-transparent"
            >
              Combo e Produtos
            </TabsTrigger>
            <TabsTrigger
              value="disponibilidade"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none bg-transparent pb-3 pt-2 px-1 text-base font-semibold data-[state=active]:bg-transparent"
            >
              Disponibilidade e Limites
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Dados do Combo e Itens */}
          <TabsContent value="combo" className="space-y-8 outline-none">
            {/* Foto e Dados Básicos */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold">Informações Básicas</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="combo-name" className="text-sm font-semibold">
                    Nome do Combo *
                  </Label>
                  <Input
                    id="combo-name"
                    placeholder="Ex: Combo Especial 2x Pods + Juice"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="combo-description" className="text-sm font-semibold">
                    Descrição (Suporta formatação, negrito, etc.)
                  </Label>
                  <RichTextEditor value={description} onChange={setDescription} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-category" className="text-sm font-semibold">
                    Categoria
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="combo-category">
                      <SelectValue placeholder="Selecione uma categoria (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-price" className="text-sm font-semibold">
                    Preço de Venda do Combo (R$) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      R$
                    </span>
                    <Input
                      id="combo-price"
                      type="tel"
                      inputMode="numeric"
                      placeholder="0,00"
                      className="pl-9 font-semibold"
                      value={
                        price
                          ? new Intl.NumberFormat("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(price.replace(/\D/g, "")) / 100)
                          : ""
                      }
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        if (!digits) {
                          setPrice("");
                        } else {
                          const formatted = new Intl.NumberFormat("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(digits) / 100);
                          setPrice(formatted);
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Upload de Imagem */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold">Imagem do Combo</Label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border bg-muted">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setImageUrl("");
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                          title="Remover imagem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                        <Upload className="w-7 h-7 mb-1" />
                        <span className="text-[11px]">Sem foto</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG ou WebP. Será otimizado automaticamente para vitrine.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO: Componentes do Combo */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    Produtos Inclusos no Combo ({items.length})
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Adicione os produtos que fazem parte deste combo. O estoque é calculado automaticamente com base no estoque real de cada item.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddItemOpen(true)}
                  className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="p-8 border border-dashed rounded-2xl text-center bg-muted/20 text-muted-foreground">
                  <Boxes className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="font-medium text-sm">Nenhum produto adicionado ao combo ainda.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique no botão acima para adicionar produtos ao combo.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((it, idx) => {
                    const prod = availableProducts.find((p) => p.id === it.productId);
                    const promo = prod?.promotionalPrice ? Number(prod.promotionalPrice) : 0;
                    const normal = prod?.price ? Number(prod.price) : 0;
                    const itemPrice = promo > 0 ? promo : normal;
                    const imgUrl = prod?.images?.[0]?.url;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 border rounded-xl bg-card shadow-xs gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border">
                            {imgUrl ? (
                              <img src={buildImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold truncate text-foreground">
                              {prod?.title || "Produto"}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {it.variation ? (
                                <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-medium text-indigo-700">
                                  {it.variation}
                                </span>
                              ) : prod?.items && prod.items.some((i) => i.options && i.options.length > 0) ? (
                                <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium text-amber-700">
                                  Cliente escolhe na loja
                                </span>
                              ) : null}
                              <span>
                                {it.quantity}x de R$ {itemPrice.toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold whitespace-nowrap">
                            R$ {(itemPrice * it.quantity).toFixed(2).replace(".", ",")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Card de Economia / Desconto */}
              {items.length > 0 && (
                <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                      Valor Avulso Somado
                    </span>
                    <span className="text-lg font-semibold">
                      R$ {originalTotalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                      Preço do Combo
                    </span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      R$ {numericPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  {discountPct > 0 && (
                    <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-3.5 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Economia de R$ {discountSavings.toFixed(2).replace(".", ",")} ({discountPct}% OFF)
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: Disponibilidade e Limites */}
          <TabsContent value="disponibilidade" className="space-y-8 outline-none">
            <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold">Disponibilidade e Limites</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="combo-start" className="text-sm font-semibold">
                    Disponível a partir de
                  </Label>
                  <Input
                    id="combo-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-end" className="text-sm font-semibold">
                    Disponível até
                  </Label>
                  <Input
                    id="combo-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-max-order" className="text-sm font-semibold">
                    Limite de unidades por pedido
                  </Label>
                  <Input
                    id="combo-max-order"
                    type="text"
                    inputMode="numeric"
                    placeholder="Sem limite"
                    value={maxPerOrder}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setMaxPerOrder(digits ? String(parseInt(digits, 10)) : "");
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para permitir qualquer quantidade.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-max-sales" className="text-sm font-semibold">
                    Limite total de vendas do combo
                  </Label>
                  <Input
                    id="combo-max-sales"
                    type="text"
                    inputMode="numeric"
                    placeholder="Sem limite"
                    value={maxTotalSales}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setMaxTotalSales(digits ? String(parseInt(digits, 10)) : "");
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Quando atingir este número de vendas, o combo é esgotado automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submodal para adicionar item ao combo */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Adicionar Produto ao Combo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="product-search-input" className="text-xs font-semibold">
                  Buscar Produto *
                </Label>
                {productSearch && (
                  <span className="text-xs text-muted-foreground">
                    {availableProducts.filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase())).length} encontrado(s)
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="product-search-input"
                  placeholder="Digite o nome do produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pr-8"
                  autoFocus
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista visual de produtos com scroll */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground font-medium">
                {selectedProductId ? "Produto Selecionado" : "Selecione um produto da lista"}
              </Label>
              <div className="max-h-56 overflow-y-auto border rounded-xl divide-y bg-muted/10">
                {isLoadingProducts ? (
                  <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Carregando produtos...
                  </div>
                ) : (
                  (() => {
                    const filtered = availableProducts.filter((p) =>
                      p.title.toLowerCase().includes(productSearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Nenhum produto encontrado com "{productSearch}".
                        </div>
                      );
                    }

                    return filtered.map((prod) => {
                      const isSelected = selectedProductId === prod.id;
                      const promo = prod.promotionalPrice ? Number(prod.promotionalPrice) : 0;
                      const normal = prod.price ? Number(prod.price) : 0;
                      const prodPrice = promo > 0 ? promo : normal;
                      const img = prod.images?.[0]?.url;

                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setSelectedVariation("");
                            setSelectedProductItemId("");
                          }}
                          className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors text-left ${
                            isSelected
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600"
                              : "hover:bg-muted/50"
                          }`}
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
                              <p className={`text-sm font-medium truncate ${isSelected ? "text-indigo-950 dark:text-indigo-300 font-semibold" : ""}`}>
                                {prod.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                R$ {prodPrice.toFixed(2).replace(".", ",")}
                                {prod.items && prod.items.length > 1 && (
                                  <span className="ml-2 text-indigo-600 font-medium">
                                    • {prod.items.length} variações
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-muted-foreground/30" />
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            {/* Variações do produto se houver */}
            {selectedProdForAdd &&
              selectedProdForAdd.items &&
              selectedProdForAdd.items.length > 0 &&
              selectedProdForAdd.items.some((i) => i.options && i.options.length > 0) && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Variação do Produto (Opcional)</Label>
                    <span className="text-[11px] text-muted-foreground">Opcional</span>
                  </div>
                  <Select
                    value={selectedProductItemId || "none"}
                    onValueChange={(val) => {
                      if (val === "none") {
                        setSelectedProductItemId("");
                        setSelectedVariation("");
                      } else {
                        setSelectedProductItemId(val);
                        const itm = selectedProdForAdd.items?.find((i) => i.id === val);
                        if (itm && itm.options) {
                          setSelectedVariation(itm.options.map((o) => o.optionValue).join(" - "));
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione ou deixe para o cliente escolher..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Sem variação específica (Cliente escolhe na loja)
                      </SelectItem>
                      {selectedProdForAdd.items.map((itm) => {
                        const label = itm.options?.map((o) => o.optionValue).join(" - ") || "Padrão";
                        return (
                          <SelectItem key={itm.id} value={itm.id}>
                            {label} (Estoque: {itm.stock})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Se você não escolher uma variação, o cliente poderá escolher pelo modal da loja ao comprar.
                  </p>
                </div>
              )}

            {/* Quantidade no Combo */}
            <div className="space-y-2">
              <Label htmlFor="item-qty" className="text-xs font-semibold">
                Quantidade no Combo *
              </Label>
              <Input
                id="item-qty"
                type="text"
                inputMode="numeric"
                value={itemQuantity}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setItemQuantity(digits ? String(parseInt(digits, 10)) : "1");
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddItemToCombo}
                disabled={!selectedProductId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Incluir no Combo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
