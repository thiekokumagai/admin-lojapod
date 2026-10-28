import { apiFetch } from "./api";
import { StoreSettings } from "@/types/settings";

export async function getSettings(): Promise<StoreSettings> {
  const response = await apiFetch("/settings");
  const data = await response.json();
  
  let searchCity = data.city || "";
  let searchState = data.state || "";

  const cepToLookup = (data.deliveryOriginCep || data.cep || "").replace(/\D/g, "");

  if ((!searchCity || !searchState) && cepToLookup.length >= 8) {
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepToLookup}/json/`);
      const viaCepData = await viaCepRes.json();
      if (!viaCepData.erro) {
        searchCity = searchCity || viaCepData.localidade;
        searchState = searchState || viaCepData.uf;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!searchCity) {
    searchCity = "Campo Grande";
    searchState = "MS";
  }

  const customMaxKm = data.deliveryRanges?.maxDeliveryKm !== undefined && data.deliveryRanges?.maxDeliveryKm !== null
    ? Number(data.deliveryRanges.maxDeliveryKm)
    : 0;
  const hasRanges = Array.isArray(data.deliveryRanges?.ranges) && data.deliveryRanges.ranges.length > 0;
  const allowAboveMax = Boolean(data.deliveryRanges?.allowAboveMax);

  const hasRadiusRestriction = customMaxKm > 0 || (hasRanges && !allowAboveMax) || (!allowAboveMax && data.deliveryType === "DISTANCE");
  const restrictToCity = hasRadiusRestriction;

  const searchSuffix = restrictToCity
    ? `, ${searchCity}, ${searchState}, Brasil`
    : ", Brasil";

  return { ...data, searchSuffix, searchCity, searchState, restrictToCity };
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
