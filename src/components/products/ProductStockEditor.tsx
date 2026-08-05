import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductStockHistoryDrawer } from "./ProductStockHistoryDrawer";
import type { ProductItem } from "@/types/product";

export type QuickEditMode = "add" | "subtract" | "replace";

type ProductStockEditorProps = {
  productId?: string;
  productReady: boolean;
  hasVariations: boolean;
  loadingSavedItems: boolean;
  savedItems: ProductItem[];
  directStockValue: string;
  bulkMode: QuickEditMode;
  bulkValues: Record<string, string>;
  observation: string;
  isSaving: boolean;
  onModeChange: (mode: QuickEditMode) => void;
  onDirectStockChange: (value: string) => void;
  onValueChange: (itemId: string, value: string) => void;
  onObservationChange: (value: string) => void;
  onSaveAll: () => void;
};

function getNextStock(currentStock: number, value: number, mode: QuickEditMode) {
  if (mode === "add") return currentStock + value;
  if (mode === "subtract") return Math.max(0, currentStock - value);
  return value;
}

function renderSavedItemLabel(item: ProductItem) {
  return item.options.map((option) => option.optionValue).join(" / ");
}

export function ProductStockEditor({
  productId,
  productReady,
  hasVariations,
  loadingSavedItems,
  savedItems,
  directStockValue,
  bulkMode,
  bulkValues,
  observation,
  onModeChange,
  onDirectStockChange,
  onValueChange,
  onObservationChange,
}: ProductStockEditorProps) {
  const directSavedItem = savedItems[0];

  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Estoque</CardTitle>
          {productId && <ProductStockHistoryDrawer productId={productId} />}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={bulkMode === "add" ? "default" : "outline"}
            onClick={() => onModeChange("add")}
            className="rounded-xl"
          >
            Somar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={bulkMode === "subtract" ? "default" : "outline"}
            onClick={() => onModeChange("subtract")}
            className="rounded-xl"
          >
            Subtrair
          </Button>
          <Button
            type="button"
            size="sm"
            variant={bulkMode === "replace" ? "default" : "outline"}
            onClick={() => onModeChange("replace")}
            className="rounded-xl"
          >
            Substituir
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!productReady ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Crie o produto antes de configurar o estoque.
          </div>
        ) : !hasVariations ? (
          <div className="space-y-4 rounded-2xl bg-card p-4">
            <div>
              <p className="font-medium">Estoque do produto</p>
              <p className="text-sm text-muted-foreground">
                Como este produto não possui variações, o estoque será salvo diretamente no item padrão.
              </p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:w-40 space-y-2">
                <p className="text-sm font-medium">Quantidade</p>
                {directSavedItem ? (
                  <div className="flex items-center gap-2 pb-2">
                    <span className="text-sm text-muted-foreground">Atual:</span>
                    <span className="inline-flex items-center justify-center min-w-8 rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-extrabold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {directSavedItem.stock}
                    </span>
                  </div>
                ) : null}
                <Input
                  type="number"
                  min="0"
                  value={directStockValue}
                  onChange={(event) => onDirectStockChange(event.target.value)}
                  placeholder="0"
                  className="h-10 rounded-xl"
                />
                
              </div>

              <div className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                Resultado previsto:{" "}
                <span className="font-bold text-foreground">
                  {directStockValue === "" || Number.isNaN(Number(directStockValue))
                    ? directSavedItem?.stock ?? 0
                    : getNextStock(directSavedItem?.stock ?? 0, Number(directStockValue), bulkMode)}
                </span>
              </div>
            </div>
          </div>
        ) : loadingSavedItems ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Carregando itens...
          </div>
        ) : savedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum item gerado ainda. Tente selecionar opções de variação acima.
          </div>
        ) : (
          <div className="space-y-3">
            {savedItems.map((item) => {
              const rawValue = bulkValues[item.id] ?? "";
              const parsedValue = Number(rawValue);
              const previewStock =
                rawValue === "" || Number.isNaN(parsedValue)
                  ? item.stock
                  : getNextStock(item.stock, parsedValue, bulkMode);

              return (
                <div key={item.id} className="grid gap-3 rounded-2xl bg-card p-4 md:grid-cols-[1fr_160px_220px] md:items-end">
                  <div>
                    <p className="font-medium">
                      {renderSavedItemLabel(item)}
                      {(item as any).isVirtual && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                          Novo
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">Atual:</span>
                      <span className="inline-flex items-center justify-center min-w-8 rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-extrabold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {item.stock}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">Quantidade</p>
                    <Input
                      type="number"
                      min="0"
                      value={rawValue}
                      onChange={(event) => onValueChange(item.id, event.target.value)}
                      placeholder="0"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                    Resultado previsto:{" "}
                    <span className="font-bold text-foreground">{previewStock}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {productReady && (savedItems.length > 0 || !hasVariations) && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Observações sobre o ajuste (opcional)</p>
            <Input
              value={observation}
              onChange={(e) => onObservationChange(e.target.value)}
              placeholder="Ex: Contagem de estoque / Entrada de mercadoria"
              className="h-10 rounded-xl"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
