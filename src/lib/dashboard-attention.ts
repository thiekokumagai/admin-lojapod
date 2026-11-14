import type { DiagnosisItem } from "@/services/dashboard.service";

export const ATTENTION_MAX_ITEMS = 3;

/** Só o que pede ação (crítico e atenção), na ordem do diagnóstico (gravidade e valor em R$). */
export function pickAttentionItems(items: DiagnosisItem[] | undefined, max = ATTENTION_MAX_ITEMS): DiagnosisItem[] {
  return (items ?? []).filter((i) => i.severity === "critical" || i.severity === "warning").slice(0, max);
}
