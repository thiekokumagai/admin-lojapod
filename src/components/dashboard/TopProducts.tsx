import { ArrowRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BestSellerItem, BestSellerSort } from "@/services/dashboard.service";
import type { CategoryList } from "@/types/category";
import { buildImageUrl } from "@/utils/image-url";
import { formatPct } from "@/lib/dashboard-format";
import { sharePct } from "@/lib/abc";
import { SORT_OPTIONS, formatMetric, metricOf } from "@/lib/dashboard-metrics";

export function SortChips({
  value,
  onChange,
}: {
  value: BestSellerSort;
  onChange: (sort: BestSellerSort) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Ordenar produtos por">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            value === opt.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface TopProductsProps {
  items: BestSellerItem[];
  /** Faturamento total dos itens no período, base da participação (%). */
  totalRevenue: number;
  sort: BestSellerSort;
  onSortChange: (sort: BestSellerSort) => void;
  categories: CategoryList[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
  loading: boolean;
  updating: boolean;
  onSeeAll: () => void;
}

/** Top 5 produtos: a barra mostra o tamanho no critério escolhido; o % é a participação no faturamento. */
export function TopProducts({
  items,
  totalRevenue,
  sort,
  onSortChange,
  categories,
  categoryId,
  onCategoryChange,
  loading,
  updating,
  onSeeAll,
}: TopProductsProps) {
  const metrics = items.map((i) => metricOf(i, sort));
  const max = sort === "margin" ? 100 : Math.max(0, ...metrics.map((m) => m ?? 0));

  return (
    <Card className="border border-border rounded-2xl shadow-sm">
      <CardContent className="p-4 sm:p-5 flex flex-col h-full gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">Top 5 produtos</h2>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filtrar por categoria"
            className="bg-muted text-foreground border border-border rounded-lg text-xs font-semibold px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-32"
          >
            <option value="all">Categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        <SortChips value={sort} onChange={onSortChange} />

        <ol className={`flex-1 space-y-3 transition-opacity ${updating && items.length > 0 ? "opacity-60" : ""}`}>
          {loading || (updating && items.length === 0) ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <li key={idx} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 bg-muted rounded" />
                  <div className="h-2.5 w-16 bg-muted rounded" />
                </div>
              </li>
            ))
          ) : items.length === 0 ? (
            <li className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 py-10 border border-dashed rounded-xl">
              <Package className="h-6 w-6 text-muted-foreground/40" />
              Nenhum produto vendido neste período
            </li>
          ) : (
            items.map((item, idx) => {
              const metric = metrics[idx];
              const width = metric !== null && max > 0 ? Math.max(2, Math.min(100, (metric / max) * 100)) : 0;
              const share = sharePct(item.totalRevenue, totalRevenue);
              return (
                <li key={item.id} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-center text-xs font-extrabold text-muted-foreground tabular-nums">
                      {idx + 1}
                    </span>
                    {item.imageUrl ? (
                      <img
                        src={buildImageUrl(item.imageUrl)}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover border shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground line-clamp-2 break-words">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.categoryTitle} · {formatPct(Number(share.toFixed(1)))} das vendas
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-right text-sm font-extrabold tabular-nums whitespace-nowrap ${
                        metric === null ? "text-amber-600 text-xs" : "text-foreground"
                      }`}
                    >
                      {formatMetric(metric, sort)}
                    </p>
                  </div>
                  <div className="ml-7 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                  </div>
                </li>
              );
            })
          )}
        </ol>

        <Button
          size="sm"
          variant="ghost"
          onClick={onSeeAll}
          className="self-start h-auto p-0 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-transparent gap-1"
        >
          Ver todos os produtos
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
}
