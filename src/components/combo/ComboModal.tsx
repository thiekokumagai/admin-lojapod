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
import { Plus, Trash2, Upload, Loader2, Search, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { buildImageUrl } from "@/utils/image-url";
import { getProducts } from "@/services/product.service";
import { getCategories } from "@/services/category.service";
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
  const [itemQuantity, setItemQuantity] = useState<number>(1);

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
      setPrice(String(comboToEdit.price));
      setIsActive(comboToEdit.isActive);
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
    const pPrice = prod.promotionalPrice || prod.price || 0;
    return acc + pPrice * it.quantity;
  }, 0);

  const numericPrice = parseFloat(price.replace(",", ".")) || 0;
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
    if (itemQuantity < 1) {
      toast.error("A quantidade deve ser de no mínimo 1.");
      return;
    }

    const prod = availableProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Se o produto tiver variações e o usuário não escolheu nenhuma, verifica se tem items
    let varText = selectedVariation;
    let itemId = selectedProductItemId;

    if (!itemId && prod.items && prod.items.length === 1) {
      itemId = prod.items[0].id;
      if (!varText && prod.items[0].options?.length > 0) {
        varText = prod.items[0].options.map((o) => o.optionValue).join(" - ");
      }
    }

    setItems((prev) => [
      ...prev,
      {
        productId: selectedProductId,
        productItemId: itemId || undefined,
        quantity: itemQuantity,
        variation: varText || undefined,
      },
    ]);

    // Limpa estado do modal de adicionar
    setSelectedProductId("");
    setSelectedVariation("");
    setSelectedProductItemId("");
    setItemQuantity(1);
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

    const priceNum = parseFloat(price.replace(",", "."));
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

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: finalImageUrl || undefined,
        categoryId: categoryId === "none" ? undefined : categoryId,
        price: priceNum,
        isActive,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        maxPerOrder: maxPerOrder ? parseInt(maxPerOrder, 10) : undefined,
        maxTotalSales: maxTotalSales ? parseInt(maxTotalSales, 10) : undefined,
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
                <Label htmlFor="combo-description">Descrição</Label>
                <Textarea
                  id="combo-description"
                  placeholder="Descreva o que vem no combo ou detalhes da promoção..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
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
                <Input
                  id="combo-price"
                  placeholder="99,90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
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
                    const itemPrice = prod ? prod.promotionalPrice || prod.price || 0 : 0;
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
                              {it.variation && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-700">
                                  {it.variation}
                                </span>
                              )}
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
                    type="number"
                    min="1"
                    placeholder="Sem limite"
                    value={maxPerOrder}
                    onChange={(e) => setMaxPerOrder(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="combo-max-sales">Limite total de vendas do combo</Label>
                  <Input
                    id="combo-max-sales"
                    type="number"
                    min="1"
                    placeholder="Sem limite"
                    value={maxTotalSales}
                    onChange={(e) => setMaxTotalSales(e.target.value)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Produto ao Combo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Pesquisar Produto</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Nome do produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select
                value={selectedProductId}
                onValueChange={(val) => {
                  setSelectedProductId(val);
                  setSelectedVariation("");
                  setSelectedProductItemId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {availableProducts
                    .filter((p) =>
                      p.title.toLowerCase().includes(productSearch.toLowerCase()),
                    )
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} - R$ {(p.promotionalPrice || p.price || 0).toFixed(2).replace(".", ",")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variações do produto se houver */}
            {selectedProdForAdd && selectedProdForAdd.items && selectedProdForAdd.items.length > 0 && (
              <div className="space-y-2">
                <Label>Variação / Item</Label>
                <Select
                  value={selectedProductItemId}
                  onValueChange={(val) => {
                    setSelectedProductItemId(val);
                    const itm = selectedProdForAdd.items?.find((i) => i.id === val);
                    if (itm && itm.options) {
                      setSelectedVariation(itm.options.map((o) => o.optionValue).join(" - "));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a variação (ex: 35mg, sabor)..." />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="item-qty">Quantidade no Combo *</Label>
              <Input
                id="item-qty"
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddItemToCombo} className="bg-indigo-600 hover:bg-indigo-700">
              Incluir no Combo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
