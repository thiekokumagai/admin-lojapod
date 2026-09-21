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
  Save,
  Copy,
  Check,
} from "lucide-react";

const STORE_CNAME = import.meta.env.VITE_STORE_CNAME || "fallback.lojapod.com";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title="Copiar"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

function DnsInstructions({ domain }: { domain: string }) {
  const hasDomain = domain && domain.trim().length > 0;
  const cleanDomain = domain.replace(/^www\./, "").trim();

  return (
    <div className="p-4 bg-slate-50 border rounded-xl text-xs space-y-3 text-slate-600">
      <p className="font-semibold text-slate-800 text-sm">
        📋 Como apontar seu domínio para a loja:
      </p>

      {/* Opção CNAME */}
      <div className="rounded-lg border border-indigo-100 bg-white p-3 space-y-2">
        <p className="font-bold text-indigo-800 font-sans text-xs">
          ✅ Opção 1 — Recomendada (CNAME para <code>www</code>)
        </p>
        <p className="text-slate-600 font-sans">
          Acesse o painel do seu provedor (Registro.br, Cloudflare, GoDaddy…) e crie:
        </p>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="bg-slate-50 rounded border p-2 space-y-1">
            <p className="text-[10px] font-sans text-slate-500 uppercase font-bold">Tipo</p>
            <p className="font-mono font-bold text-slate-800 flex items-center">
              CNAME
              <CopyButton value="CNAME" />
            </p>
          </div>
          <div className="bg-slate-50 rounded border p-2 space-y-1">
            <p className="text-[10px] font-sans text-slate-500 uppercase font-bold">Nome / Host</p>
            <p className="font-mono font-bold text-slate-800 flex items-center">
              www
              <CopyButton value="www" />
            </p>
          </div>
          <div className="bg-slate-50 rounded border p-2 space-y-1">
            <p className="text-[10px] font-sans text-slate-500 uppercase font-bold">Aponta para (Alvo)</p>
            <p className="font-mono font-bold text-indigo-700 break-all flex items-center gap-1">
              {STORE_CNAME}
              <CopyButton value={STORE_CNAME} />
            </p>
          </div>
        </div>
      </div>

      {/* Opção raiz */}
      <div className="rounded-lg border border-amber-100 bg-white p-3 space-y-2">
        <p className="font-bold text-amber-800 font-sans text-xs">
          ⚠️ Opção 2 — Domínio Raiz (<code>@</code> / sem www)
        </p>
        <p className="text-slate-600 font-sans">
          Se quiser que <strong>{hasDomain ? cleanDomain : "sualoja.com.br"}</strong> funcione sem
          o www, use CNAME no nome <code>@</code> (Cloudflare suporta) ou peça o IP ao suporte.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="bg-slate-50 rounded border p-2 space-y-1">
            <p className="text-[10px] font-sans text-slate-500 uppercase font-bold">Tipo</p>
            <p className="font-mono font-bold text-slate-800">CNAME</p>
          </div>
          <div className="bg-slate-50 rounded border p-2 space-y-1">
            <p className="text-[10px] font-sans text-slate-500 uppercase font-bold">Nome / Host</p>
            <p className="font-mono font-bold text-slate-800 flex items-center">
              @<CopyButton value="@" />
            </p>
          </div>
          <div className="bg-slate-50 rounded border p-2 space-y-1">
            <p className="text-[10px] font-sans text-slate-500 uppercase font-bold">Aponta para (Alvo)</p>
            <p className="font-mono font-bold text-indigo-700 break-all flex items-center gap-1">
              {STORE_CNAME}
              <CopyButton value={STORE_CNAME} />
            </p>
          </div>
        </div>
        <p className="text-[10px] text-amber-700 font-sans">
          ⚡ Cloudflare suporta CNAME para raiz (@). No Registro.br, use "ALIAS" ou apenas registre o www.
        </p>
      </div>

      <p className="text-slate-500 font-sans">
        🕐 Após salvar e apontar o DNS, aguarde até <strong>24 horas</strong> para propagação e clique em{" "}
        <strong>"Testar DNS"</strong> para confirmar.
      </p>
    </div>
  );
}

