import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScaleAgentCard, SCALE_AGENT_EXE_URL } from "./ScaleAgentCard";

const sendConfig = vi.fn();
const listPorts = vi.fn();
const detect = vi.fn();
let devices: any[] = [];

vi.mock("@/hooks/useScale", () => ({
  useScale: () => ({
    status: "online",
    devices,
    selected: devices[0] ?? null,
    reading: null,
    isFresh: false,
    setDeviceId: vi.fn(),
    sendConfig,
    listPorts,
    detect,
  }),
}));
vi.mock("@/components/ui/use-toast", () => ({ toast: vi.fn() }));

describe("ScaleAgentCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devices = [];
    listPorts.mockResolvedValue({ ok: true, ports: [{ path: "COM3", label: "USB Serial (COM3)" }] });
  });

  it("mostra o download do agente e avisa quando não há balança", () => {
    render(<ScaleAgentCard />);
    expect(screen.getByRole("link", { name: /Baixar Agente de Balança/ })).toHaveAttribute("href", SCALE_AGENT_EXE_URL);
    expect(screen.getByTestId("no-scales")).toBeInTheDocument();
  });

  it("configurar: lista as portas do agente e salva na balança", async () => {
    devices = [
      {
        deviceId: "caixa-1",
        name: "Balança Caixa 1",
        version: "1.0.0",
        config: { port: "COM3", protocol: "toledo", baudRate: 9600, dataBits: 8, parity: "none", stopBits: 1 },
        drivers: [],
        lastReading: null,
        watching: 0,
        connectedAt: "",
      },
    ];
    sendConfig.mockResolvedValue({ ok: true, config: devices[0].config });
    render(<ScaleAgentCard />);
    expect(screen.getByText(/Toledo · COM3 · 9600 baud/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Configurar balança/ }));
    await waitFor(() => expect(listPorts).toHaveBeenCalledWith("caixa-1"));

    fireEvent.click(screen.getByRole("button", { name: "Salvar na balança" }));
    await waitFor(() =>
      expect(sendConfig).toHaveBeenCalledWith("caixa-1", {
        port: "COM3",
        protocol: "toledo",
        baudRate: 9600,
        dataBits: 8,
        parity: "none",
        stopBits: 1,
      }),
    );
  });

  it("auto-detectar preenche a configuração encontrada", async () => {
    devices = [{ deviceId: "caixa-1", name: "Caixa 1", config: null, drivers: [], lastReading: null, watching: 0, version: null, connectedAt: "" }];
    detect.mockResolvedValue({
      ok: true,
      config: { port: "COM4", protocol: "filizola", baudRate: 4800, dataBits: 8, parity: "none", stopBits: 1 },
    });
    sendConfig.mockResolvedValue({ ok: true });
    render(<ScaleAgentCard />);
    fireEvent.click(screen.getByRole("button", { name: /Configurar balança/ }));
    await waitFor(() => expect(listPorts).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Auto-detectar/ }));
    await waitFor(() => expect(detect).toHaveBeenCalledWith("caixa-1"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar na balança" }));
    await waitFor(() =>
      expect(sendConfig).toHaveBeenCalledWith("caixa-1", expect.objectContaining({ port: "COM4", protocol: "filizola", baudRate: 4800 })),
    );
  });
});
