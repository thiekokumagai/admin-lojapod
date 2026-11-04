import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Car, Zap, Compass, ShieldCheck, Key, Phone, FileText,
  CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Formata para exibição: +55 (DD) NNNNN-NNNN */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);
  let out = "";
  if (digits.length > 0) out = "+55 (" + digits.slice(0, 2);
  if (digits.length > 2) out += ") " + digits.slice(2, 7);
  if (digits.length > 7) out += "-" + digits.slice(7, 11);
  return out;
}

/** Converte para E.164 para salvar: +55XXXXXXXXXXX */
function toE164(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return "+" + digits;
  if (digits.length >= 10) return "+55" + digits;
  return formatted;
}

export function UberDirectSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [uberDirectEnabled, setUberDirectEnabled] = useState(false);
  const [uberDirectAutoDispatch, setUberDirectAutoDispatch] = useState(false);
  const [uberDirectClientId, setUberDirectClientId] = useState("");
  const [uberDirectClientSecret, setUberDirectClientSecret] = useState("");
  const [uberDirectCustomerId, setUberDirectCustomerId] = useState("");
  const [uberDirectEnvironment, setUberDirectEnvironment] = useState("sandbox");
  const [uberDirectPickupInstructions, setUberDirectPickupInstructions] = useState("");
  const [uberDirectPickupPhone, setUberDirectPickupPhone] = useState("");
  const [uberDirectBatchSize, setUberDirectBatchSize] = useState(3);
  const [uberDirectMaxAngleDelta, setUberDirectMaxAngleDelta] = useState(45);
  const [uberDirectDispatchDelayMinutes, setUberDirectDispatchDelayMinutes] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (settings) {
      setUberDirectEnabled(!!settings.uberDirectEnabled);
      setUberDirectAutoDispatch(!!settings.uberDirectAutoDispatch);
      setUberDirectClientId(settings.uberDirectClientId || "");
      setUberDirectClientSecret(settings.uberDirectClientSecret || "");
      setUberDirectCustomerId(settings.uberDirectCustomerId || "");
      setUberDirectEnvironment(settings.uberDirectEnvironment || "sandbox");
      setUberDirectPickupInstructions(settings.uberDirectPickupInstructions || "");
      // Load phone formatted
      const raw = settings.uberDirectPickupPhone || "";
      setUberDirectPickupPhone(raw ? formatPhone(raw) : "");
      setUberDirectBatchSize(settings.uberDirectBatchSize ?? 3);
      setUberDirectMaxAngleDelta(settings.uberDirectMaxAngleDelta ?? 45);
      setUberDirectDispatchDelayMinutes(settings.uberDirectDispatchDelayMinutes ?? 0);
    }
  }, [settings]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setUberDirectPickupPhone(formatted);
  };

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        uberDirectEnabled,
        uberDirectAutoDispatch,
        uberDirectClientId: uberDirectClientId.trim() || null,
        uberDirectClientSecret: uberDirectClientSecret.trim() || null,
        uberDirectCustomerId: uberDirectCustomerId.trim() || null,
        uberDirectEnvironment,
        uberDirectPickupInstructions: uberDirectPickupInstructions.trim() || null,
        uberDirectPickupPhone: uberDirectPickupPhone ? toE164(uberDirectPickupPhone) : null,
        uberDirectBatchSize: Number(uberDirectBatchSize) || 3,
        uberDirectMaxAngleDelta: Number(uberDirectMaxAngleDelta) || 45,
        uberDirectDispatchDelayMinutes: Number(uberDirectDispatchDelayMinutes) || 0,
      });
      toast.success("Configurações do Uber Direct salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar configurações do Uber Direct: " + (err.message || "Tente novamente"));
    }
  };

  const isConfigured = !!(uberDirectClientId && uberDirectClientSecret && uberDirectCustomerId);

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Car className="h-6 w-6 text-emerald-400" />
                <CardTitle className="text-xl font-bold">Uber Direct (Entregas Automáticas)</CardTitle>
                {isConfigured ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Credenciais OK
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-300 border-amber-300/40">
                    Pendente de Configuração
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-300 text-xs sm:text-sm">
                Conecte a conta Uber Direct da sua loja para acionar entregadores automaticamente assim que os pedidos forem separados.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <span className="text-xs font-semibold text-slate-200">Ativar Uber Direct</span>
              <Switch
                checked={uberDirectEnabled}
                onCheckedChange={setUberDirectEnabled}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Automação e Modo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-slate-800">Disparo 100% Automático</span>
                </div>
                <Switch
                  checked={uberDirectAutoDispatch}
                  onCheckedChange={setUberDirectAutoDispatch}
                  disabled={!uberDirectEnabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Quando ativado, assim que você ou sua equipe marcar o status do pedido como <strong>"Separado"</strong> no painel de pedidos ou kanban, o sistema requisita imediatamente a Uber sem telas extras.
              </p>

              {/* Delay configurável */}
              {uberDirectAutoDispatch && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <Label className="text-xs font-semibold text-slate-700">
                      Aguardar antes de chamar o Uber (minutos)
                    </Label>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={uberDirectDispatchDelayMinutes}
                    onChange={(e) => setUberDirectDispatchDelayMinutes(Math.max(0, Math.min(30, Number(e.target.value))))}
                    disabled={!uberDirectEnabled}
                    className="text-xs h-8 w-28"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {uberDirectDispatchDelayMinutes === 0
                      ? "Imediato — o Uber é chamado no instante em que o pedido é marcado como Separado."
                      : `O sistema aguardará ${uberDirectDispatchDelayMinutes} min após "Separado" antes de acionar o mototaxi — útil para agrupar pedidos da mesma rota.`}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">Ambiente da API</span>
              </div>
              <Select
                value={uberDirectEnvironment}
                onValueChange={setUberDirectEnvironment}
                disabled={!uberDirectEnabled}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Ambiente de Testes / Simulação)</SelectItem>
                  <SelectItem value="production">Produção (Corridas Reais com Faturamento)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Recomendamos testar primeiro em Sandbox para certificar que os dados de coleta e entrega estão formatados.
              </p>
            </div>
          </div>

          {/* Credenciais de Conexão */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Credenciais do Portal Uber Developers</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-violet-700 hover:text-violet-900 gap-1"
                onClick={() => setShowGuide((v) => !v)}
              >
                {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showGuide ? "Ocultar guia" : "Como obter as credenciais?"}
              </Button>
            </div>

            {/* Guia de credenciais */}
            {showGuide && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2 text-violet-700 font-semibold">
                  <FileText className="h-4 w-4" />
                  <span>Passo a passo para obter as credenciais Uber Direct</span>
                </div>
                <ol className="space-y-2 list-none">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>Acesse o portal Uber Direct e faça login com a conta da loja:<br />
                      <a href="https://direct.uber.com" target="_blank" rel="noopener noreferrer"
                        className="text-violet-600 hover:underline font-mono inline-flex items-center gap-1">
                        direct.uber.com <ExternalLink className="h-3 w-3" />
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>No menu lateral esquerdo, clique em <strong>Management</strong> → <strong>Developer</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                    <span>Copie o campo <strong>Customer ID</strong> (ex: <code className="bg-violet-100 px-1 rounded">987abcd1-1234-5678-a987</code>) e cole no campo <strong>UBER_CUSTOMER_ID</strong> abaixo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">4</span>
                    <span>Copie o campo <strong>Client ID</strong> e cole no campo <strong>UBER_CLIENT_ID</strong> abaixo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">5</span>
                    <span>Clique em <strong>Reveal</strong> ao lado do campo <strong>Client secret</strong> (o segundo, marcado "Set this as your authorization header"), copie e cole no campo <strong>UBER_CLIENT_SECRET</strong> abaixo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">6</span>
                    <span>Para corridas reais (faturamento), clique em <strong>Switch to production</strong> no portal e troque o <strong>Ambiente da API</strong> acima para <em>Produção</em></span>
                  </li>
                </ol>
                <div className="pt-2 rounded-lg overflow-hidden border border-violet-200 bg-white">
                  <img
                    src="/uber-direct-developer.png"
                    alt="Tela do Portal Uber Direct Developer mostrando Customer ID, Client ID e Client Secret"
                    className="w-full object-contain max-h-52 cursor-zoom-in"
                    onClick={(e) => { const el = e.currentTarget; el.style.maxHeight = el.style.maxHeight === 'none' ? '13rem' : 'none'; }}
                    title="Clique para ampliar"
                  />
                </div>
                <div className="pt-1">
                  <a href="https://direct.uber.com/settings/developer" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5 text-violet-700 border-violet-300 hover:bg-violet-100 text-xs h-7">
                      <ExternalLink className="h-3 w-3" />
                      Abrir Portal Uber Direct Developer
                    </Button>
                  </a>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">UBER_CLIENT_ID</Label>
                <Input
                  placeholder="Ex: d_client_id_..."
                  value={uberDirectClientId}
                  onChange={(e) => setUberDirectClientId(e.target.value)}
                  disabled={!uberDirectEnabled}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">UBER_CLIENT_SECRET</Label>
                <Input
                  type="password"
                  placeholder="Ex: •••••••••••••••"
                  value={uberDirectClientSecret}
                  onChange={(e) => setUberDirectClientSecret(e.target.value)}
                  disabled={!uberDirectEnabled}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">UBER_CUSTOMER_ID</Label>
                <Input
                  placeholder="Ex: cus_abc123456"
                  value={uberDirectCustomerId}
                  onChange={(e) => setUberDirectCustomerId(e.target.value)}
                  disabled={!uberDirectEnabled}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Dados do Ponto de Retirada */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Ponto de Retirada (Balcão da Loja)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Telefone de Contato da Retirada</Label>
                <Input
                  placeholder="+55 (11) 99999-9999"
                  value={uberDirectPickupPhone}
                  onChange={handlePhoneChange}
                  disabled={!uberDirectEnabled}
                  className="text-xs"
                  maxLength={20}
                />
                <span className="text-[11px] text-muted-foreground">
                  Número que o motorista liga ao chegar na loja — salvo no formato internacional (+55...)
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instruções de Retirada para o Motorista</Label>
                <Input
                  placeholder="Ex: Retirar pacotes identificados no balcão de expedição"
                  value={uberDirectPickupInstructions}
                  onChange={(e) => setUberDirectPickupInstructions(e.target.value)}
                  disabled={!uberDirectEnabled}
                  className="text-xs"
                />
                <span className="text-[11px] text-muted-foreground">
                  Exibido para o mototaxi no app Uber ao chegar na loja para retirar o(s) pedido(s)
                </span>
              </div>
            </div>
          </div>

          {/* Otimizador de Rotas na Mesma Linha Reta */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Agrupamento Inteligente de Rotas (Mesmo Rumo / Linha Reta)</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              O algoritmo agrupa pedidos separados que estejam no <strong>mesmo cone de direção partindo da loja</strong>, organizando as entregas de modo que o motorista siga para a frente sem voltar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Máximo de Pedidos por Corrida</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={uberDirectBatchSize}
                  onChange={(e) => setUberDirectBatchSize(Number(e.target.value))}
                  disabled={!uberDirectEnabled}
                  className="text-xs"
                />
                <span className="text-[11px] text-muted-foreground">Padrão: 3 pedidos por motorista</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tolerância Angular de Linha Reta (Graus)</Label>
                <Input
                  type="number"
                  min="15"
                  max="90"
                  value={uberDirectMaxAngleDelta}
                  onChange={(e) => setUberDirectMaxAngleDelta(Number(e.target.value))}
                  disabled={!uberDirectEnabled}
                  className="text-xs"
                />
                <span className="text-[11px] text-muted-foreground">Padrão: 45° (cone frontal para frente da loja)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending || isLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6"
            >
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
