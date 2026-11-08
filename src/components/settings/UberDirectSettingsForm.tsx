import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { testUberAuth } from "@/services/uber.service";
import {
  Car, Zap, Compass, Key, Phone, FileText,
  CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Clock, Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [uberDirectPickupInstructions, setUberDirectPickupInstructions] = useState("");
  const [uberDirectPickupPhone, setUberDirectPickupPhone] = useState("");
  const [uberDirectBatchSize, setUberDirectBatchSize] = useState(3);
  const [uberDirectMaxAngleDelta, setUberDirectMaxAngleDelta] = useState(45);
  const [uberDirectDispatchDelayMinutes, setUberDirectDispatchDelayMinutes] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setUberDirectEnabled(!!settings.uberDirectEnabled);
      setUberDirectAutoDispatch(!!settings.uberDirectAutoDispatch);
      setUberDirectClientId(settings.uberDirectClientId || "");
      setUberDirectClientSecret(settings.uberDirectClientSecret || "");
      setUberDirectCustomerId(settings.uberDirectCustomerId || "");
      setUberDirectPickupInstructions(settings.uberDirectPickupInstructions || "");
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

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testUberAuth();
      if (result.ok) {
        toast.success(`Conexão com a Uber OK (${result.environment})`);
      } else {
        toast.error(result.error || "Falha ao autenticar na Uber");
      }
    } catch (err: any) {
      toast.error("Erro ao testar conexão: " + (err.message || "Tente novamente"));
    } finally {
      setIsTesting(false);
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
          {/* Automação e Delay */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-slate-800">Disparo 100% Automático ao Marcar "Separado"</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Quando ativado, assim que você marcar o pedido como <strong>"Separado"</strong>, o sistema aciona a Uber automaticamente sem necessidade de telas extras.
                </p>
              </div>
              <Switch
                checked={uberDirectAutoDispatch}
                onCheckedChange={setUberDirectAutoDispatch}
                disabled={!uberDirectEnabled}
              />
            </div>

            {/* Delay configurável */}
            {uberDirectAutoDispatch && (
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <Label className="text-xs font-bold text-slate-800">
                      Aguardar antes de chamar o Uber (Janela de Agrupamento)
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {uberDirectDispatchDelayMinutes === 0
                      ? "0 min (Imediato) — O Uber é chamado no mesmo instante em que o pedido é separado."
                      : `Aguardará ${uberDirectDispatchDelayMinutes} min após "Separado" para juntar outros pedidos que forem separados no mesmo rumo.`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={uberDirectDispatchDelayMinutes}
                    onChange={(e) => setUberDirectDispatchDelayMinutes(Math.max(0, Math.min(30, Number(e.target.value))))}
                    disabled={!uberDirectEnabled}
                    className="text-xs h-9 w-20 bg-white font-semibold text-center"
                  />
                  <span className="text-xs font-medium text-slate-600">minutos</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 pt-2 text-[11px] text-emerald-800 bg-emerald-50/90 p-3 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Regra de Segurança para Uber Direct (Só Ida):</span>
                <p className="text-emerald-700 leading-relaxed">
                  O despacho automático aciona a Uber apenas para pedidos com <strong>PIX ou Cartão já pago online</strong> (onde o motorista apenas entrega o pacote e vai embora).
                  Pedidos a cobrar na entrega (dinheiro ou maquininha de cartão) <strong>não</strong> chamam a Uber automaticamente, ficando disponíveis no painel para seus <strong>entregadores próprios</strong> retornarem com a máquina e o valor.
                </p>
              </div>
            </div>
          </div>

          {/* Credenciais de Conexão */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Credenciais do Portal Uber Direct</h3>
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
                        className="text-violet-600 hover:underline font-mono inline-flex items-center gap-1 font-semibold">
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
                    <span>Copie o campo <strong>User ID</strong> (também chamado de Customer ID — é o UUID que aparece na URL de exemplo) e cole no campo <strong>UBER_CUSTOMER_ID</strong> abaixo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">4</span>
                    <span>Copie o campo <strong>Developer customer ID</strong> (também chamado de Client ID) e cole no campo <strong>UBER_CLIENT_ID</strong> abaixo</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">5</span>
                    <span>Clique em <strong>Reveal</strong> no <strong>Client secret</strong> (marcado "Set this as your authorization header"), copie e cole no campo <strong>UBER_CLIENT_SECRET</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px]">6</span>
                    <span>No portal da Uber, quando quiser corridas reais e faturamento, clique no botão <strong>Switch to production</strong>. As credenciais geradas lá já definem se a corrida é teste ou real automaticamente.</span>
                  </li>
                </ol>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImageModalOpen(true)}
                    className="gap-1.5 text-violet-700 border-violet-300 hover:bg-violet-100 text-xs h-8"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver imagem de exemplo do painel Uber
                  </Button>

                  <a href="https://direct.uber.com/settings/developer" target="_blank" rel="noopener noreferrer">
                    <Button variant="default" size="sm" className="gap-1.5 bg-violet-700 hover:bg-violet-800 text-white text-xs h-8">
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
                  placeholder="Ex: XYZABC-12XXXXXXXXXXXXXX"
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
                  placeholder="Ex: 987abcd1-1234-5678-a987"
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-3 pt-4 border-t">
            <span className="text-[11px] text-muted-foreground sm:mr-auto">
              O teste usa as credenciais já salvas. Salve antes de testar.
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || !isConfigured}
            >
              {isTesting ? "Testando..." : "Testar conexão"}
            </Button>
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

      {/* Modal Popup da Imagem de Exemplo */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl p-6 bg-slate-950 border-slate-800 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Key className="h-5 w-5 text-violet-400" />
              Onde encontrar as credenciais no Portal Uber Direct Developer
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-black/60 flex items-center justify-center p-2">
            <img
              src="/uber-direct-developer.png"
              alt="Tela do Portal Uber Direct Developer mostrando Customer ID, Client ID e Client Secret"
              className="w-full h-auto object-contain max-h-[70vh] rounded-lg"
            />
          </div>
          <div className="mt-3 text-xs text-slate-400 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <p>
              💡 <strong>Dica:</strong> Acesse o portal em <strong>direct.uber.com</strong>, entre em <strong>Management</strong> → <strong>Developer</strong>. Copie o <strong>Customer ID</strong>, <strong>Client ID</strong> e o <strong>Client secret</strong>. O botão <em>"Switch to production"</em> alterna entre simulação de testes e entregas reais com cobrança.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
