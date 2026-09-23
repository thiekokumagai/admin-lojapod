import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Trash2, EyeOff, Eye, X, Copy, Plus, Minus } from "lucide-react";
import type { ProductResponse } from "@/types/product";
import { buildImageUrl } from "@/utils/image-url";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE = 30;

type SortField = "title" | "price" | null;
type SortDir = "asc" | "desc";

export interface ProductListTableFilters {
  search: string;
  status: "all" | "active" | "inactive" | "critical" | "low_stock" | "stagnant" | "out_of_stock";
  categoryId: string;
}

interface Category {
  id: string;
  title: string;
}

interface InlinePriceInputProps {
  value?: number;
  onSave: (newValue: number) => Promise<void>;
}

function InlinePriceInput({ value, onSave }: InlinePriceInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setInputValue(
        value !== undefined
          ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
          : ""
      );
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isEditing, value]);

  const handleSave = async () => {
    const digits = inputValue.replace(/\D/g, "");
    const parsed = digits ? Number(digits) / 100 : 0;
    
    if (isNaN(parsed) || parsed < 0) {
      setIsEditing(false);
      return;
    }

    if (parsed === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(parsed);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleInputChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) {
      setInputValue("");
      return;
    }
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(digits) / 100);
    setInputValue(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isSaving) {
    return (
      <div className="flex items-center justify-start gap-1 h-8 w-28 text-muted-foreground text-sm font-medium">
        <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
        <span>R$ ...</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-start relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={() => void handleSave()}
          onKeyDown={handleKeyDown}
          className="h-8 w-28 pl-7 pr-2 text-left text-sm font-semibold border-primary ring-1 ring-primary/30 rounded-none bg-background"
          placeholder="0,00"
        />
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className="group flex items-center justify-start gap-1.5 h-8 px-2 rounded hover:bg-muted border border-transparent hover:border-muted-foreground/20 cursor-text text-left select-none font-semibold text-foreground"
    >
      <span>{value !== undefined ? `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}` : "R$ —"}</span>
      <span className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 transition-opacity text-[10px]">
        ✏️
      </span>
    </div>
  );
}

