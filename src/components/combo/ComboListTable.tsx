import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  ArrowUpDown,
  Trash2,
  EyeOff,
  Eye,
  X,
  Copy,
  Boxes,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { Combo } from "@/services/combo.service";
import { buildImageUrl } from "@/utils/image-url";
import { formatCurrency } from "@/utils/formatters";

type SortField = "name" | "price" | null;
type SortDir = "asc" | "desc";

export interface ComboListTableFilters {
  search: string;
  status: "all" | "active" | "inactive" | "out_of_stock";
  categoryId: string;
}

interface Category {
  id: string;
  title: string;
}

interface ComboListTableProps {
  combos: Combo[];
  categories: Category[];
  isLoading: boolean;
  filters: ComboListTableFilters;
  onFiltersChange: (filters: ComboListTableFilters) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkDisable: (ids: string[]) => void;
  onBulkEnable: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  isBulkPending: boolean;
  onDuplicateCombo?: (combo: Combo) => Promise<void>;
  onUpdateComboPrice?: (id: string, price: number) => Promise<void>;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-muted-foreground font-semibold">R$</span>
        <Input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) {
              setInputValue("");
            } else {
              setInputValue(
                new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                  Number(digits) / 100
                )
              );
            }
          }}
          onBlur={() => void handleSave()}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="h-7 w-20 px-1.5 py-0 text-xs font-semibold"
        />
        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className="cursor-pointer group flex items-center gap-1 hover:bg-muted/60 p-1 -ml-1 rounded transition-colors"
      title="Clique para editar o preço"
    >
      <span className="font-semibold text-sm">
        {value !== undefined ? formatCurrency(value) : "—"}
      </span>
      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground underline">
        editar
      </span>
    </div>
  );
}

