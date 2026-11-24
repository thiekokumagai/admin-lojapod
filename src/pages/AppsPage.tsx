import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { apiFetch } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { ScaleAgentCard } from "@/components/apps/ScaleAgentCard";
import {
  Printer,
  Download,
  Key,
  Copy,
  Check,
  Monitor,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Cpu,
} from "lucide-react";

const PRINT_AGENT_EXE_URL =
  "https://github.com/thiekokumagai/print-lojapod/releases/latest/download/print-agent-setup.exe";

export function AppsSection() {
  const { data: settings } = useSettings({ forceEnable: true });
  const [printToken, setPrintToken] = useState("");
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const storeId = (settings as { storeId?: string } | undefined)?.storeId;
  // Balança só para lojas que vendem por peso (comida e açaí)
  const sellsByWeight = settings?.businessType === "FOOD" || settings?.businessType === "ACAI";

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    setIsLoadingToken(true);
    apiFetch(`/stores/${storeId}/print-token`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.printToken) {
          setPrintToken(data.printToken);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingToken(false);
      });

    return () => {
      active = false;
    };
  }, [storeId]);

  const handleCopyToken = () => {
    if (!printToken) return;
    navigator.clipboard.writeText(printToken);
    setCopiedToken(true);
    toast({
      title: "Token copiado!",
      description: "Cole o token no aplicativo de impressão do computador.",
    });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner Estilo App Store */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-200 backdrop-blur-md border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>Central de Aplicativos · Podi Pedir</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Aplicativos oficiais para o computador do seu balcão
            </h2>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              Instale o aplicativo nativo para Windows com inicialização automática, conexão em tempo real e atualizações silenciosas direto do GitHub Releases.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3">
              <Monitor className="h-5 w-5 text-indigo-300 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-indigo-200/70 font-semibold">Sistema</p>
                <p className="text-xs font-bold text-white">Windows 10 / 11</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3">
              <RefreshCw className="h-5 w-5 text-emerald-300 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-indigo-200/70 font-semibold">Versão</p>
                <p className="text-xs font-bold text-white">Auto-Update Ativo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Card Estilo App Store */}
      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-card shadow-md">
        <CardContent className="p-0">
          {/* Topo do App: Ícone iOS/macOS + Título + Botão Obter */}
          <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-b from-slate-50/90 to-white border-b">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-black/5">
                <Printer className="h-10 w-10 drop-shadow" />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white" title="Oficial & Verificado">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Agente de Impressão
                  </h3>
                  <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Oficial
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-semibold border-slate-300 text-slate-600 rounded-full">
                    Windows (.exe)
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 max-w-xl">
                  Impressão térmica automática de cupons e pedidos em tempo real para o balcão e cozinha, sem precisar clicar para imprimir.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <Zap className="h-3 w-3" /> Impressão instantânea via WebSocket
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    <RefreshCw className="h-3 w-3" /> Atualização automática
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between gap-2 shrink-0">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-7 shadow-md shadow-indigo-600/20 gap-2 h-11"
              >
                <a href={PRINT_AGENT_EXE_URL} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Baixar Instalador (.exe)
                </a>
              </Button>
              <span className="text-[11px] text-muted-foreground font-mono text-center md:text-right">
                print-agent-setup.exe · 64-bit
              </span>
            </div>
          </div>

          {/* Faixa de Metadados Estilo App Store */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-b bg-slate-50/50 text-center">
            <div className="p-3.5 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categoria</p>
              <p className="text-xs font-bold text-slate-800">Automação de Balcão</p>
            </div>
            <div className="p-3.5 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compatibilidade</p>
              <p className="text-xs font-bold text-slate-800">Impressoras 58mm e 80mm</p>
            </div>
            <div className="p-3.5 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inicialização</p>
              <p className="text-xs font-bold text-slate-800">Inicia com o Windows</p>
            </div>
            <div className="p-3.5 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atualizações</p>
              <p className="text-xs font-bold text-emerald-700">GitHub Auto-Updater</p>
            </div>
          </div>

          {/* Corpo: Token de Ativação + Recursos e Passo a Passo */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna do Token de Ativação */}
            <div className="lg:col-span-7 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Token de Ativação da Impressora
                    </h4>
                    <p className="text-xs text-slate-500">
                      Chave exclusiva para vincular o aplicativo à sua loja
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  Chave da Loja
                </Badge>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Após instalar e abrir o <strong>print-agent-setup.exe</strong> no computador da loja, copie o token abaixo e cole na janela de ativação do aplicativo na bandeja do Windows.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <div className="relative flex-1">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-indigo-500" />
                  <Input
                    readOnly
                    aria-label="Token de Ativação da Impressora"
                    value={printToken || (isLoadingToken ? "Carregando token..." : "")}
                    placeholder="Token da impressora"
                    className="pl-10 h-10 font-mono text-sm bg-white font-bold text-slate-900 border-indigo-200 focus-visible:ring-indigo-500"
                  />
                </div>
                <Button
                  type="button"
                  disabled={!printToken}
                  onClick={handleCopyToken}
                  className={`h-10 px-5 font-bold gap-2 shrink-0 transition-all ${
                    copiedToken
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {copiedToken ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedToken ? "Copiado!" : "Copiar Token"}
                </Button>
              </div>
            </div>

            {/* Coluna de Recursos e Como Instalar */}
            <div className="lg:col-span-5 rounded-2xl border bg-slate-50/70 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Cpu className="h-4 w-4 text-indigo-600" />
                <span>Como instalar em 3 passos</span>
              </div>

              <ol className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[11px]">
                    1
                  </span>
                  <span>
                    Clique em <strong>Baixar Instalador (.exe)</strong> e execute o arquivo no computador onde a impressora está conectada.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[11px]">
                    2
                  </span>
                  <span>
                    Clique em <strong>Copiar Token</strong> ao lado e cole no ícone do aplicativo perto do relógio do Windows.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[11px]">
                    3
                  </span>
                  <span>
                    Selecione sua impressora térmica na bandeja e pronto: todo novo pedido será impresso automaticamente.
                  </span>
                </li>
              </ol>

              <div className="pt-2 border-t flex flex-wrap gap-3 text-[11px] text-slate-600 font-medium">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Reimpressão pelo painel
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Limpeza ao desinstalar
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sellsByWeight && <ScaleAgentCard />}
    </div>
  );
}

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
        <p className="text-sm text-muted-foreground">
          Baixe os aplicativos oficiais para Windows da sua loja e configure o token de conexão da impressora térmica.
        </p>
      </div>
      <AppsSection />
    </div>
  );
}