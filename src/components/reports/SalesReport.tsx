import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SalesProfitChart } from "@/components/dashboard/SalesProfitChart";
import { useSalesReport } from "@/hooks/useReports";
import { computeDelta } from "@/lib/kpi-delta";
import { formatBRL, formatInt } from "@/lib/dashboard-format";
import type { ReportFilters, SalesReportOrder } from "@/services/reports.service";
import { downloadCsv } from "@/utils/csv";
import {
  BucketList,
  EmptyState,
  ErrorNotice,
  ExportButton,
  ReportSection,
  ReportSkeleton,
  StatCard,
} from "./ReportParts";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  DISPATCHED: "Saiu para entrega",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Campo_Grande",
  });

export function exportSalesCsv(orders: SalesReportOrder[], range: { startDate: string; endDate: string }) {
  downloadCsv(
    `relatorio-vendas_${range.startDate}_${range.endDate}.csv`,
    ["Pedido", "Data", "Cliente", "Total", "Pagamento", "Situação do pagamento", "Status", "Entrega"],
    orders.map((o) => [
      o.numero,
      formatDateTime(o.data),
      o.cliente,
      o.total,
      o.pagamento,
      o.statusPagamento === "PAID" ? "Pago" : "A receber",
      STATUS_LABEL[o.status] ?? o.status,
      o.entrega,
    ]),
  );
}

interface SalesReportProps {
  filters: ReportFilters | null;
  comparisonLabel: string;
}

export function SalesReport({ filters, comparisonLabel }: SalesReportProps) {
  const query = useSalesReport(filters, true);
  const data = query.data;

  const faturamentoDelta = useMemo(
    () => (data?.comparacao ? computeDelta(data.resumo.faturamento, data.comparacao.faturamento, { kind: "percent", format: formatBRL }) : null),
    [data],
  );
  const pedidosDelta = useMemo(
    () => (data?.comparacao ? computeDelta(data.resumo.pedidos, data.comparacao.pedidos, { kind: "percent", format: formatInt }) : null),
    [data],
  );
  const ticketDelta = useMemo(
    () => (data?.comparacao ? computeDelta(data.resumo.ticketMedio, data.comparacao.ticketMedio, { kind: "percent", format: formatBRL }) : null),
    [data],
  );

  if (query.isPending) return <ReportSkeleton />;
  if (query.isError && !data) return <ErrorNotice message={query.error?.message} />;
  if (!data || !filters) return null;

  const { resumo } = data;
  const stale = query.isPlaceholderData;

  return (
    <div className={`space-y-4 transition-opacity ${stale ? "opacity-60" : ""}`} data-testid="sales-report">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Faturamento"
          value={formatBRL(resumo.faturamento)}
          delta={faturamentoDelta}
          deltaLabel={comparisonLabel}
          testId="sales-faturamento"
        />
        <StatCard label="Pedidos" value={formatInt(resumo.pedidos)} delta={pedidosDelta} deltaLabel={comparisonLabel} />
        <StatCard label="Ticket médio" value={formatBRL(resumo.ticketMedio)} delta={ticketDelta} deltaLabel={comparisonLabel} />
        <StatCard label="Itens vendidos" value={formatInt(resumo.itensVendidos)} hint="Cada box conta como 1 item" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Recebido" value={formatBRL(resumo.recebido)} tone="good" hint={`${resumo.pedidosPagos} pedidos pagos`} />
        <StatCard label="A receber" value={formatBRL(resumo.aReceber)} tone={resumo.aReceber > 0 ? "warn" : "default"} />
        <StatCard label="Frete cobrado" value={formatBRL(resumo.freteCobrado)} />
        <StatCard label="Descontos" value={formatBRL(resumo.descontos)} hint="Cupom, pagamento e recibo" />
        {resumo.cancelados ? (
          <StatCard
            label="Cancelados"
            value={formatInt(resumo.cancelados.pedidos)}
            tone={resumo.cancelados.pedidos > 0 ? "bad" : "default"}
            hint={`${formatBRL(resumo.cancelados.valor)} fora dos totais`}
          />
        ) : (
          <StatCard label="Taxa de cartão" value={formatBRL(resumo.taxaCartao)} />
        )}
      </div>

      <SalesProfitChart data={data.serie} loading={false} comparisonLabel="" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReportSection title="Forma de pagamento">
          <BucketList items={data.porPagamento} formatValue={formatBRL} />
        </ReportSection>
        <ReportSection title="Entrega">
          <BucketList items={data.porEntrega} formatValue={formatBRL} />
        </ReportSection>
        <ReportSection title="Status do pedido">
          <BucketList items={data.porStatus} formatValue={formatBRL} />
        </ReportSection>
      </div>

      <ReportSection
        title="Pedidos do período"
        subtitle={
          data.listaTruncada
            ? `Mostrando os ${data.pedidos.length} mais recentes de ${formatInt(resumo.pedidos)}. Os totais acima incluem todos.`
            : `${formatInt(data.pedidos.length)} ${data.pedidos.length === 1 ? "pedido" : "pedidos"}`
        }
        action={<ExportButton onClick={() => exportSalesCsv(data.pedidos, filters)} disabled={data.pedidos.length === 0} />}
      >
        {data.pedidos.length === 0 ? (
          <EmptyState>Nenhum pedido com esses filtros</EmptyState>
        ) : (
          <>
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pedidos.map((o) => (
                    <TableRow key={o.numero}>
                      <TableCell className="font-semibold tabular-nums">#{o.numero}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{formatDateTime(o.data)}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{o.cliente}</TableCell>
                      <TableCell className="text-xs">
                        {o.pagamento}
                        <span className={`block text-[10px] ${o.statusPagamento === "PAID" ? "text-emerald-700" : "text-amber-600"}`}>
                          {o.statusPagamento === "PAID" ? "Pago" : "A receber"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{STATUS_LABEL[o.status] ?? o.status}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{formatBRL(o.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="sm:hidden divide-y divide-border">
              {data.pedidos.map((o) => (
                <li key={o.numero} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      #{o.numero} · <span className="truncate">{o.cliente}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateTime(o.data)} · {o.pagamento} · {STATUS_LABEL[o.status] ?? o.status}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums">{formatBRL(o.total)}</p>
                    <p className={`text-[10px] ${o.statusPagamento === "PAID" ? "text-emerald-700" : "text-amber-600"}`}>
                      {o.statusPagamento === "PAID" ? "Pago" : "A receber"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </ReportSection>
    </div>
  );
}
