import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { createStoreSocket } from "@/services/socket";

/**
 * Balança pela API (namespace `/scale`). O agente `balance-lojapod` lê a balança no computador do caixa
 * e manda o peso para a API; o PDV recebe aqui, de qualquer aparelho da mesma loja.
 */

export type ScaleProtocol = "auto" | "toledo" | "filizola" | "urano" | "elgin" | "generic" | "simulator";

export interface ScaleConfig {
  port: string;
  protocol: ScaleProtocol;
  baudRate: 2400 | 4800 | 9600 | 19200;
  dataBits: 7 | 8;
  parity: "none" | "even" | "odd";
  stopBits: 1 | 2;
}

export interface ScaleDevice {
  deviceId: string;
  name: string;
  connectedAt: string;
  version: string | null;
  config: ScaleConfig | null;
  drivers: string[];
  lastReading: { weightKg: number; stable: boolean; at: string } | null;
  watching: number;
}

export interface ScaleReading {
  deviceId: string;
  weightKg: number;
  stable: boolean;
  raw?: string;
  /** Hora (do navegador) em que a leitura chegou. */
  receivedAt: number;
}

export type ScaleStatus = "connecting" | "online" | "offline";

type Ack<T> = ({ ok: true } & T) | { ok: false; error: string };

/** Sem leitura nova nesse tempo, o peso é considerado parado (o PDV cai para o modo manual). */
export const SCALE_STALE_MS = 3000;
const LAST_DEVICE_KEY = "lojapod.scale.lastDeviceId";
const ACK_TIMEOUT_MS = 8000;
const DETECT_TIMEOUT_MS = 35000;

export function getLastScaleDeviceId(): string | null {
  try {
    return localStorage.getItem(LAST_DEVICE_KEY);
  } catch {
    return null;
  }
}

function saveLastScaleDeviceId(deviceId: string) {
  try {
    localStorage.setItem(LAST_DEVICE_KEY, deviceId);
  } catch {
    // Navegador sem localStorage (modo privado): só não lembra a última balança
  }
}

/**
 * Conecta ao canal da balança enquanto `enabled` for true.
 * `watch`: acompanhar o peso da balança escolhida (o agente só manda peso enquanto alguém acompanha).
 */
export function useScale({
  enabled,
  watch = false,
  deviceId: fixedDeviceId,
}: {
  enabled: boolean;
  watch?: boolean;
  /** Fixa a balança (tela de configuração) sem mexer na "última usada" do PDV. */
  deviceId?: string;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ScaleStatus>("connecting");
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [deviceId, setDeviceIdState] = useState<string | null>(() => getLastScaleDeviceId());
  const [reading, setReading] = useState<ScaleReading | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const socket = createStoreSocket("/scale");
    socketRef.current = socket;
    setStatus("connecting");

    socket.on("connect", () => setStatus("online"));
    socket.on("disconnect", () => setStatus("offline"));
    socket.on("connect_error", () => setStatus("offline"));
    socket.on("auth_error", () => setStatus("offline"));
    socket.on("scale.list", (list: ScaleDevice[]) => setDevices(Array.isArray(list) ? list : []));
    socket.on("scale.weight", (r: Omit<ScaleReading, "receivedAt">) => {
      if (r && typeof r.weightKg === "number") setReading({ ...r, receivedAt: Date.now() });
    });
    socket.on("scale.offline", ({ deviceId: gone }: { deviceId: string }) => {
      setReading((prev) => (prev?.deviceId === gone ? null : prev));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setDevices([]);
      setReading(null);
    };
  }, [enabled]);

  // Balança escolhida: a última usada neste aparelho; se ela não estiver conectada, a primeira da lista.
  const selected = fixedDeviceId
    ? devices.find((d) => d.deviceId === fixedDeviceId) ?? null
    : devices.find((d) => d.deviceId === deviceId) ?? devices[0] ?? null;
  const selectedId = selected?.deviceId ?? null;

  useEffect(() => {
    const socket = socketRef.current;
    if (!enabled || !watch || !socket || status !== "online" || !selectedId) return;
    setReading(null);
    socket.emit("scale.watch", { deviceId: selectedId }, (res: Ack<{ lastReading: ScaleDevice["lastReading"] }>) => {
      if (res?.ok && res.lastReading) {
        // Leitura de antes de começar a acompanhar: serve para mostrar, mas conta como "parada"
        setReading({
          deviceId: selectedId,
          weightKg: res.lastReading.weightKg,
          stable: res.lastReading.stable,
          receivedAt: 0,
        });
      }
    });
    return () => {
      socket.emit("scale.unwatch", { deviceId: selectedId });
    };
  }, [enabled, watch, status, selectedId]);

  // Relógio para saber se o peso parou de chegar
  useEffect(() => {
    if (!enabled || !watch) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [enabled, watch]);

  const setDeviceId = useCallback((id: string) => {
    setDeviceIdState(id);
    saveLastScaleDeviceId(id);
  }, []);

  const ask = useCallback(
    async <T,>(event: string, payload: object, timeoutMs = ACK_TIMEOUT_MS): Promise<Ack<T>> => {
      const socket = socketRef.current;
      if (!socket?.connected) return { ok: false, error: "Sem conexão com o servidor." };
      try {
        return (await socket.timeout(timeoutMs).emitWithAck(event, payload)) as Ack<T>;
      } catch {
        return { ok: false, error: "O servidor não respondeu a tempo." };
      }
    },
    [],
  );

  const currentReading = reading && reading.deviceId === selectedId ? reading : null;
  const isFresh = !!currentReading && now - currentReading.receivedAt <= SCALE_STALE_MS;

  return {
    status,
    devices,
    selected,
    setDeviceId,
    reading: currentReading,
    /** O peso está chegando (última leitura há menos de 3 s). */
    isFresh,
    sendConfig: (id: string, config: ScaleConfig) => ask<{ config: ScaleConfig }>("scale.config", { deviceId: id, config }),
    listPorts: (id: string) => ask<{ ports: { path: string; label: string }[] }>("scale.ports", { deviceId: id }),
    detect: (id: string) => ask<{ config: ScaleConfig | null }>("scale.detect", { deviceId: id }, DETECT_TIMEOUT_MS),
  };
}
