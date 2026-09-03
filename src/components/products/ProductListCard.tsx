import { Link } from "react-router-dom";
import { ArrowRight, Copy, Images, Package, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { buildImageUrl } from "@/utils/image-url";
import { matchesProductSearch } from "@/utils/search";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProductResponse } from "@/types/product";
import type { CategoryList } from "@/types/category";

type ProductListCardProps = {
  products: ProductResponse[];
  categories: CategoryList[];
  isLoading: boolean;
  onDuplicate: (product: ProductResponse) => void;
  onDelete: (product: ProductResponse) => void;
  isDuplicating: boolean;
  isDeleting: boolean;
};

export function ProductListCard({
  products,
  categories,
  isLoading,
  onDuplicate,
  onDelete,
  isDuplicating,
  isDeleting,
}: ProductListCardProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.title ?? "Sem categoria";
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = matchesProductSearch(search, product);
      const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, products, search]);

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-muted/30 shadow-none">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto"
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Carregando produtos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Nenhum produto encontrado para os filtros informados.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const cover = product.images[0]?.url ? buildImageUrl(product.images[0].url) : "";

            return (
              <Card key={product.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors hover:bg-muted/20">
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {cover ? (
                        <img src={cover} alt={product.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold md:text-base">{product.title}</h3>
                        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                          {getCategoryName(product.categoryId)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground md:text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <Images className="h-3.5 w-3.5" />
                          {product.images.length} foto(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => onDuplicate(product)}
                      disabled={isDuplicating || isDeleting}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => onDelete(product)}
                      disabled={isDeleting || isDuplicating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                    <Button asChild size="sm" className="rounded-xl">
                      <Link to={`/produtos/${product.id}`}>
                        Abrir
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