export function ComboListTable({
  combos,
  categories,
  isLoading,
  filters,
  onFiltersChange,
  selectedIds,
  onSelectionChange,
  onBulkDisable,
  onBulkEnable,
  onBulkDelete,
  isBulkPending,
  onDuplicateCombo,
  onUpdateComboPrice,
}: ComboListTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const navigate = useNavigate();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortField(null);
        setSortDir("asc");
      }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...combos].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === "name") {
      const cmp = a.name.localeCompare(b.name, "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    }
    if (sortField === "price") {
      const cmp = Number(a.price) - Number(b.price);
      return sortDir === "asc" ? cmp : -cmp;
    }
    return 0;
  });

  const allSelected = sorted.length > 0 && selectedIds.length === sorted.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sorted.map((c) => c.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleDuplicate = async (combo: Combo) => {
    if (!onDuplicateCombo || duplicatingId !== null) return;
    setDuplicatingId(combo.id);
    try {
      await onDuplicateCombo(combo);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onFiltersChange({ ...filters, search: searchValue });
    }
  };

  const handleSearchClick = () => {
    onFiltersChange({ ...filters, search: searchValue });
  };

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({ search: "", status: "all", categoryId: "" });
  };

  const hasFilters =
    Boolean(filters.search) ||
    filters.status !== "all" ||
    Boolean(filters.categoryId);

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return "Sem categoria";
    const found = categories.find((c) => c.id === catId);
    return found ? found.title : "Sem categoria";
  };

  return (
    <div className="space-y-4">
      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-200 border border-slate-700 max-w-[95vw]">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
            <span className="font-extrabold text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full text-xs">
              {selectedIds.length}
            </span>
            <span className="text-sm font-medium text-slate-200">
              {selectedIds.length === 1 ? "combo selecionado" : "combos selecionados"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 sm:flex-initial gap-1.5 px-3 font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              onClick={() => onBulkEnable(selectedIds)}
              disabled={isBulkPending}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span>Ativar</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 sm:flex-initial gap-1.5 px-3 font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              onClick={() => onBulkDisable(selectedIds)}
              disabled={isBulkPending}
            >
              <EyeOff className="h-3.5 w-3.5 shrink-0" />
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

      {/* Dialog de Confirmação para Exclusão em Massa */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão de Combos
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Tem certeza que deseja excluir <strong>{selectedIds.length}</strong> combo{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}? Esta ação é irreversível.
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
                "Sim, Excluir Combos"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filtros Padronizados */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-center w-full">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            id="combo-search"
            placeholder="Buscar combos..."
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
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as ComboListTableFilters["status"] })
          }
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="out_of_stock">Esgotado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId || "all"}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, categoryId: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="w-full md:w-48">
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

      {/* Mobile Card View */}
      <div className="grid md:hidden gap-3 mb-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">Carregando combos...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">Nenhum combo encontrado.</div>
        ) : (
          sorted.map((combo) => (
            <div
              key={combo.id}
              className={`border rounded-md p-4 flex flex-col gap-3 relative bg-card shadow-sm cursor-pointer hover:bg-muted/50 ${
                !combo.isActive ? "text-muted-foreground" : ""
              }`}
              onClick={() => navigate(`/combos/${combo.id}`)}
            >
              <div className="absolute top-2 right-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  id={`select-mobile-${combo.id}`}
                  checked={selectedIds.includes(combo.id)}
                  onCheckedChange={() => toggleOne(combo.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  disabled={duplicatingId !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDuplicate(combo);
                  }}
                >
                  {duplicatingId === combo.id ? (
                    <span className="h-4 w-4 animate-spin rounded-full border border-primary border-t-transparent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-3">
                {combo.imageUrl ? (
                  <img
                    src={buildImageUrl(combo.imageUrl)}
                    alt={combo.name}
                    className={`h-16 w-16 aspect-square rounded-md object-cover border min-w-16 min-h-16 block ${
                      !combo.isActive ? "opacity-50" : ""
                    }`}
                  />
                ) : (
                  <div className="h-16 w-16 aspect-square rounded-md bg-muted border flex items-center justify-center text-muted-foreground text-xs min-w-16 min-h-16">
                    <Boxes className="w-6 h-6" />
                  </div>
                )}
                <div className="flex flex-col flex-1 min-w-0 pr-16">
                  <span className={`font-bold text-sm leading-tight ${!combo.isActive ? "text-muted-foreground" : "text-foreground"}`}>
                    {combo.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{getCategoryName(combo.categoryId)}</span>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {combo.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 py-0 text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="py-0 text-[10px]">Inativo</Badge>
                    )}
                    {combo.discountPercentage > 0 && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 py-0 text-[10px] font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        {combo.discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 bg-muted/30 p-2 rounded-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold">Itens</span>
                  <span className="text-xs font-semibold">{combo.items?.length || 0} produto(s)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold">Preço Combo</span>
                  {onUpdateComboPrice ? (
                    <InlinePriceInput
                      value={Number(combo.price)}
                      onSave={async (newPrice) => {
                        await onUpdateComboPrice(combo.id, newPrice);
                      }}
                    />
                  ) : (
                    <span className="text-xs font-semibold">{formatCurrency(Number(combo.price))}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold">Estoque</span>
                  <span className={`text-xs font-semibold ${(combo.stock ?? 0) <= 0 ? "text-rose-600 font-bold" : ""}`}>
                    {(combo.stock ?? 0) > 0 ? `${combo.stock} un.` : "Esgotado"}
                  </span>
                </div>
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
                  id="select-all-combos"
                  className="rounded-none !rounded-none"
                  style={{ borderRadius: "0px" }}
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                  onCheckedChange={toggleAll}
                  aria-label="Selecionar todos os combos"
                />
              </TableHead>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort("name")}
                >
                  Nome do Combo <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Produtos Inclusos</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort("price")}
                >
                  Preço do Combo <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Estoque Calculado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  Carregando combos...
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  Nenhum combo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((combo) => {
                const hasStock = (combo.stock ?? 0) > 0;
                return (
                  <TableRow
                    key={combo.id}
                    className={`cursor-pointer hover:bg-muted/50 ${!combo.isActive ? "text-muted-foreground" : ""}`}
                    data-state={selectedIds.includes(combo.id) ? "selected" : undefined}
                    onClick={() => navigate(`/combos/${combo.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={`select-combo-${combo.id}`}
                        className="rounded-none !rounded-none"
                        style={{ borderRadius: "0px" }}
                        checked={selectedIds.includes(combo.id)}
                        onCheckedChange={() => toggleOne(combo.id)}
                        aria-label={`Selecionar ${combo.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {combo.imageUrl ? (
                        <img
                          src={buildImageUrl(combo.imageUrl)}
                          alt={combo.name}
                          className={`h-16 w-16 aspect-square rounded-none object-cover border min-w-16 min-h-16 block ${
                            !combo.isActive ? "opacity-50" : ""
                          }`}
                        />
                      ) : (
                        <div className="h-16 w-16 aspect-square rounded-none bg-muted border flex items-center justify-center text-muted-foreground text-xs min-w-16 min-h-16">
                          <Boxes className="w-6 h-6" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-medium hover:underline ${!combo.isActive ? "text-muted-foreground" : ""}`}>
                          {combo.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground max-w-[240px]">
                        {(combo.items || []).slice(0, 3).map((it, idx) => (
                          <span key={idx} className="truncate">
                            {it.quantity}x {it.productName}
                            {it.variation ? ` (${it.variation})` : ""}
                          </span>
                        ))}
                        {(combo.items?.length || 0) > 3 && (
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            + {(combo.items?.length || 0) - 3} outro(s)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {onUpdateComboPrice ? (
                          <InlinePriceInput
                            value={Number(combo.price)}
                            onSave={async (newPrice) => {
                              await onUpdateComboPrice(combo.id, newPrice);
                            }}
                          />
                        ) : (
                          <span className="font-semibold text-sm">{formatCurrency(Number(combo.price))}</span>
                        )}
                        {combo.originalPrice > Number(combo.price) && (
                          <span className="text-[11px] text-muted-foreground line-through">
                            De: {formatCurrency(combo.originalPrice)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {combo.discountPercentage > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-xs"
                        >
                          {combo.discountPercentage}% OFF
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getCategoryName(combo.categoryId)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${!hasStock ? "text-rose-600 font-bold" : ""}`}>
                        {hasStock ? `${combo.stock} un.` : "Esgotado"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {combo.isActive ? (
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
                        onClick={() => void handleDuplicate(combo)}
                        title="Duplicar Combo"
                      >
                        {duplicatingId === combo.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border border-primary border-t-transparent" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer com contagem */}
      <div className="flex flex-col items-center justify-center text-sm text-muted-foreground mt-4 gap-4 pb-4">
        <span className="w-full text-left">
          {combos.length > 0 ? `Mostrando ${combos.length} combo(s)` : "Nenhum resultado"}
        </span>
      </div>
    </div>
  );
}
