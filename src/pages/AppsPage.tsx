import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { apiFetch } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Printer, Download, Key, Copy, Check, Monitor } from "lucide-react";

const PRINT_AGENT_EXE_URL =
  "https://github.com/thiekokumagai/print-lojapod/releases/latest/download/print-agent-setup.exe";

export function AppsSection() {
  const { data: settings } = useSettings({ forceEnable: true });
  const [printToken, setPrintToken] = useState("");
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const storeId = (settings as { storeId?: string } | undefined)?.storeId;

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">Agente de Impressão</CardTitle>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    Windows (.exe)
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Impressão automática de pedidos na impressora térmica do balcão com atualização automática.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-slate-50 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <Key className="h-4 w-4" />
              <span>Token de Ativação da Impressora</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Insira este token no aplicativo da impressora (<strong>print-agent-setup.exe</strong>) instalado no computador da sua loja para conectar o balcão ao sistema.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  readOnly
                  aria-label="Token de Ativação da Impressora"
                  value={printToken || (isLoadingToken ? "Carregando token..." : "")}
                  placeholder="Token da impressora"
                  className="pl-9 font-mono text-sm bg-white font-bold text-slate-800"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!printToken}
                onClick={handleCopyToken}
                className="flex items-center gap-2 shrink-0 bg-white"
              >
                {copiedToken ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedToken ? "Copiado!" : "Copiar Token"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              <span>Instalador oficial com inicialização junto ao Windows</span>
            </div>
            <Button asChild className="gap-2 shrink-0">
              <a href={PRINT_AGENT_EXE_URL} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Baixar Instalador (.exe)
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
        <p className="text-sm text-muted-foreground">
          Baixe os aplicativos para Windows da sua loja e configure o token de conexão da impressora térmica.
        </p>
      </div>
      <AppsSection />
    </div>
  );
}