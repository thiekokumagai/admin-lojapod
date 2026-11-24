import { useEffect, useState } from "react";
import { Download, Loader2, Radar, Scale, Settings2, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useScale, type ScaleConfig, type ScaleDevice, type ScaleProtocol } from "@/hooks/useScale";
import { formatKg } from "@/lib/weight";

/** Instalador do agente da balança (GitHub Releases do repositório balance-lojapod). */
export const SCALE_AGENT_EXE_URL =
  "https://github.com/thiekokumagai/balance-lojapod/releases/latest/download/balance-agent-setup.exe";

const PROTOCOLS: { value: ScaleProtocol; label: string }[] = [
  { value: "auto", label: "Automático" },
  { value: "toledo", label: "Toledo" },
  { value: "filizola", label: "Filizola" },
  { value: "urano", label: "Urano" },
  { value: "elgin", label: "Elgin" },
  { value: "generic", label: "Genérica (envia o peso sozinha)" },
  { value: "simulator", label: "Simulador (teste sem balança)" },
];
const BAUD_RATES: ScaleConfig["baudRate"][] = [2400, 4800, 9600, 19200];

const DEFAULT_CONFIG: ScaleConfig = {
  port: "auto",
  protocol: "auto",
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
};

/**
 * Card do agente da balança na página Apps (só lojas de comida/açaí).
 * Mostra as balanças conectadas da loja e abre a configuração (porta, marca, velocidade) pela API.
 */
