import { CheckCircle2, CheckSquare, Plus, Square, Trash2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Variation } from "@/types/variation";

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

function getSelectedVariation(variations: Variation[], variationId?: string) {
  return variations.find((variation) => variation.id === variationId) ?? null;
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
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Nenhuma variação cadastrada ainda.
        </div>
      ) : (
        <>
          {Array.from({ length: slots }).map((_, index) => {
            const selectedVariationId = selectedVariationIds[index] ?? "";
            const selectedVariation = getSelectedVariation(variations, selectedVariationId);
            const selectedOptionIds = selectedVariation ? selectedOptionsByVariation[selectedVariation.id] ?? [] : [];
            const allChecked = !!selectedVariation && selectedVariation.options.length > 0 && selectedOptionIds.length === selectedVariation.options.length;
            const canRemove = slots > 1;

            return (
              <div key={`variation-slot-${index}`} className="space-y-4 rounded-3xl border bg-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Variação vinculada</Label>
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
                        className="text-destructive"
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
                        onClick={() => onRemoveSlot(index)}
                        disabled={disabled}
                        className="text-destructive"
                        title="Remover linha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={selectedVariationId}
                    onValueChange={(value) => onChangeVariation(index, value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-background">
                      <SelectValue placeholder="Selecione a variação" />
                    </SelectTrigger>
                    <SelectContent>
                      {variations.map((variation) => {
                        const alreadySelected = selectedVariationIds.includes(variation.id) && selectedVariationId !== variation.id;
                        return (
                          <SelectItem key={variation.id} value={variation.id} disabled={alreadySelected}>
                            {variation.title}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {index === slots - 1 ? (
                    <Button
                      type="button"
                      className="h-12 rounded-2xl sm:w-12 sm:px-0"
                      variant="default"
                      onClick={onAddSlot}
                      disabled={disabled || selectedVariationIds.filter(Boolean).length >= variations.length}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  ) : null}
                </div>

                {selectedVariation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{selectedVariation.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Opções vinculadas e selecionadas para este produto.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium text-foreground"
                        onClick={() => onToggleAllOptions(selectedVariation.id, !allChecked)}
                        disabled={disabled}
                      >
                        {allChecked ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        Marcar todos
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedVariation.options.map((option) => {
                        const checked = selectedOptionIds.includes(option.id);

                        return (
                          <div key={option.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                            <label className="flex items-center gap-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => onToggleOption(selectedVariation.id, option.id, !!value)}
                                disabled={disabled}
                              />
                              <div className="flex items-center gap-2">
                                {checked ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                                <span>{option.value}</span>
                              </div>
                            </label>

                            {checked ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => onRemoveVariationOption(selectedVariation.id, option.id)}
                                disabled={disabled}
                                title="Excluir opção salva"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                    Selecione uma variação para ver e marcar as opções.
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}