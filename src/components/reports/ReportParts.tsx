import type { ReactNode } from "react";
import { Download, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildImageUrl } from "@/utils/image-url";
import { KpiDeltaLine } from "@/components/dashboard/KpiDeltaLine";
import type { KpiDelta } from "@/lib/kpi-delta";

export type StatTone = "default" | "good" | "bad" | "warn";

const TONE: Record<StatTone, string> = {
  default: "text-foreground",
  good: "text-emerald-700",
  bad: "text-rose-700",
  warn: "text-amber-700",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
  delta?: KpiDelta | null;
  deltaLabel?: string;
  testId?: string;
}

/** Número em destaque com rótulo curto, dica opcional e variação contra o período anterior. */
export function StatCard({ label, value, hint, tone = "default", delta, deltaLabel, testId }: StatCardProps) {
  return (
    <Card className="border border-border rounded-2xl shadow-sm" data-testid={testId}>
      <CardContent className="p-4 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-xl sm:text-2xl font-extrabold tabular-nums leading-tight ${TONE[tone]}`}>{value}</p>
        {delta && deltaLabel && <KpiDeltaLine delta={delta} label={deltaLabel} />}
        {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
      </CardContent>
    </Card>
  );
}

interface SectionProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function ReportSection({ title, subtitle, action, children }: SectionProps) {
  return (
    <Card className="border border-border rounded-2xl shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl gap-1.5 w-full sm:w-auto"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      Exportar CSV
    </Button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 py-10 border border-dashed rounded-xl text-center px-4">
      <Package className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
      {children}
    </div>
  );
}

export function ErrorNotice({ message }: { message?: string }) {
  return (
    <p className="text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded-xl p-3" role="alert">
      Não foi possível carregar o relatório. {message}
    </p>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando relatório">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-muted animate-pulse" />
    </div>
  );
}

export function Thumb({ url }: { url?: string }) {
  return url ? (
    <img src={buildImageUrl(url)} alt="" className="h-9 w-9 rounded-lg object-cover border shrink-0" />
  ) : (
    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border shrink-0">
      <Package className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

/** Lista com barra de participação (forma de pagamento, entrega, status). */
export function BucketList({
  items,
  formatValue,
}: {
  items: { nome: string; pedidos: number; valor: number; percentual: number }[];
  formatValue: (v: number) => string;
}) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">Sem dados no período.</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.nome} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-foreground truncate">{it.nome}</span>
            <span className="tabular-nums text-foreground shrink-0">{formatValue(it.valor)}</span>
          </div>
          <div
            className="h-1.5 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-label={it.nome}
            aria-valuenow={it.percentual}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, it.percentual)}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {it.pedidos} {it.pedidos === 1 ? "pedido" : "pedidos"} · {it.percentual.toLocaleString("pt-BR")}%
          </p>
        </li>
      ))}
    </ul>
  );
}
