import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Clock, Save } from "lucide-react";

export interface BusinessHourInterval {
  open: string;
  close: string;
}

export interface BusinessHourRule {
  id: string;
  days: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  intervals: BusinessHourInterval[];
}

const WEEKDAYS = [
  { value: 0, label: "D" },
  { value: 1, label: "S" },
  { value: 2, label: "T" },
  { value: 3, label: "Q" },
  { value: 4, label: "Q" },
  { value: 5, label: "S" },
  { value: 6, label: "S" },
];

export function BusinessHoursSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [rules, setRules] = useState<BusinessHourRule[]>([]);

  useEffect(() => {
    if (settings && settings.businessHours) {
      setRules(settings.businessHours);
    } else if (settings && !settings.businessHours) {
      setRules([]);
    }
  }, [settings]);

  const handleAddRule = () => {
    const newRule: BusinessHourRule = {
      id: Math.random().toString(36).substring(2, 9),
      days: [],
      intervals: [{ open: "08:00", close: "18:00" }],
    };
    setRules((prev) => [...prev, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleDay = (ruleId: string, dayValue: number) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const newDays = r.days.includes(dayValue)
          ? r.days.filter((d) => d !== dayValue)
          : [...r.days, dayValue];
        return { ...r, days: newDays };
      })
    );
  };

  const handleAddInterval = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          intervals: [...r.intervals, { open: "08:00", close: "18:00" }],
        };
      })
    );
  };

  const handleRemoveInterval = (ruleId: string, index: number) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const newIntervals = [...r.intervals];
        newIntervals.splice(index, 1);
        return { ...r, intervals: newIntervals };
      })
    );
  };

  const handleIntervalChange = (
    ruleId: string,
    index: number,
    field: "open" | "close",
    val: string
  ) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const newIntervals = [...r.intervals];
        newIntervals[index][field] = val;
        return { ...r, intervals: newIntervals };
      })
    );
  };

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        businessHours: rules,
      });
      toast({
        title: "Horários salvos!",
        description: "Suas configurações de horário de atendimento foram salvas.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Falha ao salvar os horários.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-muted-foreground">
          Carregando horários de atendimento...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Horário de Atendimento
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure os dias e horários que a sua loja funciona.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending} className="flex-1 md:flex-none">
              <Save className="h-4 w-4 mr-1" />
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum horário configurado</p>
            <p className="text-xs text-muted-foreground">Clique em "Adicionar regra" para iniciar.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rules.map((rule) => (
              <div key={rule.id} className="border p-4 rounded-xl space-y-4 relative bg-slate-50/50">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Selecione os dias</Label>
                  <div className="flex gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = rule.days.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(rule.id, day.value)}
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {rule.intervals.map((interval, index) => (
                    <div key={index} className="flex items-end gap-3">
                      <div className="space-y-1 flex-1 max-w-[150px]">
                        <Label className="text-xs text-muted-foreground">Abre</Label>
                        <Input
                          type="time"
                          value={interval.open}
                          onChange={(e) => handleIntervalChange(rule.id, index, "open", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 flex-1 max-w-[150px]">
                        <Label className="text-xs text-muted-foreground">Fecha</Label>
                        <Input
                          type="time"
                          value={interval.close}
                          onChange={(e) => handleIntervalChange(rule.id, index, "close", e.target.value)}
                        />
                      </div>
                      {rule.intervals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-destructive mb-0.5 hover:bg-destructive/10"
                          onClick={() => handleRemoveInterval(rule.id, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary mt-2"
                  onClick={() => handleAddInterval(rule.id)}
                >
                  Adicionar outro intervalo
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-6 border-t mt-6">
          <Button size="sm" variant="outline" onClick={handleAddRule}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Configuração
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
