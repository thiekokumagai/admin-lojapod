import { Link } from "react-router-dom";
import { ArrowRight, Layers3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Variation } from "@/types/variation";

type VariationListCardProps = {
  variations: Variation[];
  isLoading: boolean;
};

export function VariationListCard({
  variations,
  isLoading,
}: VariationListCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 mt-4">
        {isLoading ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Carregando variações...
          </div>
        ) : variations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Nenhuma variação cadastrada ainda.
          </div>
        ) : (
          variations.map((variation) => (
            <div
              key={variation.id}
              className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <Layers3 className="h-4 w-4 text-primary" />
                  <span>{variation.title}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {variation.options.map((option) => option.value).join(", ") ||
                    "Sem opções"}
                </p>
              </div>

              <Button asChild variant="outline">
                <Link to={`/variacoes/${variation.id}`}>
                  Abrir variação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
