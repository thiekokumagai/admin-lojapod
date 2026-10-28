import { useMemo, useState } from "react";
import {
  CheckSquare,
  Filter,
  Plus,
  Search,
  Square,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Variation } from "@/types/variation";

type FilterStatus = "all" | "selected" | "unselected";

type ProductVariationSelectorProps = {
  variations: Variation[];
  selectedVariationIds: string[];
  selectedOptionsByVariation: Record<string, string[]>;
  onChangeVariation: (slot: number, variationId: string) => void;
  onAddSlot: () => void;
  onRemoveSlot: (slot: number) => void;
  onToggleOption: (variationId: string, optionId: string, checked: boolean) => void;
  onToggleAllOptions: (variationId: string, checked: boolean) => void;
  onRemoveVariation: (variationId: string) => void;
  onRemoveVariationOption: (variationId: string, optionId: string) => void;
  disabled: boolean;
};

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSelectedVariation(variations: Variation[], variationId?: string) {
  return variations.find((variation) => variation.id === variationId) ?? null;
}

interface VariationSlotProps {
  slotIndex: number;
  totalSlots: number;
  variations: Variation[];
  selectedVariationIds: string[];
  selectedOptionsByVariation: Record<string, string[]>;
  onChangeVariation: (slot: number, variationId: string) => void;
  onAddSlot: () => void;
  onRemoveSlot: (slot: number) => void;
  onToggleOption: (variationId: string, optionId: string, checked: boolean) => void;
  onToggleAllOptions: (variationId: string, checked: boolean) => void;
  onRemoveVariation: (variationId: string) => void;
  onRemoveVariationOption: (variationId: string, optionId: string) => void;
  disabled: boolean;
}

