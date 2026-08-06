import { apiFetch } from "@/services/api";
import type { Variation, VariationFormValues } from "@/types/variation";

type VariationApiResponse = {
  id: string;
  title: string;
  options: Array<{
    id: string;
    value: string;
  }>;
};

function normalizeVariation(item: VariationApiResponse): Variation {
  return {
    id: item.id,
    title: item.title,
    options: item.options ?? [],
  };
}

export async function getVariations(): Promise<Variation[]> {
  const response = await apiFetch("/variations");
  const data = (await response.json()) as VariationApiResponse[];
  return data.map(normalizeVariation);
}

export async function createVariation(payload: VariationFormValues): Promise<Variation> {
  const response = await apiFetch("/variations", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      options: payload.options,
    }),
  });

  const data = (await response.json()) as VariationApiResponse;
  return normalizeVariation(data);
}

export async function updateVariation(id: string, payload: VariationFormValues): Promise<Variation> {
  const response = await apiFetch(`/variations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: payload.title,
      options: payload.options,
    }),
  });

  const data = (await response.json()) as VariationApiResponse;
  return normalizeVariation(data);
}

export async function deleteVariation(id: string): Promise<void> {
  await apiFetch(`/variations/${id}`, {
    method: "DELETE",
  });
}

export async function updateVariationOrderBatch(
  items: { id: string; order: number }[]
) {
  const response = await apiFetch("/variations/batch/order", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });

  return response.json();
}