function InlineStockEditor({ stock, onAdd, onSub }: { stock: number; onAdd: () => Promise<void>; onSub: () => Promise<void> }) {
  const [isPending, setIsPending] = useState(false);

  const handleUpdate = async (type: 'add' | 'sub') => {
    setIsPending(true);
    try {
      if (type === 'add') await onAdd();
      else await onSub();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button 
        variant="outline"
        size="icon"
        className="h-6 w-6 rounded-sm"
        onClick={(e) => { e.stopPropagation(); void handleUpdate('sub'); }}
        disabled={isPending || stock <= 0}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="font-semibold text-sm w-8 text-center"> {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : stock}</span>
      <Button 
        variant="outline"
        size="icon"
        onClick={(e) => { e.stopPropagation(); void handleUpdate('add'); }}
        disabled={isPending}
        className="h-6 w-6 rounded-sm"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface ProductListTableProps {
  products: ProductResponse[];
  categories: Category[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  filters: ProductListTableFilters;
  onFiltersChange: (filters: ProductListTableFilters) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkDisable: (ids: string[]) => void;
  onBulkEnable: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  isBulkPending: boolean;
  onUpdateProduct?: (id: string, values: { price?: number; promotionalPrice?: number; costPrice?: number }) => Promise<void>;
  onUpdateStock?: (itemId: string, type: 'ADD' | 'SUBTRACT', quantity: number) => Promise<void>;
  onDuplicateProduct?: (id: string) => Promise<void>;
}

export function ProductListTable({
  products,
  categories,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  filters,
  onFiltersChange,
  selectedIds,
  onSelectionChange,
  onBulkDisable,
  onBulkEnable,
  onBulkDelete,
  isBulkPending,
  onUpdateProduct,
  onUpdateStock,
  onDuplicateProduct,
}: ProductListTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const navigate = useNavigate();
  const loaderRef = useRef<HTMLDivElement>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      if (onDuplicateProduct) {
        await onDuplicateProduct(id);
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.title ?? "Sem categoria";
  };

  // Client-side sort on current page
  const sorted = [...products].sort((a, b) => {
    if (!sortField) return 0;
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortField === "title") return mul * a.title.localeCompare(b.title);
    if (sortField === "price") return mul * ((a.price ?? 0) - (b.price ?? 0));
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map((p) => p.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({ search: "", status: "active", categoryId: "" });
  };

  const handleSearchClick = () => {
    onFiltersChange({ ...filters, search: searchValue });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const hasFilters = filters.search || filters.status !== "active" || filters.categoryId;

  const totalDisplayed = products.length;

  return (
    <div className="space-y-4">
      {/* Bulk action bar (Fixed Floating Toolbar) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-900/95 text-white backdrop-blur-md shadow-2xl p-3.5 sm:px-6 sm:py-3.5 w-[92%] sm:w-auto min-w-[320px] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <span className="text-sm font-bold text-white whitespace-nowrap">
              {selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border-slate-700 px-2.5 rounded-lg"
              onClick={() => onSelectionChange([])}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Desmarcar
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial gap-1.5 px-3 font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border-slate-700 hover:text-white"
              onClick={() => onBulkEnable(selectedIds)}
              disabled={isBulkPending}
            >
              <Eye className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Ativar</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial gap-1.5 px-3 font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border-slate-700 hover:text-white"
              onClick={() => onBulkDisable(selectedIds)}
              disabled={isBulkPending}
            >
              <EyeOff className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Desativar</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 sm:flex-initial gap-1.5 px-3 font-bold bg-rose-600 hover:bg-rose-500 text-white"
              onClick={() => setIsConfirmDeleteOpen(true)}
              disabled={isBulkPending}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>Excluir</span>
            </Button>
          </div>
        </div>
      )}
      {/* Dialog Modal de Confirmação para Exclusão em Massa */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão de Produtos
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Tem certeza que deseja excluir <strong>{selectedIds.length}</strong> produto{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}? Esta ação é irreversível e removerá permanentemente os itens do catálogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={isBulkPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onBulkDelete(selectedIds);
                setIsConfirmDeleteOpen(false);
              }}
              disabled={isBulkPending}
              className="gap-2 font-bold"
            >
              {isBulkPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Excluindo...
                </>
              ) : (
                "Sim, Excluir Produtos"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-center w-full">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            id="product-search"
            placeholder="Buscar produtos..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full md:w-56"
          />
          <Button variant="secondary" onClick={handleSearchClick}>
            Buscar
          </Button>
        </div>

        <Select
          value={filters.status}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, status: v as ProductListTableFilters["status"] })
          }
        >
          <SelectTrigger id="product-status-filter" className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="critical">🔴 Crítico (Prestes a acabar)</SelectItem>
            <SelectItem value="low_stock">🟠 Abaixo do mínimo</SelectItem>
            <SelectItem value="stagnant">📦 Sem giro (+45 dias)</SelectItem>
            <SelectItem value="out_of_stock">⛔ Zerados / Sem estoque</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId || "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, categoryId: v === "all" ? "" : v })
          }
        >
          <SelectTrigger id="product-category-filter" className="w-full md:w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full md:w-auto">
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Mobile Grid View */}
      <div className="grid md:hidden gap-3 mb-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">Carregando produtos...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">Nenhum produto encontrado.</div>
        ) : (
          sorted.map((product) => (
            <div key={product.id} className="border rounded-md p-4 flex flex-col gap-3 relative bg-card shadow-sm cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/produtos/${product.id}`)}>
              <div className="absolute top-2 right-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  id={`select-mobile-${product.id}`}
                  checked={selectedIds.includes(product.id)}
                  onCheckedChange={() => toggleOne(product.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  disabled={duplicatingId !== null}
                  onClick={(e) => { e.stopPropagation(); void handleDuplicate(product.id); }}
                >
                  {duplicatingId === product.id ? (
                    <span className="h-4 w-4 animate-spin rounded-full border border-primary border-t-transparent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-3">
                {product.images[0] ? (
                  <img src={buildImageUrl(product.images[0].url)} alt={product.title} className={`h-16 w-16 aspect-square rounded-md object-cover border min-w-16 min-h-16 block ${product.status !== 'active' ? 'opacity-50' : ''}`} />
                ) : (
                  <div className="h-16 w-16 aspect-square rounded-md bg-muted border flex items-center justify-center text-muted-foreground text-xs min-w-16 min-h-16">—</div>
                )}
                <div className="flex flex-col flex-1 min-w-0 pr-16">
                  <span className="font-bold text-foreground text-sm leading-tight">{product.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{getCategoryName(product.categoryId)}</span>
                  <div className="mt-1 flex items-center gap-2">
                    {product.status === "active" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 py-0 text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="py-0 text-[10px]">Inativo</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2 bg-muted/30 p-2 rounded-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold">Preço Venda</span>
                  <InlinePriceInput value={product.price} onSave={async (newPrice) => { if (onUpdateProduct) await onUpdateProduct(product.id, { price: newPrice }); }} />
                  {product.promotionalPrice !== undefined && product.promotionalPrice > 0 && (
                    <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2 mt-0.5">
                      <span className="shrink-0 mr-1">Promo:</span>
                      <InlinePriceInput
                        value={product.promotionalPrice}
                        onSave={async (newPromo) => { if (onUpdateProduct) await onUpdateProduct(product.id, { promotionalPrice: newPromo }); }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold">Preço Custo</span>
                  <InlinePriceInput value={product.costPrice} onSave={async (newCost) => { if (onUpdateProduct) await onUpdateProduct(product.id, { costPrice: newCost }); }} />
                </div>
              </div>
              
              <div className="flex flex-col mt-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] text-muted-foreground font-semibold mb-1">Estoque</span>
                {product.variations.length === 0 ? (
                  product.items?.[0] && onUpdateStock ? (
                    <div className="w-fit">
                    <InlineStockEditor stock={product.items[0].stock} onAdd={() => onUpdateStock(product.items![0].id, 'ADD', 1)} onSub={() => onUpdateStock(product.items![0].id, 'SUBTRACT', 1)} />
                    </div>
                  ) : (
                    <span className="font-semibold text-foreground text-sm">{product.totalStock}</span>
                  )
                ) : (
                  <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    {product.items?.map((item) => {
                       const optionLabel = item.options.map((o) => o.optionValue).join("/");
                       return (
                         <div key={item.id} className="flex items-center gap-2 justify-between border-b border-muted pb-1 last:border-0 last:pb-0">
                           <span className="whitespace-nowrap truncate">{optionLabel}</span>
                           {onUpdateStock ? (
                             <InlineStockEditor stock={item.stock} onAdd={() => onUpdateStock(item.id, 'ADD', 1)} onSub={() => onUpdateStock(item.id, 'SUBTRACT', 1)} />
                           ) : (
                             <span className="font-semibold text-foreground">{item.stock}</span>
                           )}
                         </div>
                       );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  id="select-all"
                  className="rounded-none !rounded-none"
                  style={{ borderRadius: "0px" }}
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                  onCheckedChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort("title")}
                >
                  Nome <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort("price")}
                >
                  Preço <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Categoria</TableHead>

              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Carregando produtos...
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>

            ) : (
              sorted.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer hover:bg-muted/50"
                  data-state={selectedIds.includes(product.id) ? "selected" : undefined}
                  onClick={() => navigate(`/produtos/${product.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={`select-${product.id}`}
                      className="rounded-none !rounded-none"
                      style={{ borderRadius: "0px" }}
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleOne(product.id)}
                      aria-label={`Selecionar ${product.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    {product.images[0] ? (
                      <img
                        src={buildImageUrl(product.images[0].url)}
                        alt={product.title}
                        className={`h-16 w-16 aspect-square rounded-none object-cover border min-w-16 min-h-16 block ${product.status !== 'active' ? 'opacity-50' : ''}`}
                      />
                    ) : (
                      <div className="h-16 w-16 aspect-square rounded-none bg-muted border flex items-center justify-center text-muted-foreground text-xs min-w-16 min-h-16">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium hover:underline">
                      {product.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <InlinePriceInput
                        value={product.price}
                        onSave={async (newPrice) => {
                          if (onUpdateProduct) {
                            await onUpdateProduct(product.id, { price: newPrice });
                          }
                        }}
                      />
                      {product.promotionalPrice !== undefined && product.promotionalPrice > 0 && (
                        <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2">
                          <span className="shrink-0 mr-1">Promo:</span>
                          <InlinePriceInput
                            value={product.promotionalPrice}
                            onSave={async (newPromo) => {
                              if (onUpdateProduct) {
                                await onUpdateProduct(product.id, { promotionalPrice: newPromo });
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlinePriceInput
                      value={product.costPrice}
                      onSave={async (newCost) => {
                        if (onUpdateProduct) {
                          await onUpdateProduct(product.id, { costPrice: newCost });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getCategoryName(product.categoryId)}
                  </TableCell>

                  <TableCell>
                    {product.variations.length === 0 ? (
                      product.items?.[0] && onUpdateStock ? (
                        <InlineStockEditor 
                          stock={product.items[0].stock}
                          onAdd={() => onUpdateStock(product.items![0].id, 'ADD', 1)}
                          onSub={() => onUpdateStock(product.items![0].id, 'SUBTRACT', 1)}
                        />
                      ) : (
                        <span className="font-semibold text-foreground">{product.totalStock}</span>
                      )
                    ) : (
                      <div className="space-y-1">                        
                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground max-w-[220px]">
                          {product.items?.map((item) => {
                             const optionLabel = item.options.map((o) => o.optionValue).join("/");
                             return (
                               <div key={item.id} className="flex items-center gap-2 justify-between w-full">
                                 <span className="whitespace-nowrap truncate" title={optionLabel}>{optionLabel}</span>
                                 {onUpdateStock ? (
                                   <InlineStockEditor 
                                     stock={item.stock}
                                     onAdd={() => onUpdateStock(item.id, 'ADD', 1)}
                                     onSub={() => onUpdateStock(item.id, 'SUBTRACT', 1)}
                                   />
                                 ) : (
                                   <span className="font-semibold text-foreground">{item.stock}</span>
                                 )}
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.status === "active" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={duplicatingId !== null}
                      onClick={() => void handleDuplicate(product.id)}
                      title="Duplicar Produto"
                    >
                      {duplicatingId === product.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border border-primary border-t-transparent" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}

          </TableBody>
        </Table>
      </div>

      {/* Footer: count + infinite scroll */}
      <div className="flex flex-col items-center justify-center text-sm text-muted-foreground mt-4 gap-4 pb-4">
        <span className="w-full text-left">
          {products.length > 0
            ? `Mostrando ${totalDisplayed} produtos`
            : "Nenhum resultado"}
        </span>

        {hasNextPage && (
          <div ref={loaderRef} className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