export function ScaleAgentCard() {
  const scale = useScale({ enabled: true });
  const [configuring, setConfiguring] = useState<ScaleDevice | null>(null);

  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-card shadow-md">
      <CardContent className="p-0">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-b from-amber-50/80 to-white border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/30 ring-1 ring-black/5">
              <Scale className="h-10 w-10 drop-shadow" />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Agente de Balança</h3>
                <Badge variant="outline" className="text-[10px] font-semibold border-slate-300 text-slate-600 rounded-full">
                  Windows (.exe)
                </Badge>
              </div>
              <p className="text-sm text-slate-600 max-w-xl">
                Lê o peso da balança do balcão e manda para o PDV em tempo real, em qualquer aparelho da loja.
                Ativa com o <strong>mesmo token da impressora</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0">
            <Button asChild size="lg" className="rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold px-7 gap-2 h-11">
              <a href={SCALE_AGENT_EXE_URL} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Baixar Agente de Balança
              </a>
            </Button>
            <span className="text-[11px] text-muted-foreground font-mono text-center md:text-right">balance-agent-setup.exe</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">Balanças conectadas</h4>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              {scale.status === "online" ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" /> Conectado ao servidor
                </>
              ) : scale.status === "connecting" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Conectando…
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-rose-500" /> Sem conexão
                </>
              )}
            </span>
          </div>

          {scale.devices.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-slate-500" data-testid="no-scales">
              Nenhuma balança conectada. Instale o agente no computador da balança e ative com o token da impressora.
            </p>
          ) : (
            <ul className="divide-y rounded-2xl border">
              {scale.devices.map((d) => (
                <li key={d.deviceId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800">{d.name}</div>
                    <div className="text-xs text-slate-500">
                      {d.config
                        ? `${PROTOCOLS.find((p) => p.value === d.config?.protocol)?.label ?? d.config.protocol} · ${d.config.port} · ${d.config.baudRate} baud`
                        : "Sem configuração"}
                      {d.version && ` · v${d.version}`}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setConfiguring(d)}>
                    <Settings2 className="h-4 w-4" /> Configurar balança
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <ScaleConfigDialog
        device={configuring}
        onClose={() => setConfiguring(null)}
        actions={scale}
      />
    </Card>
  );
}

type ScaleActions = Pick<ReturnType<typeof useScale>, "sendConfig" | "listPorts" | "detect">;

/** Configurar balança: porta, marca e velocidade, com auto-detectar e leitura ao vivo. */
export function ScaleConfigDialog({
  device,
  onClose,
  actions,
}: {
  device: ScaleDevice | null;
  onClose: () => void;
  actions: ScaleActions;
}) {
  const open = !!device;
  const [config, setConfig] = useState<ScaleConfig>(DEFAULT_CONFIG);
  const [ports, setPorts] = useState<{ path: string; label: string }[]>([]);
  const [busy, setBusy] = useState<"ports" | "detect" | "save" | null>(null);
  const [testing, setTesting] = useState(false);
  const live = useScale({ enabled: open && testing, watch: testing, deviceId: device?.deviceId });

  useEffect(() => {
    if (!device) return;
    setConfig(device.config ?? DEFAULT_CONFIG);
    setTesting(false);
    setPorts([]);
    setBusy("ports");
    void actions.listPorts(device.deviceId).then((res) => {
      if (res.ok) setPorts(res.ports);
      setBusy(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega só ao trocar de balança
  }, [device?.deviceId]);

  const portOptions = [{ path: "auto", label: "Automática" }, ...ports];
  if (config.port !== "auto" && !ports.some((p) => p.path === config.port)) {
    portOptions.push({ path: config.port, label: `${config.port} (não encontrada agora)` });
  }

  const handleDetect = async () => {
    if (!device) return;
    setBusy("detect");
    const res = await actions.detect(device.deviceId);
    setBusy(null);
    if (res.ok && res.config) {
      setConfig(res.config);
      toast({ title: "Balança encontrada", description: `${res.config.protocol} em ${res.config.port}. Salve para usar.` });
    } else {
      toast({ variant: "destructive", title: "Balança não encontrada", description: res.ok ? "Nenhuma porta respondeu." : res.error });
    }
  };

  const handleSave = async () => {
    if (!device) return;
    setBusy("save");
    const res = await actions.sendConfig(device.deviceId, config);
    setBusy(null);
    if (res.ok) {
      toast({ title: "Configuração salva na balança" });
      onClose();
    } else {
      toast({ variant: "destructive", title: "Não foi possível salvar", description: res.error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar balança</DialogTitle>
          <DialogDescription>{device?.name}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Porta</Label>
            <Select value={config.port} onValueChange={(port) => setConfig((c) => ({ ...c, port }))}>
              <SelectTrigger aria-label="Porta">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {portOptions.map((p) => (
                  <SelectItem key={p.path} value={p.path}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Marca</Label>
            <Select
              value={config.protocol}
              onValueChange={(protocol) => setConfig((c) => ({ ...c, protocol: protocol as ScaleProtocol }))}
            >
              <SelectTrigger aria-label="Marca">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROTOCOLS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Velocidade (baud)</Label>
            <Select
              value={String(config.baudRate)}
              onValueChange={(v) => setConfig((c) => ({ ...c, baudRate: Number(v) as ScaleConfig["baudRate"] }))}
            >
              <SelectTrigger aria-label="Velocidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAUD_RATES.map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full gap-2" disabled={busy !== null} onClick={handleDetect}>
              {busy === "detect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
              Auto-detectar
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Testar leitura</span>
            <Button type="button" size="sm" variant={testing ? "secondary" : "outline"} onClick={() => setTesting((t) => !t)}>
              {testing ? "Parar" : "Ler agora"}
            </Button>
          </div>
          {testing && (
            <div className="grid grid-cols-2 gap-3 text-sm" data-testid="scale-test-reading">
              <div>
                <div className="text-[11px] text-slate-500">Peso lido</div>
                <div className="text-2xl font-extrabold tabular-nums">
                  {live.reading ? formatKg(live.reading.weightKg) : "—"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {!live.reading ? "Aguardando…" : live.reading.stable ? "Estável" : "Instável"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500">O que a balança mandou</div>
                <code className="block truncate rounded bg-white px-2 py-1 text-xs">{live.reading?.raw ?? "—"}</code>
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-500">A leitura usa a configuração que já está salva na balança.</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy !== null} onClick={handleSave}>
            {busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar na balança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
