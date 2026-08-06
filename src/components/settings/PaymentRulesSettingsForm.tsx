import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { PaymentRule } from "@/types/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Percent, Settings, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function PaymentRulesSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [rules, setRules] = useState<PaymentRule[]>([]);

  useEffect(() => {
    if (settings) {
      setRules(settings.paymentRules || []);
    }
  }, [settings]);

  const handleAddRule = () => {
    const newRule: PaymentRule = {
      id: Math.random().toString(36).substring(2, 9),
      paymentMethod: "pix",
      type: "discount",
      value: 0,
      passedToCustomer: true,
    };
    setRules((prev) => [...prev, newRule]);
    toast({ title: "Nova regra adicionada!" });
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Regra removida." });
  };

  const handleUpdateRule = <K extends keyof PaymentRule>(
    id: string,
    key: K,
    val: PaymentRule[K]
  ) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: val };
        
        if (key === "paymentMethod") {
          if (val === "credit") {
            updated.type = "charge"; // Juros é sempre um acréscimo (charge)
            updated.parcelaMin = updated.parcelaMin ?? 2;
            updated.parcelaMax = updated.parcelaMax ?? 3;
            updated.passedToCustomer = updated.passedToCustomer ?? true;
            delete updated.maxInstallments;
          } else {
            delete updated.parcelaMin;
            delete updated.parcelaMax;
            delete updated.maxInstallments;
          }
        }

        if (key === "type") {
           if (val === "charge") {
             updated.passedToCustomer = updated.passedToCustomer ?? true;
           } else {
             delete updated.passedToCustomer;
           }
        }

        return updated;
      })
    );
  };

  const formatPercentVal = (val: number): string => {
    if (val === 0) return "";
    return val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePercentChange = (id: string, rawVal: string) => {
    const digits = rawVal.replace(/\D/g, "");
    const num = digits ? Number(digits) / 100 : 0;
    handleUpdateRule(id, "value", num);
  };

  const handleSave = async () => {
    // Validar se há alguma regra sem valor ou inconsistente
    for (const rule of rules) {
      if (rule.value < 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Os valores de desconto ou taxa devem ser maiores ou iguais a 0.",
        });
        return;
      }

      if (rule.paymentMethod === "credit") {
        const min = rule.parcelaMin !== undefined ? rule.parcelaMin : 2;
        const max = rule.parcelaMax !== undefined ? rule.parcelaMax : 3;

        if (min < 1 || max < 1) {
          toast({
            variant: "destructive",
            title: "Parcelamento inválido",
            description: "As parcelas mínima e máxima devem ser maiores ou iguais a 1.",
          });
          return;
        }

        if (max < min) {
          toast({
            variant: "destructive",
            title: "Intervalo inválido",
            description: "A parcela limite máxima não pode ser menor que a mínima.",
          });
          return;
        }
      }
    }

    try {
      await updateSettingsMutation.mutateAsync({
        paymentRules: rules,
      });

      toast({
        title: "Regras dinâmicas salvas!",
        description: "Suas regras de desconto, taxa e parcelas de juros foram salvas com sucesso.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Falha ao salvar as regras de pagamentos.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-muted-foreground">
          Carregando regras de taxas e descontos...
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
              <Settings className="h-5 w-5 text-primary" />
              Descontos, Taxas e Parcelas
            </h2>
            <p className="text-xs text-muted-foreground">
              Adicione regras de desconto, taxas e juros de parcelas para as formas de pagamento.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button size="sm" variant="outline" onClick={handleAddRule} className="flex-1 md:flex-none">
              <Plus className="h-4 w-4 mr-1" />
              Nova Regra
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending} className="flex-1 md:flex-none">
              <Save className="h-4 w-4 mr-1" />
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
            <Percent className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma regra ativa criada</p>
            <p className="text-xs text-muted-foreground">Clique em "Nova Configuração" para iniciar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b">
              <div className="col-span-3">Forma de Pagamento</div>
              <div className="col-span-2">Ação (Desc/Taxa)</div>
              <div className="col-span-1">Valor (%)</div>
              <div className="col-span-3">Parcelamento (De / Até)</div>
              <div className="col-span-2 text-center">Repassar Cliente?</div>
              <div className="col-span-1 text-right"></div>
            </div>

            <div className="space-y-3">
              {[...rules].sort((a, b) => {
                const methodOrder: Record<string, number> = { pix: 1, cash: 2, debit: 3, credit: 4 };
                const orderA = methodOrder[a.paymentMethod] || 99;
                const orderB = methodOrder[b.paymentMethod] || 99;
                if (orderA !== orderB) return orderA - orderB;
                if (a.paymentMethod === "credit" && b.paymentMethod === "credit") {
                  return (a.parcelaMin || 0) - (b.parcelaMin || 0);
                }
                return 0;
              }).map((rule) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-2 sm:grid-cols-12 gap-4 p-4 rounded-lg border bg-slate-50/50 sm:bg-transparent sm:p-0 sm:border-none sm:rounded-none items-start sm:items-center relative"
                >
                  {/* Forma de Pagamento */}
                  <div className="col-span-2 sm:col-span-3">
                    <Label className="sm:hidden text-[10px] uppercase font-semibold text-muted-foreground mb-1">Forma de Pagamento</Label>
                    <Select
                      value={rule.paymentMethod}
                      onValueChange={(val) => handleUpdateRule(rule.id, "paymentMethod", val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="debit">Cartão de Débito (Maquininha)</SelectItem>
                        <SelectItem value="credit">Cartão de Crédito (Maquininha)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de Ação */}
                  <div className="col-span-1 sm:col-span-2">
                    <Label className="sm:hidden text-[10px] uppercase font-semibold text-muted-foreground mb-1">Ação</Label>
                    {rule.paymentMethod === "credit" ? (
                      <div className="h-9 flex items-center px-3 bg-muted/20 border rounded-md text-xs text-muted-foreground select-none font-semibold">
                        Juros
                      </div>
                    ) : (
                      <Select
                        value={rule.type}
                        onValueChange={(val: 'discount' | 'charge') => handleUpdateRule(rule.id, "type", val)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Desconto</SelectItem>
                          <SelectItem value="charge">Taxa</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Valor (%) */}
                  <div className="col-span-1 sm:col-span-1">
                    <Label className="sm:hidden text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                      {rule.paymentMethod === "credit" ? "Juros (%)" : "Valor (%)"}
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatPercentVal(rule.value)}
                        onChange={(e) => handlePercentChange(rule.id, e.target.value)}
                        className="h-9 pr-6 font-semibold"
                        placeholder="0,00"
                      />
                      <span className="absolute right-2 top-2 text-xs font-semibold text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Parcelas (De / Até - Específico para Juros de Crédito) */}
                  <div className="col-span-2 sm:col-span-3">
                    <Label className="sm:hidden text-[10px] uppercase font-semibold text-muted-foreground mb-1">Parcelamento</Label>
                    {rule.paymentMethod === "credit" ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 w-1/2">
                          <span className="text-[10px] text-muted-foreground font-semibold">De</span>
                          <Input
                            type="number"
                            min="1"
                            placeholder="De"
                            value={rule.parcelaMin === 0 || rule.parcelaMin === undefined ? "" : rule.parcelaMin}
                            onChange={(e) => handleUpdateRule(rule.id, "parcelaMin", e.target.value === "" ? 0 : Number(e.target.value))}
                            className="h-9 px-2 text-center font-semibold"
                          />
                        </div>
                        <div className="flex items-center gap-1 w-1/2">
                          <span className="text-[10px] text-muted-foreground font-semibold">Até</span>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Até"
                            value={rule.parcelaMax === 0 || rule.parcelaMax === undefined ? "" : rule.parcelaMax}
                            onChange={(e) => handleUpdateRule(rule.id, "parcelaMax", e.target.value === "" ? 0 : Number(e.target.value))}
                            className="h-9 px-2 text-center font-semibold"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-9 flex items-center px-3 bg-muted/20 border rounded-md text-xs text-muted-foreground select-none">
                        Não aplicável
                      </div>
                    )}
                  </div>

                  {/* Repassar para o cliente? */}
                  <div className="col-span-2 sm:col-span-2 flex justify-between sm:justify-center items-center">
                    <Label className="sm:hidden text-[10px] uppercase font-semibold text-muted-foreground">Repassar Cliente?</Label>
                    {rule.type === "charge" ? (
                      <div className="h-9 flex items-center">
                        <Switch
                          checked={rule.passedToCustomer !== false}
                          onCheckedChange={(checked) => handleUpdateRule(rule.id, "passedToCustomer", checked)}
                        />
                      </div>
                    ) : (
                       <span className="text-xs text-muted-foreground opacity-50 hidden sm:block">-</span>
                    )}
                  </div>

                  {/* Exclusão */}
                  <div className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 col-span-2 sm:col-span-1 text-right flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive h-8 w-8 sm:h-9 sm:w-9 hover:bg-destructive/10 bg-white sm:bg-transparent border sm:border-0 shadow-sm sm:shadow-none"
                      onClick={() => handleRemoveRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
