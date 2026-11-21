import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSettings,
  updateSettings,
  type UpdateSettingsPayload,
} from "@/services/settings.service";
import { isSuperAdmin } from "@/lib/auth";

export function useSettings(options?: { forceEnable?: boolean }) {
  const superAdmin = isSuperAdmin();
  return useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: options?.forceEnable ? true : !superAdmin,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsPayload) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
