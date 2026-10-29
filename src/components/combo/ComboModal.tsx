import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Upload, Loader2, Search, Package, Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";
import { buildImageUrl } from "@/utils/image-url";
import { getProducts } from "@/services/product.service";
import { getCategories } from "@/services/category.service";
import { RichTextEditor } from "@/components/ui/richtexteditor";
import {
  comboService,
  type Combo,
  type ComboItemInput,
} from "@/services/combo.service";
import type { ProductResponse } from "@/types/product";
import type { Category } from "@/types/category";

interface ComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  comboToEdit?: Combo | null;
  onSuccess: () => void;
}

export function ComboModal({
  isOpen,
  onClose,
  comboToEdit,
  onSuccess,
}: ComboModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [price, setPrice] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal para adicionar item ao combo
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [selectedProductItemId, setSelectedProductItemId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<string>("1");

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (comboToEdit && isOpen) {
      setName(comboToEdit.name);
      setDescription(comboToEdit.description || "");
      setCategoryId(comboToEdit.categoryId || "none");
      setPrice(
        comboToEdit.price !== undefined && comboToEdit.price !== null
          ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(comboToEdit.price))
          : ""
      );
      setIsActive(comboToEdit.isActive);
      setIsFeatured(!!comboToEdit.isFeatured);
      setStartDate(comboToEdit.startDate ? comboToEdit.startDate.slice(0, 10) : "");
      setEndDate(comboToEdit.endDate ? comboToEdit.endDate.slice(0, 10) : "");
      setMaxPerOrder(comboToEdit.maxPerOrder ? String(comboToEdit.maxPerOrder) : "");
      setMaxTotalSales(comboToEdit.maxTotalSales ? String(comboToEdit.maxTotalSales) : "");
      setImageUrl(comboToEdit.imageUrl || "");
      setImagePreview(comboToEdit.imageUrl ? buildImageUrl(comboToEdit.imageUrl) : null);
      setImageFile(null);

      setItems(
        (comboToEdit.items || []).map((ci) => ({
          productId: ci.productId,
          productItemId: ci.productItemId || undefined,
          quantity: ci.quantity,
          variation: ci.variation || undefined,
        })),
      );
    } else if (isOpen) {
      // Reset form
      setName("");
      setDescription("");
      setCategoryId("none");
      setPrice("");
      setIsActive(true);
      setIsFeatured(false);
      setStartDate("");
      setEndDate("");
      setMaxPerOrder("");
      setMaxTotalSales("");
      setImageUrl("");
      setImagePreview(null);
      setImageFile(null);
      setItems([]);
    }
  }, [comboToEdit, isOpen]);

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

    // Se o produto tiver variações e o usuário não escolheu nenhuma, verifica se tem items
    let varText = selectedVariation;
    let itemId = selectedProductItemId;

    if (itemId === "none") {
      itemId = "";
      varText = "";
    } else if (!itemId && prod.items && prod.items.length === 1 && (!prod.items[0].options || prod.items[0].options.length === 0)) {
      // Apenas produto simples sem opções pode herdar o itemId automaticamente
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

    // Limpa estado do modal de adicionar
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      setIsSubmitting(true);

      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await comboService.uploadImage(imageFile);
        finalImageUrl = uploadRes.url;
      }

      const cleanedDescription = description
        ? description.replace(/<p><\/p>/g, "").trim()
        : "";

      const payload = {
        name: name.trim(),
        description: cleanedDescription || undefined,
        imageUrl: finalImageUrl || undefined,
        categoryId: (!categoryId || categoryId === "none") ? null : categoryId,
        price: priceNum,
        isActive,
        isFeatured,
        startDate: startDate ? new Date(`${startDate}T00:00:00`).toISOString() : null,
        endDate: endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : null,
        maxPerOrder: maxPerOrder ? parseInt(maxPerOrder, 10) : null,
        maxTotalSales: maxTotalSales ? parseInt(maxTotalSales, 10) : null,
        items,
      };

      if (comboToEdit) {
        await comboService.update(comboToEdit.id, payload);
        toast.success("Combo atualizado com sucesso!");
      } else {
        await comboService.create(payload);
        toast.success("Combo criado com sucesso!");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar combo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProdForAdd = availableProducts.find((p) => p.id === selectedProductId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              {comboToEdit ? "Editar Combo" : "Novo Combo"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="combo-name">Nome do Combo *</Label>
                <Input
                  id="combo-name"
                  placeholder="Ex: Combo Juice + Pod Especial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="combo-description">Descrição (Suporta formatação, negrito, etc.)</Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="combo-category">Categoria</Label>
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
                <Label htmlFor="combo-price">Preço de Venda (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
                    R$
                  </span>
                  <Input
                    id="combo-price"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="0,00"
                    className="pl-9"
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

              {/* Imagem do Combo */}
              <div className="space-y-2 md:col-span-2">
                <Label>Imagem do Combo</Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setImageUrl("");
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <Upload className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[10px]">Sem foto</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG ou WebP. Será otimizado automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO: Produtos que Compõem o Combo */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    Produtos Componentes ({items.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    O estoque do combo é calculado pelo estoque real destes itens.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddItemOpen(true)}
                  className="gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="p-6 border border-dashed rounded-lg text-center bg-slate-50 text-slate-500 text-sm">
                  Nenhum produto adicionado ao combo ainda. Clique em "Adicionar Produto".
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it, idx) => {
                    const prod = availableProducts.find((p) => p.id === it.productId);
                    const promo = prod?.promotionalPrice ? Number(prod.promotionalPrice) : 0;
                    const normal = prod?.price ? Number(prod.price) : 0;
                    const itemPrice = promo > 0 ? promo : normal;
                    const imgUrl = prod?.images?.[0]?.url;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden shrink-0 border">
                            {imgUrl ? (
                              <img
                                src={buildImageUrl(imgUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-slate-800 truncate">
                              {prod?.title || "Produto"}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
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
                          <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
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

              {/* Painel de Economia e Valores */}
              {items.length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">
                      Valor Avulso Somado
                    </span>
                    <span className="text-lg font-semibold text-slate-700">
                      R$ {originalTotalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">
                      Preço do Combo
                    </span>
                    <span className="text-lg font-bold text-indigo-700">
                      R$ {numericPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  {discountPct > 0 && (
                    <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Economia de R$ {discountSavings.toFixed(2).replace(".", ",")} ({discountPct}% OFF)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO: Regras de Disponibilidade e Limites */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-800">
                Disponibilidade e Limites
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg md:col-span-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="combo-active" className="text-sm font-medium">
                      Status do Combo
                    </Label>
                    <p className="text-xs text-slate-500">
                      {isActive
                        ? "Ativo (visível na loja se houver estoque)"
                        : "Inativo (não aparece nem pode ser comprado)"}
                    </p>
                  </div>
                  <Switch
                    id="combo-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div>
                    <Label htmlFor="combo-featured" className="font-semibold text-slate-700">
                      Combo em Destaque
                    </Label>
                    <p className="text-xs text-slate-500">
                      Exibir o combo na seção de destaques superiores da loja
                    </p>
                  </div>
                  <Switch
                    id="combo-featured"
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-start">Disponível a partir de</Label>
                  <Input
                    id="combo-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-end">Disponível até</Label>
                  <Input
                    id="combo-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-max-order">Limite de unidades por pedido</Label>
                  <Input
                    id="combo-max-order"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Sem limite"
                    value={maxPerOrder}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setMaxPerOrder(digits ? String(parseInt(digits, 10)) : "");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-max-sales">Limite total de vendas do combo</Label>
                  <Input
                    id="combo-max-sales"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Sem limite"
                    value={maxTotalSales}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setMaxTotalSales(digits ? String(parseInt(digits, 10)) : "");
                    }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : comboToEdit ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Combo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submodal para adicionar item ao combo */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Combo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Seletor com busca como no pedido manual */}
            {selectedProdForAdd ? (
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-white overflow-hidden shrink-0 border border-indigo-100 flex items-center justify-center">
                    {selectedProdForAdd.images?.[0]?.url ? (
                      <img src={buildImageUrl(selectedProdForAdd.images[0].url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Produto Selecionado</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedProdForAdd.title}</p>
                    <p className="text-xs font-semibold text-slate-600">
                      R$ {(Number(selectedProdForAdd.promotionalPrice || selectedProdForAdd.price || 0)).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProductId("");
                    setSelectedVariation("");
                    setSelectedProductItemId("");
                    setProductSearch("");
                  }}
                  className="text-xs font-semibold border-indigo-200 hover:bg-white text-indigo-700 h-8"
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="product-search-input">Buscar Produto *</Label>
                  {productSearch && (
                    <span className="text-xs text-slate-500">
                      {availableProducts.filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase())).length} encontrado(s)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="product-search-input"
                    placeholder="Digite o nome do produto para buscar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 pr-8 h-10"
                    autoFocus
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista dinâmica que só aparece ao pesquisar */}
                {productSearch.trim().length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded-xl divide-y bg-white shadow-sm">
                    {isLoadingProducts ? (
                      <div className="p-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        Carregando produtos...
                      </div>
                    ) : (
                      (() => {
                        const filtered = availableProducts.filter((p) =>
                          p.title.toLowerCase().includes(productSearch.toLowerCase()),
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="p-6 text-center text-sm text-slate-500">
                              Nenhum produto encontrado com "{productSearch}".
                            </div>
                          );
                        }

                        return filtered.slice(0, 30).map((prod) => {
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
                                setProductSearch("");
                              }}
                              className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-indigo-50/70 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                  {img ? (
                                    <img
                                      src={buildImageUrl(img)}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">
                                    {prod.title}
                                  </p>
                                  <p className="text-xs text-slate-500">
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
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md hover:bg-indigo-100">
                                  Selecionar
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-slate-400 border border-dashed rounded-xl bg-slate-50/50">
                    Digite o nome do produto no campo acima para pesquisar.
                  </div>
                )}
              </div>
            )}

            {/* Variações do produto se houver */}
            {selectedProdForAdd && selectedProdForAdd.items && selectedProdForAdd.items.length > 0 && selectedProdForAdd.items.some((i) => i.options && i.options.length > 0) && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">
                    Variação do Produto (Opcional)
                  </Label>
                  <span className="text-[11px] text-slate-500">
                    Opcional
                  </span>
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
                  <SelectTrigger className="bg-white">
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
                <p className="text-[11px] text-slate-500">
                  Se você não escolher uma variação, o cliente poderá escolher pelo modal da loja ao comprar.
                </p>
              </div>
            )}

            {/* Quantidade no Combo com inputMode e máscara de dígitos */}
            <div className="space-y-2">
              <Label htmlFor="item-qty">Quantidade no Combo *</Label>
              <Input
                id="item-qty"
                type="text"
                inputMode="numeric"
                placeholder="1"
                value={itemQuantity}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setItemQuantity(digits ? String(parseInt(digits, 10)) : "");
                }}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedProductId("");
                setSelectedVariation("");
                setSelectedProductItemId("");
                setProductSearch("");
                setItemQuantity("1");
                setIsAddItemOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddItemToCombo}
              disabled={!selectedProductId}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Incluir no Combo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
