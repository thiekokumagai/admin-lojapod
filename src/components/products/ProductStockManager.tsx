import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductItem } from "@/types/product";
import type { Variation } from "@/types/variation";

export type DraftSku = {
  id: string;
  stock: number;
  hash: string;
  optionIds: string[];
  labels: string[];
};

type ProductStockManagerProps = {
  selectedVariations: Variation[];
  selectedOptionIds: string[];
  stockInput: string;
  draftItems: DraftSku[];
  savedItems: ProductItem[];
  loadingSavedItems: boolean;
  productReady: boolean;
  onToggleOption: (variationId: string, optionId: string, checked: boolean) => void;
  onStockInputChange: (value: string) => void;
  onAddDraftItem: () => void;
  onRemoveDraftItem: (draftId: string) => void;
  onRemoveSavedItem: (itemId: string) => void;
  onSaveAllItems: () => void;
  isSaving: boolean;
};

export function ProductStockManager({
  selectedVariations,
  selectedOptionIds,
  stockInput,
  draftItems,
  savedItems,
  loadingSavedItems,
  productReady,
  onToggleOption,
  onStockInputChange,
  onAddDraftItem,
  onRemoveDraftItem,
  onRemoveSavedItem,
  onSaveAllItems,
  isSaving,
}: ProductStockManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Estoque (SKU)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {!productReady ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Crie ou carregue um produto para montar o estoque.
          </div>
        ) : selectedVariations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Selecione ao menos uma variação para criar combinações.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
              <div className="space-y-4">
                {selectedVariations.map((variation) => (
                  <div key={variation.id} className="rounded-xl border p-4">
                    <p className="mb-3 font-medium">{variation.title}</p>
                    <div className="flex flex-wrap gap-2">
                      {variation.options.map((option) => {
                        const checked = selectedOptionIds.includes(option.id);

                        return (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => onToggleOption(variation.id, option.id, !!value)}
                            />
                            <span>{option.value}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  min="0"
                  value={stockInput}
                  onChange={(e) => onStockInputChange(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Selecione exatamente uma opção por variação para criar o SKU.
                </p>
              </div>

              <div className="flex items-end">
                <Button className="w-full lg:w-auto" onClick={onAddDraftItem}>
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Combinações prontas para salvar</h3>
                  <span className="text-sm text-muted-foreground">{draftItems.length} itens</span>
                </div>

                {draftItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    Nenhuma combinação adicionada ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draftItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border p-4">
                        <div className="min-w-0">
                          <p className="font-medium">{item.labels.join(" / ")}</p>
                          <p className="text-sm text-muted-foreground">Estoque: {item.stock}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => onRemoveDraftItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Itens já salvos</h3>
                  <span className="text-sm text-muted-foreground">
                    {loadingSavedItems ? "Carregando..." : `${savedItems.length} itens`}
                  </span>
                </div>

                {loadingSavedItems ? (
                  <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    Carregando itens...
                  </div>
                ) : savedItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    Ainda não existem itens salvos para este produto.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border p-4">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {item.options.map((option) => option.optionValue).join(" / ")}
                          </p>
                          <p className="text-sm text-muted-foreground">Estoque: {item.stock}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => onRemoveSavedItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onSaveAllItems} disabled={draftItems.length === 0 || isSaving}>
                Salvar estoque
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
