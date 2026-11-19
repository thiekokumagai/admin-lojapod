import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductsReport } from "@/hooks/useReports";
import { formatBRL, formatInt, formatPct } from "@/lib/dashboard-format";
import {
  IDLE_DAYS_OPTIONS,
  PRODUCT_SORT_OPTIONS,
  matchesSearch,
  sortReportProducts,
  type ProductSort,
} from "@/lib/reports-view";
import type { ProductsReport as ProductsReportData, ReportFilters } from "@/services/reports.service";
import { downloadCsv } from "@/utils/csv";
import { EmptyState, ErrorNotice, ExportButton, ReportSection, ReportSkeleton, StatCard, Thumb } from "./ReportParts";

type SubView = "ranking" | "boxes" | "parados";

const dateBR = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Campo_Grande" });

function chip(active: boolean) {
  return `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "bg-muted text-muted-foreground hover:text-foreground"
  }`;
}

export function exportProductsCsv(data: ProductsReportData, range: { startDate: string; endDate: string }) {
  downloadCsv(
    `relatorio-produtos_${range.startDate}_${range.endDate}.csv`,
    ["Produto", "Categoria", "Unidades avulsas", "Unidades em boxes", "Unidades totais", "Faturamento", "Lucro", "Margem (%)", "Estoque"],
    data.produtos.map((p) => [
      p.titulo,
      p.categoria,
      p.unidadesAvulsas,
      p.unidadesEmCombos,
      p.unidadesTotais,
      p.receita,
      p.lucro,
      p.margem,
      p.estoque,
    ]),
  );
}

export function exportBoxesCsv(data: ProductsReportData, range: { startDate: string; endDate: string }) {
  downloadCsv(
    `relatorio-boxes_${range.startDate}_${range.endDate}.csv`,
    ["Box", "Categoria", "Boxes vendidos", "Faturamento", "Lucro", "Margem (%)", "Composição"],
    data.combos.map((c) => [c.titulo, c.categoria, c.quantidade, c.receita, c.lucro, c.margem, c.composicao]),
  );
}

export function exportIdleCsv(data: ProductsReportData) {
  downloadCsv(
    `relatorio-produtos-parados_${data.parados.diasSemVender}dias.csv`,
    ["Produto", "Categoria", "Estoque", "Dias sem vender", "Última venda", "Custo unitário", "Capital parado"],
    data.parados.itens.map((p) => [
      p.titulo,
      p.categoria,
      p.estoque,
      p.diasSemVender,
      p.ultimaVenda ? dateBR(p.ultimaVenda) : "Nunca vendeu",
      p.custoUnitario,
      p.capitalParado,
    ]),
  );
}

interface ProductsReportProps {
  filters: ReportFilters | null;
  onIdleDaysChange: (days: number) => void;
}

