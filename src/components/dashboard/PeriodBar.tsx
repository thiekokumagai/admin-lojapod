import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { FILTER_OPTIONS, type FilterType } from "@/lib/dashboard-range";

interface PeriodBarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  showCustomRange: boolean;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  onApplyCustom: () => void;
  refreshing: boolean;
  refreshDisabled: boolean;
  onRefresh: () => void;
}

/** Filtro de período único: vale para Resumo, Produtos e Diagnóstico. */
export function PeriodBar({
  filter,
  onFilterChange,
  showCustomRange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  onApplyCustom,
  refreshing,
  refreshDisabled,
  onRefresh,
}: PeriodBarProps) {
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 lg:flex-none flex-wrap items-center gap-1.5 p-1 bg-muted rounded-xl border border-border"
          role="group"
          aria-label="Período"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onFilterChange(opt.id)}
              aria-pressed={filter === opt.id}
              className={chip(filter === opt.id)}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onFilterChange("custom")}
            aria-pressed={filter === "custom"}
            className={`${chip(filter === "custom")} flex items-center gap-1`}
          >
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Datas
          </button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={refreshDisabled}
          aria-label="Atualizar dados"
          title="Atualizar"
          className="rounded-xl border border-border shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {showCustomRange && (
        <Card className="bg-card border border-border rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onApplyCustom();
              }}
              className="flex flex-col sm:flex-row items-end gap-3"
            >
              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
                  <DatePicker
                    value={customStart}
                    onChange={onCustomStartChange}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data Final</label>
                  <DatePicker
                    value={customEnd}
                    onChange={onCustomEndChange}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto rounded-xl">
                Aplicar Filtro
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
