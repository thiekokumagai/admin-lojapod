import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers3, ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Variation } from "@/types/variation";

type VariationListCardProps = {
  variations: Variation[];
  isLoading: boolean;
};

function VariationItemCard({ variation }: { variation: Variation }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const options = variation.options ?? [];
  const MAX_PREVIEW = 12;
  const hasMore = options.length > MAX_PREVIEW;
  const displayedOptions = isExpanded || !hasMore ? options : options.slice(0, MAX_PREVIEW);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-lg text-foreground">{variation.title}</h3>
              <Badge variant="secondary" className="font-medium text-xs px-2.5 py-0.5">
                {options.length} {options.length === 1 ? "opção" : "opções"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique em abrir para gerenciar, reordenar ou adicionar mais opções.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto gap-2">
          <Link to={`/variacoes/${variation.id}`}>
            Abrir variação
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="pt-4">
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhuma opção cadastrada ainda.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {displayedOptions.map((opt, i) => (
                <span
                  key={opt.id || i}
                  className="inline-flex items-center rounded-lg border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {opt.value}
                </span>
              ))}

              {hasMore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary font-medium hover:bg-primary/10 px-2.5 rounded-lg"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      Mostrar menos <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      +{options.length - MAX_PREVIEW} opções <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function VariationListCard({ variations, isLoading }: VariationListCardProps) {
  const [search, setSearch] = useState("");

  const filteredVariations = useMemo(() => {
    if (!search.trim()) return variations;
    const q = search.toLowerCase().trim();
    return variations.filter((v) => {
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchOption = v.options?.some((opt) => opt.value.toLowerCase().includes(q));
      return matchTitle || matchOption;
    });
  }, [variations, search]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Carregando variações...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {variations.length > 1 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar variação ou opção..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      {variations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Layers3 className="h-6 w-6" />
            </div>
            <h3 className="font-medium text-base">Nenhuma variação cadastrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Crie sua primeira variação (ex: Sabor, Tamanho, Nicotina) para vincular aos produtos da sua loja.
            </p>
          </CardContent>
        </Card>
      ) : filteredVariations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma variação ou opção encontrada para &quot;{search}&quot;.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVariations.map((variation) => (
            <VariationItemCard key={variation.id} variation={variation} />
          ))}
        </div>
      )}
    </div>
  );
}