export function ProductsReport({ filters, onIdleDaysChange }: ProductsReportProps) {
  const query = useProductsReport(filters, true);
  const data = query.data;
  const [view, setView] = useState<SubView>("ranking");
  const [sort, setSort] = useState<ProductSort>("total");
  const [search, setSearch] = useState("");

  const ranking = useMemo(() => {
    if (!data) return [];
    return sortReportProducts(
      data.produtos.filter((p) => matchesSearch(p.titulo, search)),
      sort,
    );
  }, [data, sort, search]);

  if (query.isPending) return <ReportSkeleton />;
  if (query.isError && !data) return <ErrorNotice message={query.error?.message} />;
  if (!data || !filters) return null;

  const { resumo, parados } = data;
  const stale = query.isPlaceholderData;

  return (
    <div className={`space-y-4 transition-opacity ${stale ? "opacity-60" : ""}`} data-testid="products-report">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Produtos vendidos"
          value={formatInt(resumo.unidadesTotais)}
          hint={`${formatInt(resumo.unidadesAvulsas)} avulsos + ${formatInt(resumo.unidadesEmCombos)} dentro de boxes`}
          testId="prod-unidades"
        />
        <StatCard
          label="Boxes vendidos"
          value={formatInt(resumo.combosVendidos)}
          hint={`Contando cada box como 1 item, seriam ${formatInt(resumo.itensContandoBoxComoUm)} itens`}
          testId="prod-boxes"
        />
        <StatCard
          label="Lucro dos produtos"
          value={formatBRL(resumo.lucro)}
          tone={resumo.lucro >= 0 ? "good" : "bad"}
          hint={resumo.margem !== null ? `Margem ${formatPct(resumo.margem)}` : "Sem custo cadastrado"}
        />
        <StatCard
          label="Parados"
          value={formatInt(parados.quantidade)}
          tone={parados.quantidade > 0 ? "warn" : "default"}
          hint={`${formatBRL(parados.capitalParado)} em estoque sem vender há ${parados.diasSemVender}+ dias`}
        />
      </div>

      <p className="text-xs text-muted-foreground rounded-2xl border border-border bg-muted/40 p-3">
        Os boxes são abertos: cada box vendido soma as unidades dos produtos que ele leva, e a receita e o custo dele
        são divididos entre eles. Assim você vê quanto cada produto vendeu de verdade, avulso ou em box.
        {resumo.produtosSemCusto > 0 && (
          <span className="text-amber-700">
            {" "}
            {resumo.produtosSemCusto} produto(s) sem custo cadastrado ficam sem lucro.
          </span>
        )}
      </p>

      <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border w-full sm:w-fit" role="tablist" aria-label="Visões do relatório de produtos">
        {(
          [
            { id: "ranking", label: "Ranking", count: data.produtos.length },
            { id: "boxes", label: "Boxes", count: data.combos.length },
            { id: "parados", label: "Parados", count: parados.quantidade },
          ] as { id: SubView; label: string; count: number }[]
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === t.id
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} <span className="text-xs font-normal text-muted-foreground">({formatInt(t.count)})</span>
          </button>
        ))}
      </div>

      {view === "ranking" && (
        <ReportSection
          title="Ranking de produtos"
          subtitle={
            data.listaTruncada
              ? `Mostrando os ${data.produtos.length} mais vendidos`
              : `${formatInt(data.produtos.length)} produtos com venda no período`
          }
          action={<ExportButton onClick={() => exportProductsCsv(data, filters)} disabled={data.produtos.length === 0} />}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Ordenar por">
              {PRODUCT_SORT_OPTIONS.map((o) => (
                <button key={o.id} type="button" aria-pressed={sort === o.id} onClick={() => setSort(o.id)} className={chip(sort === o.id)}>
                  {o.label}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto"
              aria-label="Buscar produto"
              className="bg-background border border-input rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-56 sm:ml-auto"
            />
          </div>

          {ranking.length === 0 ? (
            <EmptyState>{search ? "Nenhum produto com esse nome" : "Nenhum produto vendido neste período"}</EmptyState>
          ) : (
            <>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Avulsos</TableHead>
                      <TableHead className="text-right">Em boxes</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((p, idx) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <Thumb url={p.imagem} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate max-w-[260px]">{p.titulo}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{p.categoria}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatInt(p.unidadesAvulsas)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatInt(p.unidadesEmCombos)}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{formatInt(p.unidadesTotais)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatBRL(p.receita)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.lucro !== null ? (
                            <span className={`font-semibold ${p.lucro >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {formatBRL(p.lucro)}
                              {p.semCusto ? " *" : ""}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-600">Sem custo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.margem !== null ? formatPct(p.margem) : <span className="text-muted-foreground">--</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {p.estoque !== null ? formatInt(p.estoque) : "--"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-[11px] text-muted-foreground mt-2">* Parte das vendas sem custo cadastrado ficou fora do lucro.</p>
              </div>

              <ul className="sm:hidden divide-y divide-border">
                {ranking.map((p, idx) => (
                  <li key={p.id} className="flex items-start gap-3 py-3">
                    <span className="w-5 pt-2 text-center text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
                    <Thumb url={p.imagem} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{p.titulo}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatInt(p.unidadesAvulsas)} avulsos + {formatInt(p.unidadesEmCombos)} em boxes
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {formatBRL(p.receita)} ·{" "}
                        {p.lucro !== null ? `lucro ${formatBRL(p.lucro)}${p.margem !== null ? ` (${formatPct(p.margem)})` : ""}` : "sem custo"}
                      </p>
                    </div>
                    <p className="text-lg font-extrabold tabular-nums">{formatInt(p.unidadesTotais)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ReportSection>
      )}

      {view === "boxes" && (
        <ReportSection
          title="Boxes vendidos"
          subtitle={`${formatInt(resumo.combosVendidos)} boxes no período`}
          action={<ExportButton onClick={() => exportBoxesCsv(data, filters)} disabled={data.combos.length === 0} />}
        >
          {data.combos.length === 0 ? (
            <EmptyState>Nenhum box vendido neste período</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {data.combos.map((c, idx) => (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <span className="w-5 pt-2 text-center text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
                  <Thumb url={c.imagem} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{c.titulo}</p>
                    {c.composicao && <p className="text-[11px] text-muted-foreground">{c.composicao}</p>}
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {formatBRL(c.receita)} ·{" "}
                      {c.lucro !== null ? `lucro ${formatBRL(c.lucro)}${c.margem !== null ? ` (${formatPct(c.margem)})` : ""}` : "sem custo cadastrado"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold tabular-nums">{formatInt(c.quantidade)}</p>
                    <p className="text-[10px] text-muted-foreground">vendidos</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ReportSection>
      )}

      {view === "parados" && (
        <ReportSection
          title="Produtos parados"
          subtitle={`Com estoque e sem venda (avulsa ou em box) há ${parados.diasSemVender} dias ou mais. Não depende do período escolhido.`}
          action={<ExportButton onClick={() => exportIdleCsv(data)} disabled={parados.itens.length === 0} />}
        >
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Dias sem vender">
            <span className="text-xs text-muted-foreground mr-1">Sem vender há</span>
            {IDLE_DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={parados.diasSemVender === d}
                onClick={() => onIdleDaysChange(d)}
                className={chip(parados.diasSemVender === d)}
              >
                {d} dias
              </button>
            ))}
          </div>

          {parados.itens.length === 0 ? (
            <EmptyState>Nenhum produto parado. Tudo com estoque vendeu nos últimos {parados.diasSemVender} dias.</EmptyState>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {formatInt(parados.quantidade)} produtos · {formatBRL(parados.capitalParado)} parados em estoque
                {parados.semCusto > 0 ? ` · ${parados.semCusto} sem custo cadastrado (fora do valor)` : ""}
              </p>
              <ul className="divide-y divide-border">
                {parados.itens.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 py-3">
                    <Thumb url={p.imagem} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{p.titulo}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.categoria} · {formatInt(p.estoque)} em estoque
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.nuncaVendeu ? "Nunca vendeu" : `Última venda em ${dateBR(p.ultimaVenda!)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold tabular-nums text-amber-700">
                        {formatInt(p.diasSemVender)} {p.diasSemVender === 1 ? "dia" : "dias"}
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {p.capitalParado !== null ? formatBRL(p.capitalParado) : "sem custo"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ReportSection>
      )}
    </div>
  );
}
