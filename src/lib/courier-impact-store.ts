import { useSyncExternalStore } from "react";
import type { CourierImpact } from "@/types/courier-impact";

/**
 * Fila dos avisos "ajustar taxa do motoboy" (cancelou/reativou pedido que estava numa rota).
 * Fica fora do React para qualquer tela (lista, kanban, drawer, detalhe) disparar o mesmo modal global.
 */
let queue: CourierImpact[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function showCourierImpact(impact: CourierImpact | null | undefined) {
  if (!impact?.transactionId) return;
  queue = [...queue, impact];
  emit();
}

export function dismissCourierImpact() {
  queue = queue.slice(1);
  emit();
}

export function clearCourierImpacts() {
  queue = [];
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Aviso que está na frente da fila (ou null). */
export function useCourierImpact(): CourierImpact | null {
  return useSyncExternalStore(
    subscribe,
    () => queue[0] ?? null,
    () => null,
  );
}
