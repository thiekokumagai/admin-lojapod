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
import { Plus, Trash2, AlertTriangle, MapPin, Save } from "lucide-react";

interface RangeItem {
  id: string;
  distancia: number;
  valor: number;
}

export function DeliverySettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [originCep, setOriginCep] = useState("");
  const [originNumber, setOriginNumber] = useState("");
  const [ranges, setRanges] = useState<RangeItem[]>([]);
  const [allowAboveMax, setAllowAboveMax] = useState(false);

  const [newDist, setNewDist] = useState("");
  const [newVal, setNewVal] = useState("");

  // Carregar dados reais da API
  useEffect(() => {
    if (settings) {
      setOriginCep(settings.deliveryOriginCep || "");
      setOriginNumber(settings.deliveryOriginNumber || "");
      
      const savedRanges = settings.deliveryRanges;
      if (savedRanges && typeof savedRanges === "object") {
        setRanges(savedRanges.ranges || []);
        setAllowAboveMax(!!savedRanges.allowAboveMax);
      } else {
        setRanges([]);
        setAllowAboveMax(false);
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

    // Evitar distâncias duplicadas
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

    // Ordenar as faixas automaticamente por distância
    setRanges((prev) => [...prev, newRange].sort((a, b) => a.distancia - b.distancia));
    setNewDist("");
    setNewVal("");
    toast({ title: "Faixa de frete adicionada!" });
  };

  // Remover faixa
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
        description: "O CEP de origem deve possuir 8 algarismos.",
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        deliveryOriginCep: originCep.trim() || null,
        deliveryOriginNumber: originNumber.trim() || null,
        deliveryRanges: {
          ranges,
          allowAboveMax,
        },
      });

      toast({
        title: "Configurações de frete atualizadas!",
        description: "Os dados de entrega foram salvos com sucesso.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Falha ao salvar as configurações de frete.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-muted-foreground">
          Carregando dados de entrega...
        </CardContent>
      </Card>
    );
  }

  // Maior distância cadastrada
  const maxDistance = ranges.length > 0 ? Math.max(...ranges.map((r) => r.distancia)) : 0;

  return (
    <Card>
      <CardContent className="p-5 space-y-6">
        {/* Cabeçalho superior com Salvar */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Configurações de Frete &amp; Entrega
          </h2>
          <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* Endereço de Origem */}
        <div className="space-y-4 border-b pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <Label className="font-medium text-xs">CEP de Origem</Label>
              <Input
                value={originCep}
                onChange={handleCEPChange}
                placeholder="00000-000"
                className="font-medium h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-xs">Número do Endereço</Label>
              <Input
                value={originNumber}
                onChange={(e) => setOriginNumber(e.target.value)}
                placeholder="Ex: 123"
                className="font-medium h-9"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Deixe em branco se a sua loja não possuir dados de origem cadastrados.
          </p>
        </div>

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
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">Até {r.distancia} km</TableCell>
                      <TableCell className="font-semibold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        }).format(r.valor)}
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
                        type="number"
                        placeholder="Ex: 5"
                        value={newDist}
                        onChange={(e) => setNewDist(e.target.value)}
                        className="w-24 h-9"
                      />
                      <span className="text-xs text-muted-foreground font-medium">km</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                      <Input
                        placeholder="Ex: 8,50"
                        value={newVal !== "" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(newVal)) : ""}
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

        {/* Regra Acima do Limite */}
        {ranges.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="p-4 border rounded-lg bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-200">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${allowAboveMax ? "text-amber-500" : "text-destructive"}`} />
                  Entregas acima de {maxDistance} km (Fora do Raio Máximo)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Defina se aceita ou recusa pedidos com distância superior a {maxDistance} km.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={allowAboveMax} onCheckedChange={setAllowAboveMax} />
                <span className={`text-sm font-semibold transition-colors duration-200 ${allowAboveMax ? "text-primary" : "text-destructive font-bold"}`}>
                  {allowAboveMax ? "Permitir Entregas" : "Não Permitir Entregas"}
                </span>
              </div>
            </div>

            {/* Aviso visual correspondente */}
            {!allowAboveMax ? (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertDescription className="font-semibold text-xs flex items-center gap-1.5">
                  <span>🚫</span>
                  <strong>Bloqueio Ativo:</strong> Pedidos com distância acima de {maxDistance} km serão marcados como indisponíveis para entrega no fechamento da compra.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-600 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertDescription className="font-medium text-xs flex items-center gap-1.5">
                  <span>⚠️</span>
                  <strong>Atenção:</strong> Clientes acima de {maxDistance} km conseguirão efetuar compras. A taxa de frete cobrada precisará ser acordada manualmente.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Botão Salvar no Rodapé */}
        <div className="flex justify-end pt-6 border-t mt-6">
          <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