export default function DomainPage() {
  const { data: settings } = useSettings();
  const [customDomain, setCustomDomain] = useState("");
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dnsResult, setDnsResult] = useState<{
    isConfigured?: boolean;
    message?: string;
    recordType?: string;
    records?: string[];
  } | null>(null);

  useEffect(() => {
    const storeId = (settings as any)?.storeId;
    if (storeId) {
      apiFetch(`/stores/${storeId}`)
        .then((res) => res.json())
        .then((storeData) => {
          if (storeData?.customDomain) setCustomDomain(storeData.customDomain);
        })
        .catch(() => {});
    }
  }, [settings]);

  const handleSave = async () => {
    const storeId = (settings as any)?.storeId;
    if (!storeId) return;

    try {
      setIsSaving(true);
      const res = await apiFetch(`/stores/${storeId}`, {
        method: "PUT",
        body: JSON.stringify({
          customDomain: customDomain.trim() ? customDomain.trim() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao salvar domínio");
      }

      toast({
        title: "Domínio salvo!",
        description: customDomain.trim()
          ? `O domínio "${customDomain}" foi registrado. Agora aponte seu DNS conforme as instruções abaixo.`
          : "Domínio próprio removido com sucesso.",
      });

      setDnsResult(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Não foi possível salvar o domínio.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDns = async () => {
    const storeId = (settings as any)?.storeId;
    if (!storeId) return;

    try {
      setIsVerifyingDns(true);
      const res = await apiFetch(`/stores/${storeId}/verify-dns`, {
        method: "POST",
      });
      const data = await res.json();
      setDnsResult(data);

      if (data.isConfigured) {
        toast({
          title: "DNS Verificado!",
          description: data.message || "Seu domínio está apontado corretamente.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "DNS Pendente",
          description: data.message || "Apontamento DNS ainda não localizado.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: err.message || "Não foi possível testar o DNS.",
      });
    } finally {
      setIsVerifyingDns(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Domínio Próprio</h1>
        <p className="text-sm text-muted-foreground">
          Conecte seu domínio registrado (ex: sualoja.com.br) à sua loja LojaPod.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Seu domínio registrado</p>
                <p className="text-xs text-muted-foreground">
                  Registrado no Registro.br, Cloudflare, GoDaddy, Hostinger, etc.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {customDomain && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyDns}
                  disabled={isVerifyingDns}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isVerifyingDns ? "animate-spin" : ""}`} />
                  {isVerifyingDns ? "Testando..." : "Testar DNS"}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Salvando..." : "Salvar Domínio"}
              </Button>
            </div>
          </div>

          {/* Input do domínio */}
          <div className="space-y-2 max-w-lg">
            <Label className="font-medium">Domínio</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={customDomain}
                onChange={(e) =>
                  setCustomDomain(
                    e.target.value
                      .toLowerCase()
                      .replace(/^https?:\/\//, "")
                      .replace(/\/.*$/, "")
                  )
                }
                placeholder="ex: minhaloja.com.br ou www.minhaloja.com.br"
                className="pl-9 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas o domínio, sem http:// nem barras. Ex:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">minhaloja.com.br</code>
            </p>
          </div>

          {/* Status atual */}
          {customDomain && !dnsResult && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
              <Globe className="h-4 w-4 shrink-0" />
              <span>
                Domínio salvo: <strong>{customDomain}</strong>. Clique em "Testar DNS" para verificar o apontamento.
              </span>
            </div>
          )}

          {/* Resultado do Teste DNS */}
          {dnsResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                dnsResult.isConfigured
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {dnsResult.isConfigured ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {dnsResult.isConfigured ? "DNS Detectado com Sucesso! 🎉" : "Apontamento DNS Pendente"}
                </p>
                <p>{dnsResult.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções de Apontamento */}
      <Card>
        <CardContent className="p-6">
          <DnsInstructions domain={customDomain} />
        </CardContent>
      </Card>
    </div>
  );
}
