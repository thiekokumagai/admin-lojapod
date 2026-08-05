import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, CreditCard, Save } from "lucide-react";

export function PaymentSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [pixEnabled, setPixEnabled] = useState(false);
  const [pixKeyType, setPixKeyType] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [pixHolder, setPixHolder] = useState("");

  const [payOnDeliveryCash, setPayOnDeliveryCash] = useState(false);
  const [payOnDeliveryCardDebit, setPayOnDeliveryCardDebit] = useState(false);
  const [payOnDeliveryCardCredit, setPayOnDeliveryCardCredit] = useState(false);

  useEffect(() => {
    if (settings) {
      const cleanVal = (val: string | null | undefined, defaults: string[]) => {
        if (!val) return "";
        const trimmed = val.trim();
        return defaults.some(d => d.toLowerCase() === trimmed.toLowerCase()) ? "" : val;
      };

      setPixEnabled(!!settings.pixEnabled);
      setPixKeyType(settings.pixKeyType || "EMAIL");
      setPixKey(cleanVal(settings.pixKey, ["podemais@email.com"]));
      setPixHolder(cleanVal(settings.pixHolder, ["Pode Mais E-commerce LTDA"]));

      setPayOnDeliveryCash(!!settings.payOnDeliveryCash);
      setPayOnDeliveryCardDebit(!!settings.payOnDeliveryCardDebit);
      setPayOnDeliveryCardCredit(!!settings.payOnDeliveryCardCredit);
    }
  }, [settings]);

  const handleSave = async () => {
    if (pixEnabled && (!pixKey.trim() || !pixHolder.trim())) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Ao ativar o PIX, a chave e o nome do titular são obrigatórios.",
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        pixEnabled,
        pixKeyType,
        pixKey,
        pixHolder,
        payOnDeliveryCash,
        payOnDeliveryCardDebit,
        payOnDeliveryCardCredit,
      });

      toast({
        title: "Formas de pagamento salvas!",
        description: "As preferências de pagamento foram sincronizadas com sucesso.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Falha ao atualizar as configurações de recebimento.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-muted-foreground">
          Carregando meios de pagamento...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Formas de Recebimento</h2>
          <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* PIX Online */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <div>
                <Label className="font-semibold text-base cursor-pointer" onClick={() => setPixEnabled(!pixEnabled)}>
                  Recebimento via PIX
                </Label>
                <p className="text-xs text-muted-foreground">Ative o pagamento via PIX copia e cola automático</p>
              </div>
            </div>
            <Switch checked={pixEnabled} onCheckedChange={setPixEnabled} />
          </div>

          {pixEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div>
                <Label className="font-medium text-xs">Tipo de Chave</Label>
                <Select value={pixKeyType || "EMAIL"} onValueChange={setPixKeyType}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF_CNPJ">CPF / CNPJ</SelectItem>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="PHONE">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-medium text-xs">Chave PIX</Label>
                <Input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Insira sua chave Pix"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label className="font-medium text-xs">Nome do Titular da Conta</Label>
                <Input
                  value={pixHolder}
                  onChange={(e) => setPixHolder(e.target.value)}
                  placeholder="Nome completo do titular"
                  className="mt-1 h-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Entrega Presencial */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <Label className="font-semibold text-base">Pagamento Presencial (Entrega)</Label>
              <p className="text-xs text-muted-foreground">Selecione as opções de maquininha e dinheiro aceitas na entrega</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <span className="text-sm font-medium">Dinheiro</span>
              <Switch checked={payOnDeliveryCash} onCheckedChange={setPayOnDeliveryCash} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <span className="text-sm font-medium">Cartão de Débito</span>
              <Switch checked={payOnDeliveryCardDebit} onCheckedChange={setPayOnDeliveryCardDebit} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <span className="text-sm font-medium">Cartão de Crédito</span>
              <Switch checked={payOnDeliveryCardCredit} onCheckedChange={setPayOnDeliveryCardCredit} />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
