import { useEffect, useState } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecretInput } from "@/components/ui/secret-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { getAuthSession } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { QrCode, Save, Copy, ShieldCheck } from "lucide-react";

/**
 * O servidor nunca devolve access token nem webhook secret: só avisa (`...Set`) que já estão salvos.
 * Campo em branco = manter o que está salvo.
 */
interface MercadoPagoSaved {
  enabled?: boolean;
  acceptPix?: boolean;
  acceptCreditCard?: boolean;
  publicKey?: string;
  accessToken?: string;
  webhookSecret?: string;
  maxInstallments?: number;
  pixExpirationMinutes?: number;
  accessTokenSet?: boolean;
  /** 4 últimos caracteres do token salvo (só para identificar qual chave está valendo). */
  accessTokenLast4?: string | null;
  webhookSecretSet?: boolean;
  webhookSecretLast4?: string | null;
}

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

/** O servidor nunca devolve o segredo salvo: só se existe e, quando longo, os 4 últimos caracteres. */
function savedHint(isSet: boolean, last4: string | null, noun: string): string {
  if (!isSet) return "Chave secreta: fica só no servidor e não volta para esta tela.";
  const suffix = last4 ? ` (termina em ${last4})` : "";
  return `${noun} salvo ••••${suffix}. Deixe em branco para manter.`;
}

