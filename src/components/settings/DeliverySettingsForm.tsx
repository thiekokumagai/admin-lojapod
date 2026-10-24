import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  MapPin, 
  Save, 
  Truck, 
  Gift, 
  Store, 
  DollarSign,
  Route
} from "lucide-react";

interface RangeItem {
  id: string;
  distancia: number;
  valor: number;
}

export function DeliverySettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  // Tipo de Frete Principal
  // "DISTANCE" (Faixas/Rota), "FIXED_FEE" (Fixo), "NO_FEE" (Grátis Sempre), "TO_COMBINE" (A Combinar)
  const [deliveryType, setDeliveryType] = useState<string>("DISTANCE");
  const [deliveryFixedFee, setDeliveryFixedFee] = useState<string>("");

  // Frete Grátis acima de um valor
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingMinValue, setFreeShippingMinValue] = useState<string>("");

  // Retirada na Loja
  const [storePickupEnabled, setStorePickupEnabled] = useState(false);

  // Frete por Distância
  const [originCep, setOriginCep] = useState("");
  const [originNumber, setOriginNumber] = useState("");
  const [ranges, setRanges] = useState<RangeItem[]>([]);
  const [allowAboveMax, setAllowAboveMax] = useState(false);
  const [maxDeliveryKm, setMaxDeliveryKm] = useState<string>("");

  const [newDist, setNewDist] = useState("");
  const [newVal, setNewVal] = useState("");

  // Carregar dados reais da API
  useEffect(() => {
    if (settings) {
      setDeliveryType(settings.deliveryType || "DISTANCE");
      setDeliveryFixedFee(
        settings.deliveryFixedFee !== undefined && settings.deliveryFixedFee !== null
          ? String(settings.deliveryFixedFee)
          : ""
      );

      setFreeShippingEnabled(!!settings.freeShippingEnabled);
      setFreeShippingMinValue(
        settings.freeShippingMinValue !== undefined && settings.freeShippingMinValue !== null
          ? String(settings.freeShippingMinValue)
          : ""
      );

      setStorePickupEnabled(!!settings.storePickupEnabled);

      setOriginCep(settings.deliveryOriginCep || "");
      setOriginNumber(settings.deliveryOriginNumber || "");

      const savedRanges = settings.deliveryRanges;
      if (savedRanges && typeof savedRanges === "object") {
        setRanges(savedRanges.ranges || []);
        setAllowAboveMax(!!savedRanges.allowAboveMax);
        setMaxDeliveryKm(
          savedRanges.maxDeliveryKm !== undefined && savedRanges.maxDeliveryKm !== null
            ? String(savedRanges.maxDeliveryKm)
            : ""
        );
      } else {
        setRanges([]);
        setAllowAboveMax(false);
        setMaxDeliveryKm("");
      }
    }
  }, [settings]);

  // Formatar CEP
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .substring(0, 9);
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOriginCep(formatCEP(e.target.value));
  };

  // Formatador de Moeda para inputs (exibe 1.500,00 e armazena 1500.00)
  const formatCurrencyInput = (val: string | number) => {
    if (val === "" || val === null || val === undefined) return "";
    const num = typeof val === "number" ? val : Number(val);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleCurrencyInputChange = (rawValue: string, setter: (val: string) => void) => {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      setter("");
      return;
    }
    const cents = Number(digits) / 100;
    setter(cents.toString());
  };

  // Adicionar faixa de distância
  const handleAdd = () => {
    const dist = Number(newDist);
    const val = Number(newVal);

    if (!dist || dist <= 0) {
      toast({
        variant: "destructive",
        title: "Distância inválida",
        description: "A distância deve ser maior que zero.",
      });
      return;
    }

    if (val < 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "O valor da taxa de entrega não pode ser negativo.",
      });
      return;
    }

    if (ranges.some((r) => r.distancia === dist)) {
      toast({
        variant: "destructive",
        title: "Distância já cadastrada",
        description: "Já existe uma taxa cadastrada para esta distância limite.",
      });
      return;
    }

    const newRange: RangeItem = {
      id: Math.random().toString(36).substring(2, 9),
      distancia: dist,
      valor: val,
    };

    setRanges((prev) => [...prev, newRange].sort((a, b) => a.distancia - b.distancia));
    setNewDist("");
    setNewVal("");
    toast({ title: "Faixa de frete adicionada!" });
  };

  const handleUpdateRange = (id: string, field: "distancia" | "valor", value: number) => {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  const handleDelete = (id: string) => {
    setRanges((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Faixa de frete removida." });
  };

  // Salvar no backend
  const handleSave = async () => {
    const cleanCep = originCep.replace(/\D/g, "");
    if (cleanCep && cleanCep.length !== 8) {
      toast({
        variant: "destructive",
        title: "CEP de Origem inválido",
        description: "O CEP de origem deve possuir 8 algarismos para cálculo por rota.",
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        deliveryType,
        deliveryFixedFee: deliveryType === "FIXED_FEE" && deliveryFixedFee ? Number(deliveryFixedFee) : null,
        freeShippingEnabled,
        freeShippingMinValue: freeShippingEnabled && freeShippingMinValue ? Number(freeShippingMinValue) : null,
        storePickupEnabled,
        deliveryOriginCep: originCep.trim() || null,
        deliveryOriginNumber: originNumber.trim() || null,
        deliveryRanges: {
          ranges,
          allowAboveMax,
          maxDeliveryKm: maxDeliveryKm ? Number(maxDeliveryKm) : null,
        },
      } as any);

      toast({
        title: "Configurações de frete salvas!",
        description: "As preferências de frete e entrega foram atualizadas com sucesso.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Falha ao salvar as configurações de frete.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground animate-pulse">Carregando configurações de frete...</p>
        </CardContent>
      </Card>
    );
  }

  const maxDistance = ranges.length > 0 ? Math.max(...ranges.map((r) => r.distancia)) : 0;

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Cabeçalho superior com Salvar */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Modalidades de Frete &amp; Entrega</h2>
              <p className="text-xs text-muted-foreground">Configure como o valor da entrega será calculado para o cliente</p>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>

        {/* 1. Ponto de Partida / Origem do Frete (Geral para cálculo de rota e limites) */}
        <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Ponto de Partida / Origem do Frete
            </h3>
            <p className="text-xs text-muted-foreground">
              Utilizado para medir a rota até a residência do cliente e validar limites de distância em todos os fretes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md pt-1">
            <div className="space-y-1.5">
              <Label className="font-medium text-xs">CEP de Origem</Label>
              <Input
                value={originCep}
                onChange={handleCEPChange}
                placeholder="00000-000"
                className="font-medium h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-xs">Número do Endereço</Label>
              <Input
                value={originNumber}
                onChange={(e) => setOriginNumber(e.target.value)}
                placeholder="Ex: 123"
                className="font-medium h-9"
              />
            </div>
          </div>
        </div>

        {/* 2. Escolha do Modelo de Frete Principal */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Modelo de Cobrança de Frete</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Frete por Distância */}
            <div
              onClick={() => setDeliveryType("DISTANCE")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                deliveryType === "DISTANCE"
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "hover:border-slate-300 bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Route className={`h-4 w-4 ${deliveryType === "DISTANCE" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-bold">Por Rota / Distância</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Calcula a taxa por km com base nas faixas cadastradas.
              </p>
            </div>

            {/* Frete Fixo */}
            <div
              onClick={() => setDeliveryType("FIXED_FEE")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                deliveryType === "FIXED_FEE"
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "hover:border-slate-300 bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <DollarSign className={`h-4 w-4 ${deliveryType === "FIXED_FEE" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-bold">Frete Fixo</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cobra o mesmo valor de entrega para qualquer pedido.
              </p>
            </div>

            {/* Frete Grátis Sempre */}
            <div
              onClick={() => setDeliveryType("NO_FEE")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                deliveryType === "NO_FEE"
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "hover:border-slate-300 bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Gift className={`h-4 w-4 ${deliveryType === "NO_FEE" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-bold">Frete Grátis Sempre</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Entrega 100% gratuita para todos os clientes.
              </p>
            </div>

            {/* Frete a Combinar */}
            <div
              onClick={() => setDeliveryType("TO_COMBINE")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                deliveryType === "TO_COMBINE"
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "hover:border-slate-300 bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className={`h-4 w-4 ${deliveryType === "TO_COMBINE" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-bold">Frete a Combinar</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                O valor é alinhado diretamente com o cliente pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Campo específico para Frete Fixo */}
        {deliveryType === "FIXED_FEE" && (
          <div className="p-4 rounded-xl border bg-primary/5 max-w-sm space-y-2 animate-in fade-in">
            <Label className="text-xs font-semibold">Valor da Taxa Fixa de Entrega (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">R$</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
                value={formatCurrencyInput(deliveryFixedFee)}
                onChange={(e) => handleCurrencyInputChange(e.target.value, setDeliveryFixedFee)}
                placeholder="10,00"
                className="pl-9 font-semibold h-9"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Este valor será somado a todos os pedidos com entrega.</p>
          </div>
        )}

        {/* 2. Regra de Frete Grátis a Partir de Valor */}
        <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-600" />
                Frete Grátis a Partir de um Valor
              </Label>
              <p className="text-xs text-muted-foreground">
                Isenta o frete automaticamente quando o valor dos produtos atingir o mínimo.
              </p>
            </div>
            <Switch
              checked={freeShippingEnabled}
              onCheckedChange={setFreeShippingEnabled}
            />
          </div>

          {freeShippingEnabled && (
            <div className="pt-3 border-t max-w-xs space-y-1.5 animate-in fade-in">
              <Label className="text-xs font-semibold">Valor Mínimo do Pedido (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">R$</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  value={formatCurrencyInput(freeShippingMinValue)}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setFreeShippingMinValue)}
                  placeholder="150,00"
                  className="pl-9 font-semibold h-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Compras com valor igual ou superior a este ganham frete grátis.
              </p>
            </div>
          )}
        </div>

        {/* 3. Retirada na Loja */}
        <div className="p-4 rounded-xl border bg-muted/20 flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Permitir Retirada no Local / Loja Física
            </Label>
            <p className="text-xs text-muted-foreground">
              O cliente poderá optar por buscar o pedido diretamente no endereço da loja (sem custo de entrega).
            </p>
          </div>
          <Switch
            checked={storePickupEnabled}
            onCheckedChange={setStorePickupEnabled}
          />
        </div>

        {/* 4. Restrições Gerais de Entrega (Aparece em TODOS os tipos de frete) */}
        <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Label className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Raio Máximo de Entrega Permitido (km)
            </Label>
            <p className="text-xs text-muted-foreground">
              {ranges.length > 0
                ? `Deixe vazio para usar automaticamente a maior distância cadastrada na tabela (${maxDistance} km).`
                : "Informe o raio máximo em km para limitar as entregas. Válido para qualquer tipo de frete."}
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              value={maxDeliveryKm}
              onChange={(e) => setMaxDeliveryKm(e.target.value.replace(/\D/g, ""))}
              placeholder={ranges.length > 0 ? String(maxDistance) : "Ex: 20"}
              className="w-20 h-9 font-semibold text-center"
            />
            <span className="text-xs font-semibold text-muted-foreground">km</span>
          </div>
        </div>

        {/* 5. Configurações por Distância (Aparece se deliveryType === "DISTANCE") */}
        {deliveryType === "DISTANCE" && (
          <div className="space-y-6 pt-4 border-t animate-in fade-in">
            {/* Tabela de Faixas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Faixas de Distância e Valores
              </h3>

              <div className="border rounded-lg overflow-hidden bg-muted/10">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Distância Limite (km)</TableHead>
                      <TableHead className="font-semibold">Valor da Taxa (R$)</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          Nenhuma faixa cadastrada. Adicione faixas abaixo.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ranges.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/10">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium">Até</span>
                              <Input
                                type="number"
                                value={r.distancia}
                                onChange={(e) => handleUpdateRange(r.id, "distancia", Number(e.target.value))}
                                className="w-20 h-9 font-medium"
                              />
                              <span className="text-xs text-muted-foreground font-medium">km</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="relative w-32">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="tel"
                                value={formatCurrencyInput(r.valor)}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, "");
                                  handleUpdateRange(r.id, "valor", digits ? Number(digits) / 100 : 0);
                                }}
                                className="pl-9 h-9 font-semibold"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive h-8 w-8 hover:bg-destructive/10"
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {/* Formulário Inline de Inserção */}
                    <TableRow className="bg-muted/10 border-t-2">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="tel"
                            placeholder="Ex: 5"
                            value={newDist}
                            onChange={(e) => setNewDist(e.target.value.replace(/\D/g, ""))}
                            className="w-24 h-9"
                          />
                          <span className="text-xs text-muted-foreground font-medium">km</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="tel"
                            placeholder="Ex: 8,50"
                            value={newVal !== "" ? formatCurrencyInput(newVal) : ""}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");
                              setNewVal(digits ? (Number(digits) / 100).toString() : "");
                            }}
                            className="w-full h-9 pl-9"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAdd}
                          className="h-9 w-9 p-0 flex items-center justify-center border-dashed hover:border-solid"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar no Rodapé */}
        <div className="flex justify-end pt-6 border-t mt-6">
          <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
