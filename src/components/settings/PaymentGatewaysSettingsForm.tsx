import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, Save, Copy, ExternalLink, Zap, ShieldCheck } from "lucide-react";

export function PaymentGatewaysSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  // InfinitePay state
  const [infinitePayEnabled, setInfinitePayEnabled] = useState(false);
  const [infinitePayHandle, setInfinitePayHandle] = useState("");
  const [infinitePayApiKey, setInfinitePayApiKey] = useState("");
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    if (settings) {
      const gateways = (settings as any).paymentGateways || {};
      const ip = gateways.infinitepay || {};

      setInfinitePayEnabled(!!ip.enabled && !!ip.acceptCreditCard);
      setInfinitePayHandle(ip.handle || "");
      setInfinitePayApiKey(ip.apiKey || "");
    }
  }, [settings]);

  // Webhook URL para a loja copiar
  const webhookUrl = `${import.meta.env.VITE_ADMIN_API || "https://api.lojapod.com"}/payments/webhook/infinitepay`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast({
      title: "URL copiada!",
      description: "Cole esta URL nas configurações de Webhook do seu painel InfinitePay.",
    });
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleSave = async () => {
    if (infinitePayEnabled && !infinitePayHandle.trim()) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Informe a sua InfiniteTag / Handle da loja para habilitar o pagamento online.",
      });
      return;
    }

    try {
      const currentGateways = (settings as any)?.paymentGateways || {};

      const updatedGateways = {
        ...currentGateways,
        infinitepay: {
          enabled: infinitePayEnabled,
          acceptCreditCard: infinitePayEnabled,
          handle: infinitePayHandle.trim().replace(/^@/, ""),
          apiKey: infinitePayApiKey.trim(),
        },
      };

      await updateSettingsMutation.mutateAsync({
        paymentGateways: updatedGateways,
      } as any);

      toast({
        title: "Integração salva!",
        description: "As configurações do gateway InfinitePay foram atualizadas com sucesso.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Falha ao salvar as configurações de pagamento online.",
      });
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                InfinitePay (Cartão de Crédito Online)
                <Badge variant={infinitePayEnabled ? "default" : "outline"} className="text-xs">
                  {infinitePayEnabled ? "Ativo na Loja" : "Desativado"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Receba pagamentos com cartão de crédito diretamente pela InfinitePay mantendo o cartão presencial na maquininha disponível.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Toggle Ativação */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary" />
              Habilitar Cartão de Crédito Online
            </Label>
            <p className="text-xs text-muted-foreground">
              Disponibiliza a opção de passar o cartão no checkout seguro da InfinitePay para os seus clientes.
            </p>
          </div>
          <Switch
            checked={infinitePayEnabled}
            onCheckedChange={setInfinitePayEnabled}
          />
        </div>

        {/* Campos de Credenciais (Aparecem somente quando o switch estiver ativado) */}
        {infinitePayEnabled && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  InfiniteTag / Handle da Loja <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={infinitePayHandle}
                  onChange={(e) => setInfinitePayHandle(e.target.value)}
                  placeholder="Ex: minha_loja"
                  className="h-9"
                />
                <p className="text-[11px] text-muted-foreground">
                  Sua tag cadastrada no app da InfinitePay (sem o @).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  API Key (Chave Secreta) <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <Input
                  type="password"
                  value={infinitePayApiKey}
                  onChange={(e) => setInfinitePayApiKey(e.target.value)}
                  placeholder="inchk_..."
                  className="h-9"
                />
                <p className="text-[11px] text-muted-foreground">
                  Chave de API gerada na aba de Checkout Integrado no aplicativo InfinitePay.
                </p>
              </div>
            </div>

            {/* Webhook URL Helper */}
            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  URL de Webhook (Notificação Automática)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedWebhook ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <code className="text-[11px] bg-background px-2.5 py-1.5 rounded border block select-all text-muted-foreground overflow-x-auto">
                {webhookUrl}
              </code>
              <p className="text-[11px] text-muted-foreground">
                Cadastre essa URL nas configurações de Webhooks da InfinitePay para atualizar automaticamente o pedido quando o pagamento for aprovado.
              </p>
            </div>
          </div>
        )}

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending || isLoading}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Integração"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
