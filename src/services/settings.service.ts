import { apiFetch } from "./api";
import { StoreSettings } from "@/types/settings";

export async function getSettings(): Promise<StoreSettings> {
  const response = await apiFetch("/settings");
  const data = await response.json();
  
  let searchCity = "Campo Grande";
  let searchSuffix = ", Campo Grande, MS, Brasil";
  const allowAboveMax = data.deliveryRanges?.allowAboveMax;

  if (data.deliveryOriginCep) {
    try {
      const cleanCep = data.deliveryOriginCep.replace(/\D/g, "");
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const viaCepData = await viaCepRes.json();
      if (!viaCepData.erro) {
        searchCity = viaCepData.localidade;
        const state = viaCepData.uf;
        searchSuffix = allowAboveMax ? ", Brasil" : `, ${searchCity}, ${state}, Brasil`;
      } else if (allowAboveMax) {
        searchSuffix = ", Brasil";
      }
    } catch (e) {
      if (allowAboveMax) searchSuffix = ", Brasil";
    }
  } else if (allowAboveMax) {
    searchSuffix = ", Brasil";
  }

  return { ...data, searchSuffix, searchCity };
}

export async function updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
  const response = await apiFetch("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function uploadSettingsMedia(file: File): Promise<{ url: string; fileName: string }> {
  const body = new FormData();
  body.append("file", file);

  const response = await apiFetch("/settings/upload", {
    method: "POST",
    body,
  });
  return response.json();
}

export async function uploadFavicon(file: File): Promise<{
  url: string;
  fileName: string;
  icon192: string;
  icon512: string;
}> {
  const body = new FormData();
  body.append("file", file);

  const response = await apiFetch("/settings/upload/favicon", {
    method: "POST",
    body,
  });
  return response.json();
}
