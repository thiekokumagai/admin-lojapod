import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Variation } from "@/types/variation";

type ProductVariationSummaryProps = {
  selectedVariations: Variation[];
  selectedOptionsByVariation: Record<string, string[]>;
  onRemoveCombinationLine: (variationId: string, optionId: string) => void;
};

export function ProductVariationSummary({
  selectedVariations,
  selectedOptionsByVariation,
  onRemoveCombinationLine,
}: ProductVariationSummaryProps) {
  if (selectedVariations.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-3xl border-0 bg-muted/20 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Combinações selecionadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedVariations.map((variation) => {
          const selectedOptionIds = selectedOptionsByVariation[variation.id] ?? [];
          const selectedOptions = variation.options.filter((option) => selectedOptionIds.includes(option.id));

          if (selectedOptions.length === 0) {
            return (
              <div key={variation.id} className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
                {variation.title}: nenhuma opção marcada.
              </div>
            );
          }

          return (
            <div key={variation.id} className="rounded-2xl bg-card p-4 space-y-3">
              <p className="font-medium">{variation.title}</p>
              {selectedOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <span className="text-sm">{option.value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveCombinationLine(variation.id, option.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}