function VariationSlot({
  slotIndex,
  totalSlots,
  variations,
  selectedVariationIds,
  selectedOptionsByVariation,
  onChangeVariation,
  onAddSlot,
  onRemoveSlot,
  onToggleOption,
  onToggleAllOptions,
  onRemoveVariation,
  onRemoveVariationOption,
  disabled,
}: VariationSlotProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const selectedVariationId = selectedVariationIds[slotIndex] ?? "";
  const selectedVariation = getSelectedVariation(variations, selectedVariationId);
  const selectedOptionIds = selectedVariation
    ? selectedOptionsByVariation[selectedVariation.id] ?? []
    : [];

  const totalOptions = selectedVariation?.options.length ?? 0;
  const selectedCount = selectedOptionIds.length;
  const unselectedCount = Math.max(0, totalOptions - selectedCount);
  const allChecked = totalOptions > 0 && selectedCount === totalOptions;
  const canRemove = totalSlots > 1;

  // Filtragem com busca e status
  const filteredOptions = useMemo(() => {
    if (!selectedVariation) return [];

    const query = normalizeText(searchQuery);

    return selectedVariation.options.filter((option) => {
      const isSelected = selectedOptionIds.includes(option.id);

      if (filterStatus === "selected" && !isSelected) return false;
      if (filterStatus === "unselected" && isSelected) return false;

      if (query) {
        const matches = normalizeText(option.value).includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [selectedVariation, searchQuery, filterStatus, selectedOptionIds]);

  const isFilteringActive = searchQuery.trim().length > 0 || filterStatus !== "all";

  // Se todos os visíveis estão marcados
  const allFilteredChecked =
    filteredOptions.length > 0 &&
    filteredOptions.every((opt) => selectedOptionIds.includes(opt.id));

  const handleToggleFiltered = () => {
    if (!selectedVariation || disabled) return;

    if (!isFilteringActive) {
      onToggleAllOptions(selectedVariation.id, !allChecked);
      return;
    }

    const targetChecked = !allFilteredChecked;
    filteredOptions.forEach((option) => {
      const isSelected = selectedOptionIds.includes(option.id);
      if (isSelected !== targetChecked) {
        onToggleOption(selectedVariation.id, option.id, targetChecked);
      }
    });
  };

  return (
    <div className="space-y-5 rounded-3xl border bg-card p-5 shadow-xs">
      {/* Header do Slot */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">Variação vinculada</Label>
            {selectedVariation && (
              <Badge variant="secondary" className="font-medium text-xs">
                {selectedCount} de {totalOptions} selecionadas
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Se a variação e as opções já estiverem salvas no banco, elas aparecem marcadas aqui.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedVariation ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveVariation(selectedVariation.id)}
              disabled={disabled}
              className="text-destructive hover:bg-destructive/10"
              title="Excluir variação salva"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          ) : null}

          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveSlot(slotIndex)}
              disabled={disabled}
              className="text-destructive hover:bg-destructive/10"
              title="Remover linha"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Seletor da Variação */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={selectedVariationId}
          onValueChange={(value) => {
            setSearchQuery("");
            setFilterStatus("all");
            onChangeVariation(slotIndex, value);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-12 rounded-2xl bg-background">
            <SelectValue placeholder="Selecione a variação" />
          </SelectTrigger>
          <SelectContent>
            {variations.map((variation) => {
              const alreadySelected =
                selectedVariationIds.includes(variation.id) &&
                selectedVariationId !== variation.id;
              return (
                <SelectItem
                  key={variation.id}
                  value={variation.id}
                  disabled={alreadySelected}
                >
                  {variation.title} ({variation.options.length} opções)
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {slotIndex === totalSlots - 1 ? (
          <Button
            type="button"
            className="h-12 rounded-2xl sm:w-12 sm:px-0 shrink-0"
            variant="default"
            onClick={onAddSlot}
            disabled={
              disabled ||
              selectedVariationIds.filter(Boolean).length >= variations.length
            }
            title="Adicionar outra variação"
          >
            <Plus className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      {/* Conteúdo das Opções da Variação Selecionada */}
      {selectedVariation ? (
        <div className="space-y-4 pt-2">
          {/* Barra de Busca e Filtros Rápidos */}
          <div className="flex flex-col gap-3 rounded-2xl bg-muted/30 p-3.5 border">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Campo de Busca Rápida */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar ${selectedVariation.title.toLowerCase()}... (ex: Morango, Ice, Menta)`}
                  className="h-10 pl-9 pr-9 rounded-xl bg-background border-border/80 text-sm focus-visible:ring-primary"
                  disabled={disabled}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Botão Marcar/Desmarcar */}
              <div className="flex items-center justify-end shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl gap-2 font-medium text-xs sm:text-sm bg-background hover:bg-muted"
                  onClick={handleToggleFiltered}
                  disabled={disabled || filteredOptions.length === 0}
                >
                  {(isFilteringActive ? allFilteredChecked : allChecked) ? (
                    <>
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <span>{isFilteringActive ? "Desmarcar visíveis" : "Desmarcar todos"}</span>
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <span>{isFilteringActive ? "Marcar visíveis" : "Marcar todos"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Filtros por Status (Chips) */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium mr-1">
                <Filter className="h-3 w-3" /> Filtrar:
              </span>

              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5",
                  filterStatus === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Todos
                <span className={cn(
                  "text-[11px] px-1.5 py-0.2 rounded-full",
                  filterStatus === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {totalOptions}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus("selected")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5",
                  filterStatus === "selected"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Selecionados
                <span className={cn(
                  "text-[11px] px-1.5 py-0.2 rounded-full",
                  filterStatus === "selected" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {selectedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus("unselected")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5",
                  filterStatus === "unselected"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Não selecionados
                <span className={cn(
                  "text-[11px] px-1.5 py-0.2 rounded-full",
                  filterStatus === "unselected" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {unselectedCount}
                </span>
              </button>

              {(searchQuery || filterStatus !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors underline-offset-4 hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Grid de Opções com scroll */}
          {filteredOptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 px-4 text-center bg-muted/10">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">
                Nenhuma opção encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {searchQuery
                  ? `Nenhum resultado para "${searchQuery}". Verifique a ortografia ou limpe os filtros.`
                  : "Nenhuma opção corresponde ao filtro selecionado."}
              </p>
              {(searchQuery || filterStatus !== "all") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-xl h-8 text-xs"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {filteredOptions.map((option) => {
                  const checked = selectedOptionIds.includes(option.id);

                  return (
                    <div
                      key={option.id}
                      onClick={() => {
                        if (!disabled) {
                          onToggleOption(selectedVariation.id, option.id, !checked);
                        }
                      }}
                      className={cn(
                        "group relative flex items-center justify-between gap-2.5 rounded-2xl border p-3 transition-all cursor-pointer select-none",
                        checked
                          ? "border-primary/50 bg-primary/5 shadow-xs ring-1 ring-primary/20"
                          : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => {
                            onToggleOption(selectedVariation.id, option.id, !!val);
                          }}
                          disabled={disabled}
                          className="pointer-events-none rounded-md"
                        />
                        <span
                          className={cn(
                            "text-sm leading-tight truncate transition-colors",
                            checked ? "font-semibold text-primary" : "text-foreground"
                          )}
                          title={option.value}
                        >
                          {option.value}
                        </span>
                      </div>

                      {checked ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveVariationOption(selectedVariation.id, option.id);
                          }}
                          disabled={disabled}
                          title="Excluir opção salva"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rodapé informativo de contagem */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
            <span>
              Exibindo <strong className="text-foreground">{filteredOptions.length}</strong> de{" "}
              <strong className="text-foreground">{totalOptions}</strong> opções
            </span>
            <span>
              <strong className="text-primary">{selectedCount}</strong> selecionadas para este produto
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground bg-muted/10">
          Selecione uma variação acima para ver e marcar as opções disponíveis.
        </div>
      )}
    </div>
  );
}

export function ProductVariationSelector({
  variations,
  selectedVariationIds,
  selectedOptionsByVariation,
  onChangeVariation,
  onAddSlot,
  onRemoveSlot,
  onToggleOption,
  onToggleAllOptions,
  onRemoveVariation,
  onRemoveVariationOption,
  disabled,
}: ProductVariationSelectorProps) {
  const slots = Math.max(selectedVariationIds.length, 1);

  return (
    <div className="space-y-6">
      {variations.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground text-center">
          Nenhuma variação cadastrada ainda.
        </div>
      ) : (
        Array.from({ length: slots }).map((_, index) => (
          <VariationSlot
            key={`variation-slot-${index}`}
            slotIndex={index}
            totalSlots={slots}
            variations={variations}
            selectedVariationIds={selectedVariationIds}
            selectedOptionsByVariation={selectedOptionsByVariation}
            onChangeVariation={onChangeVariation}
            onAddSlot={onAddSlot}
            onRemoveSlot={onRemoveSlot}
            onToggleOption={onToggleOption}
            onToggleAllOptions={onToggleAllOptions}
            onRemoveVariation={onRemoveVariation}
            onRemoveVariationOption={onRemoveVariationOption}
            disabled={disabled}
          />
        ))
      )}
    </div>
  );
}