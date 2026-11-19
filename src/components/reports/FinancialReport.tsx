import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SalesProfitChart } from "@/components/dashboard/SalesProfitChart";
import { useFinancialReport } from "@/hooks/useReports";
import { formatBRL, formatInt, formatPct } from "@/lib/dashboard-format";
import type { FinancialReport as FinancialReportData, ReportFilters } from "@/services/reports.service";
import { downloadCsv } from "@/utils/csv";
import { BucketList, ErrorNotice, ExportButton, ReportSection, ReportSkeleton, StatCard } from "./ReportParts";

const CASH_CATEGORY_LABEL: Record<string, string> = {
  GENERAL: "Geral",
  FIXED_COST: "Contas fixas",
  MOTOBOY: "Motoboy",
  INVESTMENT: "Investimento",
  MARKETING: "Marketing",
  PARTNERS: "Retirada de sócios",
};

interface ResultLine {
  label: string;
  value: number;
  /** Linha de subtotal/resultado: destaque. */
  strong?: boolean;
  /** Valor que reduz o resultado (mostra com sinal de menos). */
  negative?: boolean;
  hint?: string;
}

export function buildResultLines(r: FinancialReportData["resultado"]): ResultLine[] {
  return [
    { label: "Vendas dos itens", value: r.receitaItens },
    { label: "Descontos concedidos", value: r.descontos, negative: true, hint: "Cupom, pagamento e recibo" },
    { label: "Custo dos produtos vendidos", value: r.custoProdutos, negative: true, hint: "Só itens com custo cadastrado" },
    { label: "Taxa de cartão", value: r.taxaCartao, negative: true },
    { label: "Lucro bruto", value: r.lucroBruto, strong: true },
    {
      label: "Custos fixos do período",
      value: r.custosFixos,
      negative: true,
      hint: "Proporcional: valor mensal × dias ÷ 30",
    },
    { label: "Lucro líquido", value: r.lucroLiquido, strong: true },
  ];
}

export function exportFinancialCsv(data: FinancialReportData, range: { startDate: string; endDate: string }) {
  const r = data.resultado;
  downloadCsv(
    `relatorio-financeiro_${range.startDate}_${range.endDate}.csv`,
    ["Seção", "Item", "Valor"],
    [
      ...buildResultLines(r).map((l) => ["Resultado", l.label, l.negative ? -l.value : l.value]),
      ["Resultado", "Margem bruta (%)", r.margemBruta],
      ["Resultado", "Margem líquida (%)", r.margemLiquida],
      ["Frete", "Cobrado", data.frete.cobrado],
      ["Frete", "Pago (Uber e motoboy)", data.frete.pago],
      ["Frete", "Saldo", data.frete.saldo],
      ["Recebimentos", "Recebido", data.recebimentos.recebido],
      ["Recebimentos", "A receber", data.recebimentos.aReceber],
      ...data.porPagamento.map((p) => ["Forma de pagamento", p.nome, p.valor]),
      ...data.custosFixosPorItem.map((c) => ["Custos fixos", c.name, c.value]),
      ["Caixa", "Entradas", data.caixa.entradas],
      ["Caixa", "Saídas", data.caixa.saidas],
      ["Caixa", "Saldo", data.caixa.saldo],
      ...data.caixa.saidasPorCategoria.map((c) => ["Saídas do caixa", CASH_CATEGORY_LABEL[c.categoria] ?? c.categoria, c.valor]),
    ],
  );
}

