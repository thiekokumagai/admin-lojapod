import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BestSellerItem, BestSellerSort, DashboardKPIs, DashboardMissingCost } from "@/services/dashboard.service";
import type { CategoryList } from "@/types/category";
import { buildImageUrl } from "@/utils/image-url";
import { PRODUCTS_TABLE_LIMIT, useDashboardProducts, type DashboardRange } from "@/hooks/useDashboard";
import { classifyAbc, sharePct, type AbcClass } from "@/lib/abc";
import { sortProducts } from "@/lib/products-sort";
import { formatBRL, formatInt, formatPct } from "@/lib/dashboard-format";
import { MissingCostNotice } from "./MissingCostNotice";
import { SortChips } from "./TopProducts";

const ABC_STYLE: Record<AbcClass, string> = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-200",
  B: "bg-amber-50 text-amber-700 border-amber-200",
  C: "bg-slate-100 text-slate-600 border-slate-200",
};

function AbcBadge({ abc }: { abc: AbcClass | undefined }) {
  if (!abc) return <span className="text-muted-foreground">--</span>;
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold ${ABC_STYLE[abc]}`}>
      {abc}
    </span>
  );
}

function ProductThumb({ item }: { item: BestSellerItem }) {
  return item.imageUrl ? (
    <img src={buildImageUrl(item.imageUrl)} alt="" className="h-9 w-9 rounded-lg object-cover border shrink-0" />
  ) : (
    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border shrink-0">
      <Package className="h-4 w-4" />
    </div>
  );
}

const SORT_COLUMN_LABEL: Record<BestSellerSort, string> = {
  quantity: "Qtd.",
  revenue: "Faturamento",
  profit: "Lucro",
  margin: "Margem",
};

interface ProductsTabProps {
  range: DashboardRange | null;
  stats: DashboardKPIs | null;
  missingCost: DashboardMissingCost | null;
  categories: CategoryList[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
}

/** Todos os produtos vendidos no período: ordenável por 4 critérios e com curva ABC. */
export function ProductsTab({ range, stats, missingCost, categories, categoryId, onCategoryChange }: ProductsTabProps) {
  const [sort, setSort] = useState<BestSellerSort>("revenue");
  const query = useDashboardProducts(range, categoryId === "all" ? undefined : categoryId, true);

  const rows = useMemo(() => query.data ?? [], [query.data]);
  const sorted = useMemo(() => sortProducts(rows, sort), [rows, sort]);

  // Base da curva ABC: o faturamento total do período quando a lista está completa ou é de
  // toda a loja; num recorte por categoria cortado no limite, o da própria lista.
  const listed = rows.reduce((sum, r) => sum + r.totalRevenue, 0);
  const complete = rows.length < PRODUCTS_TABLE_LIMIT;
  const abcTotal = complete || categoryId !== "all" ? listed : (stats?.receitaItens ?? listed);
  const abc = useMemo(() => classifyAbc(rows, abcTotal), [rows, abcTotal]);

  const withoutCost = rows.filter((r) => r.lucro === null).length;
  const loading = query.isPending;

  return (
    <div className="space-y-4">
      <MissingCostNotice missingCost={missingCost} />

      <Card className="border border-border rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Produtos vendidos</h2>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? "Carregando..."
                  : `${formatInt(rows.length)} ${rows.length === 1 ? "produto" : "produtos"}${
                      withoutCost > 0 ? ` · ${withoutCost} sem custo cadastrado` : ""
                    }${complete ? "" : ` · mostrando os ${PRODUCTS_TABLE_LIMIT} de maior faturamento`}`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
              <SortChips value={sort} onChange={setSort} />
              <select
                value={categoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
                aria-label="Filtrar por categoria"
                className="bg-muted text-foreground border border-border rounded-lg text-xs font-semibold px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-44"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {query.isError && rows.length === 0 ? (
            <p className="text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded-xl p-3">
              Não foi possível carregar os produtos. {query.error?.message}
            </p>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 py-10 border border-dashed rounded-xl">
              <Package className="h-6 w-6 text-muted-foreground/40" />
              Nenhum produto vendido neste período
            </div>
          ) : (
            <>
              {/* Computador: tabela */}
              <div className={`hidden sm:block transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Produto</TableHead>
                      {(Object.keys(SORT_COLUMN_LABEL) as BestSellerSort[]).map((key) => (
                        <TableHead
                          key={key}
                          className="text-right"
                          aria-sort={sort === key ? "descending" : "none"}
                        >
                          <button
                            type="button"
                            onClick={() => setSort(key)}
                            className={`font-semibold hover:text-foreground ${sort === key ? "text-foreground" : ""}`}
                          >
                            {SORT_COLUMN_LABEL[key]}
                            {sort === key ? " ↓" : ""}
                          </button>
                        </TableHead>
                      ))}
                      <TableHead className="text-center" title="Curva ABC pelo faturamento">
                        ABC
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <ProductThumb item={item} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate max-w-[280px]">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.categoryTitle}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatInt(item.quantity)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatBRL(item.totalRevenue)}
                          <span className="block text-[10px] text-muted-foreground">
                            {formatPct(Number(sharePct(item.totalRevenue, abcTotal).toFixed(1)))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.lucro !== null ? (
                            <span className="font-semibold text-emerald-700">
                              {formatBRL(item.lucro)}
                              {item.semCusto ? " *" : ""}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-600">Sem custo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.margem !== null ? formatPct(item.margem) : <span className="text-muted-foreground">--</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <AbcBadge abc={abc.get(item.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Celular: lista */}
              <ul className={`sm:hidden divide-y divide-border transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
                {sorted.map((item, idx) => (
                  <li key={item.id} className="flex items-start gap-3 py-3">
                    <span className="w-5 pt-2 text-center text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
                    <ProductThumb item={item} />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-foreground line-clamp-2 break-words">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatInt(item.quantity)} un. · {formatBRL(item.totalRevenue)}
                      </p>
                      {item.lucro !== null ? (
                        <p className="text-[11px] font-semibold text-emerald-700">
                          Lucro {formatBRL(item.lucro)}
                          {item.margem !== null ? ` · ${formatPct(item.margem)}` : ""}
                          {item.semCusto ? " *" : ""}
                        </p>
                      ) : (
                        <p className="text-[11px] font-semibold text-amber-600">Sem custo</p>
                      )}
                    </div>
                    <AbcBadge abc={abc.get(item.id)} />
                  </li>
                ))}
              </ul>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Curva ABC pelo faturamento: <strong>A</strong> = produtos que somam os primeiros 80% das vendas,{" "}
                <strong>B</strong> = até 95%, <strong>C</strong> = o restante. * = parte das vendas sem custo cadastrado (fora do
                lucro).
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
