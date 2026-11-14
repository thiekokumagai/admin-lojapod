import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Wallet, Scale, PiggyBank } from "lucide-react";
import { useStoreDiagnosis } from "@/hooks/useStoreDiagnosis";
import type { DiagnosisItem, DiagnosisSeverity } from "@/services/dashboard.service";

type Period = "7days" | "30days" | "6months" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "7days", label: "7 dias" },
  { id: "30days", label: "30 dias" },
  { id: "6months", label: "6 meses" },
  { id: "year", label: "Ano" },
];

const formatBRL = (v: number) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Datas locais YYYY-MM-DD; a API converte para início/fim do dia no fuso da loja.
function getPeriodDates(period: Period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  if (period === "7days") start.setDate(start.getDate() - 6);
  else if (period === "30days") start.setDate(start.getDate() - 29);
  else if (period === "6months") start.setMonth(start.getMonth() - 6);
  else start.setFullYear(start.getFullYear() - 1);
  return { start: toLocalDateStr(start), end: toLocalDateStr(end) };
}

const SEVERITY_STYLE: Record<DiagnosisSeverity, { dot: string; badge: string; label: string }> = {
  critical: { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200", label: "Crítico" },
  warning: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Atenção" },
  info: { dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700 border-sky-200", label: "Informação" },
  ok: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Ok" },
};

function DiagnosisRow({ item, onAction }: { item: DiagnosisItem; onAction: (url: string) => void }) {
  const style = SEVERITY_STYLE[item.severity];
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border border-border bg-card">
      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
        {item.amount !== null && (
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">{formatBRL(item.amount)}</p>
            {item.estimated && <p className="text-[10px] text-muted-foreground">estimativa</p>}
          </div>
        )}
        {item.actionUrl && item.actionLabel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAction(item.actionUrl as string)}
            className="text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 p-0 h-auto flex items-center gap-1"
          >
            <span>{item.actionLabel}</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DiagnosisTab() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("30days");
  const { start, end } = useMemo(() => getPeriodDates(period), [period]);
  const { data, isLoading, isFetching, isError, refetch } = useStoreDiagnosis(start, end);

  const problems = data?.itens.filter((i) => i.severity !== "ok") ?? [];
  const okItems = data?.itens.filter((i) => i.severity === "ok") ?? [];
  const resultado = data?.resultado;
  const lucroPositivo = (resultado?.lucroLiquido ?? 0) >= 0;
  const coverage =
    resultado && resultado.custosFixos > 0
      ? Math.min(100, Math.round((Math.max(0, resultado.lucroBruto) / resultado.custosFixos) * 100))
      : null;
  const maxFixed = data?.custosFixosPorItem[0]?.value ?? 0;

  const cards = resultado
    ? [
        { label: "Lucro Bruto", value: formatBRL(resultado.lucroBruto), icon: PiggyBank, color: "text-emerald-600 bg-emerald-100" },
        { label: "Custos Fixos (proporcional)", value: formatBRL(resultado.custosFixos), icon: Wallet, color: "text-amber-600 bg-amber-100" },
        {
          label: "Lucro Líquido",
          value: formatBRL(resultado.lucroLiquido),
          icon: lucroPositivo ? TrendingUp : TrendingDown,
          color: lucroPositivo ? "text-emerald-600 bg-emerald-100" : "text-rose-600 bg-rose-100",
        },
        {
          label: "Ponto de Equilíbrio",
          value: resultado.pontoEquilibrioReceita !== null ? formatBRL(resultado.pontoEquilibrioReceita) : "--",
          sub:
            resultado.pontoEquilibrioPedidos !== null
              ? `≈ ${resultado.pontoEquilibrioPedidos} pedidos`
              : "sem custo fixo ou margem para calcular",
          icon: Scale,
          color: "text-sky-600 bg-sky-100",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted rounded-xl border border-border w-fit">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl border border-border"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isError && (
        <Card className="border border-rose-200 bg-rose-50 rounded-2xl">
          <CardContent className="p-4 text-xs text-rose-800">
            Não foi possível carregar o diagnóstico. Tente atualizar.
          </CardContent>
        </Card>
      )}

      {/* Resultado do período */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse border border-border" />
            ))
          : cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="border border-border rounded-2xl shadow-sm">
                  <CardContent className="p-4 sm:p-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
                      <p className="text-xs text-muted-foreground font-medium leading-tight">{card.label}</p>
                      <p className="text-lg sm:text-xl font-bold leading-tight tabular-nums text-foreground [overflow-wrap:anywhere]">{card.value}</p>
                      {"sub" in card && card.sub && <p className="text-[10px] text-muted-foreground">{card.sub}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {resultado && (
        <Card className="border border-border rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-foreground">Lucro bruto × Custos fixos</h2>
              <p className="text-xs text-muted-foreground">
                Custos fixos cadastrados são mensais; aqui entram proporcionais a {data?.periodo.dias}{" "}
                {data?.periodo.dias === 1 ? "dia" : "dias"} (mensal × dias ÷ 30).
              </p>
            </div>

            {coverage === null ? (
              <p className="text-xs text-muted-foreground">
                Nenhum custo fixo cadastrado. Cadastre em Financeiro → Custos fixos para ver se a loja está no lucro.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${lucroPositivo ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${coverage}%` }}
                  />
                </div>
                <p className={`text-sm font-bold ${lucroPositivo ? "text-emerald-700" : "text-rose-700"}`}>
                  {lucroPositivo
                    ? `Resultado do período: lucro de ${formatBRL(resultado.lucroLiquido)}`
                    : `Resultado do período: prejuízo de ${formatBRL(-resultado.lucroLiquido)}`}
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    o lucro bruto cobre {coverage}% dos custos fixos
                  </span>
                </p>
              </div>
            )}

            {data && data.custosFixosPorItem.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-foreground">Custos fixos por item</p>
                {data.custosFixosPorItem.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 text-xs">
                    <span className="w-24 sm:w-32 truncate text-muted-foreground">{c.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${maxFixed > 0 ? (c.value / maxFixed) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right font-semibold text-foreground whitespace-nowrap">{formatBRL(c.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vazamentos */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Onde a loja está perdendo</h2>
          <p className="text-xs text-muted-foreground">
            Ordenado por gravidade e, dentro dela, por valor em R$. Os valores são estimativas de gestão, não
            contabilidade.
          </p>
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse border border-border" />
          ))
        ) : problems.length === 0 ? (
          <Card className="border border-dashed border-border rounded-2xl p-6 text-center text-xs text-muted-foreground">
            Nenhum problema encontrado neste período.
          </Card>
        ) : (
          <div className="space-y-2">
            {problems.map((item) => (
              <DiagnosisRow key={item.id} item={item} onAction={(url) => navigate(url)} />
            ))}
          </div>
        )}

        {okItems.length > 0 && (
          <details className="rounded-xl border border-border bg-card p-4">
            <summary className="text-xs font-semibold text-muted-foreground cursor-pointer">
              Dentro do esperado ({okItems.length})
            </summary>
            <div className="space-y-2 mt-3">
              {okItems.map((item) => (
                <DiagnosisRow key={item.id} item={item} onAction={(url) => navigate(url)} />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