export function FinancialReport({ filters }: { filters: ReportFilters | null }) {
  const query = useFinancialReport(filters, true);
  const data = query.data;

  if (query.isPending) return <ReportSkeleton />;
  if (query.isError && !data) return <ErrorNotice message={query.error?.message} />;
  if (!data || !filters) return null;

  const { resultado: r } = data;
  const stale = query.isPlaceholderData;
  const lines = buildResultLines(r);

  return (
    <div className={`space-y-4 transition-opacity ${stale ? "opacity-60" : ""}`} data-testid="financial-report">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Faturamento" value={formatBRL(r.faturamento)} hint={`${formatInt(r.pedidos)} pedidos`} />
        <StatCard
          label="Lucro bruto"
          value={formatBRL(r.lucroBruto)}
          tone={r.lucroBruto >= 0 ? "good" : "bad"}
          hint={r.margemBruta !== null ? `Margem ${formatPct(r.margemBruta)}` : "Sem custo cadastrado"}
          testId="fin-lucro-bruto"
        />
        <StatCard
          label="Custos fixos"
          value={formatBRL(r.custosFixos)}
          hint="Proporcional ao período"
        />
        <StatCard
          label="Lucro líquido"
          value={formatBRL(r.lucroLiquido)}
          tone={r.lucroLiquido >= 0 ? "good" : "bad"}
          hint="Lucro bruto − custos fixos"
          testId="fin-lucro-liquido"
        />
      </div>

      {r.receitaSemCusto > 0 && (
        <p className="text-xs text-amber-900 border border-amber-200 bg-amber-50 rounded-2xl p-3" data-testid="fin-sem-custo">
          {formatBRL(r.receitaSemCusto)} em vendas são de produtos sem custo cadastrado e ficam fora do lucro. Cadastre o
          custo no produto para o resultado ficar completo.
        </p>
      )}

      <SalesProfitChart data={data.serie} loading={false} comparisonLabel="" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSection
          title="Resultado do período"
          subtitle="Mesma conta do Dashboard. Frete fica de fora."
          action={<ExportButton onClick={() => exportFinancialCsv(data, filters)} />}
        >
          <Table>
            <TableHeader className="sr-only">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.label} className={l.strong ? "bg-muted/50" : undefined}>
                  <TableCell className={l.strong ? "font-bold" : ""}>
                    {l.label}
                    {l.hint && <span className="block text-[10px] font-normal text-muted-foreground">{l.hint}</span>}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${l.strong ? "font-bold" : ""} ${
                      l.strong ? (l.value >= 0 ? "text-emerald-700" : "text-rose-700") : ""
                    }`}
                  >
                    {l.negative && l.value > 0 ? "− " : ""}
                    {formatBRL(l.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {r.pontoEquilibrioReceita !== null && (
            <p className="text-xs text-muted-foreground">
              Ponto de equilíbrio: {formatBRL(r.pontoEquilibrioReceita)} em vendas
              {r.pontoEquilibrioPedidos !== null ? ` (cerca de ${formatInt(Math.ceil(r.pontoEquilibrioPedidos))} pedidos)` : ""} para cobrir os custos fixos.
            </p>
          )}
        </ReportSection>

        <div className="space-y-4">
          <ReportSection title="Recebimentos">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Recebido" value={formatBRL(data.recebimentos.recebido)} tone="good" />
              <StatCard
                label="A receber"
                value={formatBRL(data.recebimentos.aReceber)}
                tone={data.recebimentos.aReceber > 0 ? "warn" : "default"}
              />
            </div>
            {data.recebimentos.cancelados && data.recebimentos.cancelados.pedidos > 0 && (
              <p className="text-xs text-muted-foreground">
                {data.recebimentos.cancelados.pedidos} pedido(s) cancelado(s), {formatBRL(data.recebimentos.cancelados.valor)}, fora dos totais.
              </p>
            )}
          </ReportSection>

          <ReportSection title="Frete" subtitle="Informativo: não entra no lucro.">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Cobrado" value={formatBRL(data.frete.cobrado)} />
              <StatCard label="Pago" value={formatBRL(data.frete.pago)} hint="Uber e motoboy" />
              <StatCard label="Saldo" value={formatBRL(data.frete.saldo)} tone={data.frete.saldo >= 0 ? "good" : "bad"} />
            </div>
          </ReportSection>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReportSection title="Forma de pagamento">
          <BucketList items={data.porPagamento} formatValue={formatBRL} />
        </ReportSection>

        <ReportSection title="Custos fixos no período">
          {data.custosFixosPorItem.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum custo fixo cadastrado.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.custosFixosPorItem.map((c) => (
                <li key={c.name} className="flex items-baseline justify-between gap-2 py-2 text-sm">
                  <span className="truncate">{c.name}</span>
                  <span className="tabular-nums shrink-0">{formatBRL(c.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </ReportSection>

        <ReportSection title="Caixa" subtitle="O que entrou e saiu nos caixas do período.">
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Entradas" value={formatBRL(data.caixa.entradas)} tone="good" />
            <StatCard label="Saídas" value={formatBRL(data.caixa.saidas)} tone={data.caixa.saidas > 0 ? "bad" : "default"} />
            <StatCard label="Saldo" value={formatBRL(data.caixa.saldo)} tone={data.caixa.saldo >= 0 ? "good" : "bad"} />
          </div>
          {data.caixa.saidasPorCategoria.length > 0 && (
            <ul className="divide-y divide-border">
              {data.caixa.saidasPorCategoria.map((c) => (
                <li key={c.categoria} className="flex items-baseline justify-between gap-2 py-2 text-sm">
                  <span>{CASH_CATEGORY_LABEL[c.categoria] ?? c.categoria}</span>
                  <span className="tabular-nums">{formatBRL(c.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </ReportSection>
      </div>
    </div>
  );
}