export function MercadoPagoSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [enabled, setEnabled] = useState(false);
  const [acceptPix, setAcceptPix] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [publicKey, setPublicKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [maxInstallments, setMaxInstallments] = useState(1);
  const [pixExpirationMinutes, setPixExpirationMinutes] = useState(30);
  const [accessTokenSet, setAccessTokenSet] = useState(false);
  const [webhookSecretSet, setWebhookSecretSet] = useState(false);
  const [accessTokenLast4, setAccessTokenLast4] = useState<string | null>(null);
  const [webhookSecretLast4, setWebhookSecretLast4] = useState<string | null>(null);
  const [removeAccessToken, setRemoveAccessToken] = useState(false);
  const [removeWebhookSecret, setRemoveWebhookSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const mp = ((settings as unknown as { paymentGateways?: { mercadopago?: MercadoPagoSaved } }).paymentGateways
      ?.mercadopago ?? {}) as MercadoPagoSaved;
    setEnabled(!!mp.enabled);
    setAcceptPix(mp.acceptPix ?? true);
    setAcceptCard(mp.acceptCreditCard ?? true);
    setPublicKey(mp.publicKey ?? "");
    setMaxInstallments(mp.maxInstallments ?? 1);
    setPixExpirationMinutes(mp.pixExpirationMinutes ?? 30);
    setAccessTokenSet(!!mp.accessTokenSet);
    setWebhookSecretSet(!!mp.webhookSecretSet);
    setAccessTokenLast4(mp.accessTokenLast4 ?? null);
    setWebhookSecretLast4(mp.webhookSecretLast4 ?? null);
    setAccessToken(mp.accessToken ?? "");
    setWebhookSecret(mp.webhookSecret ?? "");
    setRemoveAccessToken(false);
    setRemoveWebhookSecret(false);
  }, [settings]);

  const storeId = getAuthSession()?.user?.storeId;
  const webhookUrl = `${import.meta.env.VITE_ADMIN_API || "https://api.lojapod.com"}/payments/webhook/mercadopago${
    storeId ? `?storeId=${storeId}` : ""
  }`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({
      title: "URL copiada!",
      description: "Cole em Suas integrações > Webhooks do Mercado Pago, evento \"Pagamentos\".",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const fail = (description: string) => {
    toast({ variant: "destructive", title: "Atenção", description });
  };

  const handleSave = async () => {
    if (enabled) {
      if (!publicKey.trim()) return fail("Informe a Public Key do Mercado Pago.");
      if (!accessToken.trim() && !accessTokenSet) return fail("Informe o Access Token do Mercado Pago.");
      if (!webhookSecret.trim() && !webhookSecretSet) {
        return fail("Informe a chave secreta do webhook. Sem ela o servidor não aceita a confirmação do pagamento.");
      }
      if (!acceptPix && !acceptCard) return fail("Escolha pelo menos uma forma: Pix ou cartão.");
    }

    try {
      const current = (settings as unknown as { paymentGateways?: Record<string, unknown> })?.paymentGateways || {};
      await updateSettingsMutation.mutateAsync({
        paymentGateways: {
          ...current,
          mercadopago: {
            enabled,
            acceptPix,
            acceptCreditCard: acceptCard,
            publicKey: publicKey.trim(),
            // em branco = o servidor mantém o valor salvo; null = remover
            accessToken: removeAccessToken ? null : accessToken.trim(),
            webhookSecret: removeWebhookSecret ? null : webhookSecret.trim(),
            maxInstallments,
            pixExpirationMinutes,
          },
        },
      } as never);
      setRemoveAccessToken(false);
      setRemoveWebhookSecret(false);
      toast({
        title: "Mercado Pago salvo!",
        description: "As configurações do Mercado Pago foram atualizadas.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Falha ao salvar o Mercado Pago.",
      });
    }
  };

  if (isStaff()) {
    return null;
  }

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Mercado Pago (Pix QR Code e Cartão Online)
              <Badge variant={enabled ? "default" : "outline"} className="text-xs">
                {enabled ? "Ativo na Loja" : "Desativado"}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Pix com QR Code e cartão direto no checkout da loja, com confirmação automática. O cartão é digitado no
              site do Mercado Pago: os dados nunca passam pelo nosso servidor.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="mp-enabled" className="text-sm font-semibold">
              Habilitar Mercado Pago no checkout online
            </Label>
            <p className="text-xs text-muted-foreground">
              Se a InfinitePay estiver ativa para cartão, ela continua com prioridade no cartão online.
            </p>
          </div>
          <Switch id="mp-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <div className="space-y-4 pt-2 border-t">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="mp-pix" checked={acceptPix} onCheckedChange={(v) => setAcceptPix(v === true)} />
                <Label htmlFor="mp-pix" className="text-sm cursor-pointer">Aceitar Pix (QR Code)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="mp-card" checked={acceptCard} onCheckedChange={(v) => setAcceptCard(v === true)} />
                <Label htmlFor="mp-card" className="text-sm cursor-pointer">Aceitar cartão de crédito</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="mp-public-key" className="text-xs font-semibold">
                  Public Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mp-public-key"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="APP_USR-... ou TEST-..."
                  className="h-9"
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground">Pode aparecer no site: serve só para criptografar o cartão.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-access-token" className="text-xs font-semibold">
                  Access Token <span className="text-destructive">*</span>
                </Label>
                <SecretInput
                  id="mp-access-token"
                  toggleName="Access Token"
                  value={accessToken}
                  onChange={(e) => {
                    setAccessToken(e.target.value);
                    if (removeAccessToken) setRemoveAccessToken(false);
                  }}
                  placeholder="APP_USR-... ou TEST-..."
                  className="h-9"
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground" data-testid="mp-access-token-hint">
                  {removeAccessToken
                    ? "O token salvo será removido ao salvar."
                    : savedHint(accessTokenSet, accessTokenLast4, "Token")}
                </p>
                {accessTokenSet && (
                  <button
                    type="button"
                    className="text-[11px] underline text-muted-foreground hover:text-foreground"
                    onClick={() => setRemoveAccessToken((v) => !v)}
                  >
                    {removeAccessToken ? "Manter o token salvo" : "Remover o token salvo"}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-webhook-secret" className="text-xs font-semibold">
                  Chave secreta do webhook <span className="text-destructive">*</span>
                </Label>
                <SecretInput
                  id="mp-webhook-secret"
                  toggleName="chave secreta do webhook"
                  value={webhookSecret}
                  onChange={(e) => {
                    setWebhookSecret(e.target.value);
                    if (removeWebhookSecret) setRemoveWebhookSecret(false);
                  }}
                  placeholder="Gerada ao criar o webhook"
                  className="h-9"
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground" data-testid="mp-webhook-secret-hint">
                  {removeWebhookSecret
                    ? "A chave salva será removida ao salvar."
                    : webhookSecretSet
                      ? savedHint(webhookSecretSet, webhookSecretLast4, "Chave")
                      : "Usada para conferir que a notificação veio mesmo do Mercado Pago."}
                </p>
                {webhookSecretSet && (
                  <button
                    type="button"
                    className="text-[11px] underline text-muted-foreground hover:text-foreground"
                    onClick={() => setRemoveWebhookSecret((v) => !v)}
                  >
                    {removeWebhookSecret ? "Manter a chave salva" : "Remover a chave salva"}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-installments" className="text-xs font-semibold">Parcelas máximas no cartão</Label>
                <select
                  id="mp-installments"
                  value={maxInstallments}
                  onChange={(e) => setMaxInstallments(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {INSTALLMENT_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n === 1 ? "À vista (1x)" : `Até ${n}x`}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mp-pix-expiration" className="text-xs font-semibold">Validade do QR Code Pix (minutos)</Label>
                <Input
                  id="mp-pix-expiration"
                  type="number"
                  min={5}
                  max={1440}
                  value={pixExpirationMinutes}
                  onChange={(e) => setPixExpirationMinutes(Number(e.target.value))}
                  className="h-9"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  URL do Webhook (Notificação Automática)
                </span>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyWebhook}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <code className="text-[11px] bg-background px-2.5 py-1.5 rounded border block select-all text-muted-foreground overflow-x-auto">
                {webhookUrl}
              </code>
              <p className="text-[11px] text-muted-foreground">
                No painel do Mercado Pago, em Suas integrações &gt; Webhooks, cadastre esta URL com o evento
                "Pagamentos" e copie a chave secreta gerada para o campo acima.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending || isLoading} className="gap-1.5">
            <Save className="h-4 w-4" />
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Mercado Pago"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
