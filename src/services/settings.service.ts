import { apiFetch } from "./api";
import { StoreSettings } from "@/types/settings";

export async function getSettings(): Promise<StoreSettings> {
  const response = await apiFetch("/settings");
  return response.json();
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
