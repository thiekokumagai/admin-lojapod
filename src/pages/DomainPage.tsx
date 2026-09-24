import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { apiFetch } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Globe,
  Link2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface DomainStatusData {
  hasDomain: boolean;
  id?: string;
  domain?: string;
  status?: "pending" | "active" | string;
  nameserver1?: string;
  nameserver2?: string;
}

function CopyInputBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copiado!", description: `${label} copiado para a área de transferência.` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-medium text-slate-800 break-all select-all">
          {value}
        </div>
        <Button
          type="button"
          onClick={handleCopy}
          className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 gap-1.5 px-4"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

export default function DomainPage() {
  const { data: settings } = useSettings();
  const storeId = (settings as any)?.storeId;

  const [inputDomain, setInputDomain] = useState("");
  const [domainData, setDomainData] = useState<DomainStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadDomainStatus = async (showToastOnCheck = false) => {
    if (!storeId) return;
    try {
      if (showToastOnCheck) setIsCheckingStatus(true);
      const res = await apiFetch(`/stores/${storeId}/domain/status`);
      if (res.ok) {
        const data: DomainStatusData = await res.json();
        setDomainData(data);
        if (data.domain) {
          setInputDomain(data.domain);
        }
        if (showToastOnCheck) {
          if (data.status === "active") {
            toast({
              title: "Domínio Ativo! 🎉",
              description: `A Cloudflare já detectou a alteração de DNS para ${data.domain}.`,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Ainda pendente",
              description: "Os servidores DNS ainda não foram propagados. Aguarde alguns minutos e tente novamente.",
            });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      loadDomainStatus();
    }
  }, [storeId]);

  const handleConnectDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !inputDomain.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await apiFetch(`/stores/${storeId}/domain`, {
        method: "POST",
        body: JSON.stringify({ domain: inputDomain.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao conectar domínio");
      }

      const data = await res.json();
      setDomainData({
        hasDomain: true,
        id: data.id,
        domain: data.domain,
        status: data.status,
        nameserver1: data.nameserver1,
        nameserver2: data.nameserver2,
      });

      toast({
        title: "Zona DNS criada com sucesso!",
        description: "Agora altere os servidores DNS no seu provedor (ex: Registro.br) para concluir.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar domínio",
        description: err.message || "Não foi possível cadastrar o domínio.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!storeId || !confirm("Tem certeza que deseja remover este domínio? Sua loja deixará de responder neste endereço.")) {
      return;
    }

    try {
      setIsRemoving(true);
      const res = await apiFetch(`/stores/${storeId}/domain`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao remover domínio");
      }

      setDomainData({ hasDomain: false });
      setInputDomain("");
      toast({
        title: "Domínio removido",
        description: "O domínio próprio foi desconectado e a zona Cloudflare foi excluída.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: err.message || "Não foi possível remover o domínio.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando configurações de domínio...
      </div>
    );
  }

  const hasConfiguredDomain = domainData?.hasDomain && domainData?.nameserver1;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Domínio Próprio</h1>
        <p className="text-sm text-muted-foreground">
          Conecte seu domínio registrado (ex: sualoja.com.br) diretamente via DNS autoritativo Cloudflare.
        </p>
      </div>

      {/* ESTADO 1: Nenhum domínio cadastrado -> Form de cadastro */}
      {!hasConfiguredDomain ? (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Conectar meu domínio</p>
                <p className="text-xs text-muted-foreground">
                  Insira o endereço do seu domínio registrado no Registro.br, GoDaddy, Hostinger, etc.
                </p>
              </div>
            </div>

            <form onSubmit={handleConnectDomain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domainInput" className="font-medium">Endereço do Domínio</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="domainInput"
                    value={inputDomain}
                    onChange={(e) =>
                      setInputDomain(
                        e.target.value
                          .toLowerCase()
                          .replace(/^https?:\/\//, "")
                          .replace(/\/.*$/, "")
                          .replace(/^www\./, "")
                      )
                    }
                    placeholder="minhaloja.com.br"
                    className="pl-9 font-mono text-sm"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Insira sem <code>https://</code> e sem <code>www</code>. Exemplo: <code className="bg-slate-100 px-1 py-0.5 rounded">sopod.com.br</code>
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !inputDomain.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Gerando Servidores DNS...
                  </>
                ) : (
                  "Continuar e Gerar DNS"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* ESTADO 2: Domínio cadastrado -> Instruções no padrão Vendizap */
        <Card className="border-purple-100 shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-purple-600 tracking-wide uppercase">Domínio Próprio</span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  {domainData.domain}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {domainData.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Ativo (DNS OK)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Pendente DNS
                  </span>
                )}
              </div>
            </div>

            {/* Subtítulo / Orientação */}
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Configuração do domínio</h3>
              <p className="text-xs text-slate-500">
                Insira as informações abaixo no painel de controle do domínio onde está registrado o seu endereço:
              </p>
              <p className="text-sm font-semibold text-purple-600">{domainData.domain}</p>
            </div>

            {/* Blocos de DNS 1 e DNS 2 */}
            <div className="space-y-4 max-w-xl">
              {domainData.nameserver1 && (
                <CopyInputBlock label="DNS 1" value={domainData.nameserver1} />
              )}
              {domainData.nameserver2 && (
                <CopyInputBlock label="DNS 2" value={domainData.nameserver2} />
              )}
            </div>

            {/* Orientação do Registro.br */}
            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-purple-900 flex items-center gap-1.5">
                <span>📍 Próximo passo no seu registrador (ex: Registro.br):</span>
              </p>
              <p>
                Entre no painel da sua conta de domínio (ex: Registro.br) e altere os <strong>Servidores DNS</strong> inserindo exatamente os dois endereços acima.
              </p>
              <p className="text-[11px] text-slate-500">
                Após salvar no Registro.br, aguarde a propagação. Isso pode levar de alguns minutos até poucas horas.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => loadDomainStatus(true)}
                disabled={isCheckingStatus}
                className="w-full sm:w-auto border-purple-300 text-purple-700 hover:bg-purple-50 font-medium gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isCheckingStatus ? "animate-spin" : ""}`} />
                {isCheckingStatus ? "Verificando..." : "Verificar configuração"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleRemoveDomain}
                disabled={isRemoving}
                className="w-full sm:w-auto text-rose-600 hover:bg-rose-50 font-medium gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isRemoving ? "Removendo..." : "Alterar / Excluir endereço"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
