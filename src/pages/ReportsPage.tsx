import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Calendar, FilterX, Landmark, Package, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeriodBar } from "@/components/dashboard/PeriodBar";
import { SalesReport } from "@/components/reports/SalesReport";
import { FinancialReport } from "@/components/reports/FinancialReport";
import { ProductsReport } from "@/components/reports/ProductsReport";
import { useDashboardCategories, type DashboardRange } from "@/hooks/useDashboard";
import { COMPARISON_LABEL, describeRange, getPresetRange, type FilterType } from "@/lib/dashboard-range";
import {
  DELIVERY_FILTER_OPTIONS,
  IDLE_DAYS_OPTIONS,
  PAYMENT_FILTER_OPTIONS,
  PAYMENT_STATUS_FILTER_OPTIONS,
  REPORT_TYPES,
  STATUS_FILTER_OPTIONS,
  parseReportType,
  type ReportType,
} from "@/lib/reports-view";
import type { ReportFilters } from "@/services/reports.service";

const TYPE_ICON: Record<ReportType, React.ElementType> = {
  vendas: ShoppingBag,
  financeiro: Landmark,
  produtos: Package,
};

interface ExtraFilters {
  paymentMethod: string;
  deliveryModality: string;
  status: string;
  paymentStatus: string;
  categoryId: string;
}

const NO_EXTRA: ExtraFilters = {
  paymentMethod: "all",
  deliveryModality: "all",
  status: "all",
  paymentStatus: "all",
  categoryId: "all",
};

/** Quais filtros extras cada relatório usa. */
const FILTERS_BY_TYPE: Record<ReportType, (keyof ExtraFilters)[]> = {
  vendas: ["paymentMethod", "deliveryModality", "status", "paymentStatus"],
  financeiro: ["paymentMethod", "deliveryModality", "paymentStatus"],
  produtos: ["categoryId", "paymentMethod"],
};

const SELECT_CLASS =
  "bg-background text-foreground border border-input rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary w-full";

function FilterSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1 min-w-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const isReportQuery = (key: unknown) => typeof key === "string" && key.startsWith("report-");

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = parseReportType(searchParams.get("tipo"));
  const queryClient = useQueryClient();

  // Um só período para os 3 relatórios (relatório pede janelas maiores que o Dashboard: começa em 30 dias).
  const [filter, setFilter] = useState<FilterType>("30days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustom, setAppliedCustom] = useState<DashboardRange | null>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [extra, setExtra] = useState<ExtraFilters>(NO_EXTRA);
  const [idleDays, setIdleDays] = useState<number>(IDLE_DAYS_OPTIONS[1]);

  const { data: categories = [] } = useDashboardCategories();

  const range = useMemo<DashboardRange | null>(
    () => (filter === "custom" ? appliedCustom : getPresetRange(filter)),
    [filter, appliedCustom],
  );

  const activeExtra = FILTERS_BY_TYPE[type];

  // Só entram na consulta os filtros que o relatório aberto usa.
  const filters = useMemo<ReportFilters | null>(() => {
    if (!range) return null;
    const f: ReportFilters = { startDate: range.start, endDate: range.end };
    for (const key of activeExtra) {
      if (extra[key] !== "all") f[key] = extra[key];
    }
    if (type === "produtos") f.idleDays = idleDays;
    return f;
  }, [range, extra, activeExtra, type, idleDays]);

  const activeFilterCount = activeExtra.filter((k) => extra[k] !== "all").length;
  const awaitingCustomDates = filter === "custom" && !appliedCustom;

  const setType = (next: ReportType) => {
    const params = new URLSearchParams(searchParams);
    params.set("tipo", next);
    setSearchParams(params, { replace: true });
  };

  const setExtraValue = (key: keyof ExtraFilters) => (value: string) =>
    setExtra((prev) => ({ ...prev, [key]: value }));

  const handleFilterChange = (next: FilterType) => {
    setFilter(next);
    setShowCustomRange(next === "custom");
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      setAppliedCustom({ start: customStart.split("T")[0], end: customEnd.split("T")[0] });
    }
  };

  const refreshing = useIsFetching({ predicate: (q) => isReportQuery(q.queryKey[0]) }) > 0;
  const refresh = () =>
    void queryClient.invalidateQueries({ predicate: (q) => isReportQuery(q.queryKey[0]) });

  const current = REPORT_TYPES.find((t) => t.id === type)!;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" aria-hidden="true" />
            Relatórios
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {describeRange(filter, range) || "Escolha um período"} · {current.description}
          </p>
        </div>
        <PeriodBar
          filter={filter}
          onFilterChange={handleFilterChange}
          showCustomRange={showCustomRange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          onApplyCustom={handleApplyCustom}
          refreshing={refreshing}
          refreshDisabled={!range || refreshing}
          onRefresh={refresh}
        />
      </div>

      {/* Tipo de relatório */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3" role="tablist" aria-label="Tipo de relatório">
        {REPORT_TYPES.map((t) => {
          const Icon = TYPE_ICON[t.id];
          const active = t.id === type;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setType(t.id)}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 rounded-2xl border p-3 sm:p-4 text-center sm:text-left transition-all ${
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <Icon className={`h-5 w-5 sm:mt-0.5 ${active ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              <span className="min-w-0">
                <span className={`block text-sm font-bold ${active ? "text-foreground" : "text-foreground/80"}`}>{t.label}</span>
                <span className="hidden sm:block text-[11px] text-muted-foreground leading-snug">{t.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros do relatório aberto */}
      <Card className="border border-border rounded-2xl shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-foreground">
              Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </h2>
            {activeFilterCount > 0 && (
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setExtra(NO_EXTRA)}>
                <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
                Limpar filtros
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {activeExtra.includes("categoryId") && (
              <FilterSelect
                label="Categoria"
                value={extra.categoryId}
                onChange={setExtraValue("categoryId")}
                allLabel="Todas as categorias"
                options={categories.map((c) => ({ value: c.id, label: c.title }))}
              />
            )}
            {activeExtra.includes("paymentMethod") && (
              <FilterSelect
                label="Forma de pagamento"
                value={extra.paymentMethod}
                onChange={setExtraValue("paymentMethod")}
                allLabel="Todas"
                options={PAYMENT_FILTER_OPTIONS}
              />
            )}
            {activeExtra.includes("deliveryModality") && (
              <FilterSelect
                label="Entrega"
                value={extra.deliveryModality}
                onChange={setExtraValue("deliveryModality")}
                allLabel="Todas"
                options={DELIVERY_FILTER_OPTIONS}
              />
            )}
            {activeExtra.includes("status") && (
              <FilterSelect
                label="Status do pedido"
                value={extra.status}
                onChange={setExtraValue("status")}
                allLabel="Todos (menos cancelados)"
                options={STATUS_FILTER_OPTIONS}
              />
            )}
            {activeExtra.includes("paymentStatus") && (
              <FilterSelect
                label="Pagamento"
                value={extra.paymentStatus}
                onChange={setExtraValue("paymentStatus")}
                allLabel="Pago e a receber"
                options={PAYMENT_STATUS_FILTER_OPTIONS}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {awaitingCustomDates ? (
        <Card className="border border-dashed border-border rounded-2xl">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Calendar className="h-8 w-8 text-muted-foreground/50" />
            Escolha a data inicial e a final e clique em{" "}
            <span className="font-semibold text-foreground">Aplicar Filtro</span>.
          </CardContent>
        </Card>
      ) : type === "vendas" ? (
        <SalesReport filters={filters} comparisonLabel={COMPARISON_LABEL[filter]} />
      ) : type === "financeiro" ? (
        <FinancialReport filters={filters} />
      ) : (
        <ProductsReport filters={filters} onIdleDaysChange={setIdleDays} />
      )}
    </div>
  );
}
