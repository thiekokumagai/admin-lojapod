import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/services/settings.service";
import { StoreSettings } from "@/types/settings";
import { isSuperAdmin } from "@/lib/auth";

export function useSettings() {
  const superAdmin = isSuperAdmin();
  return useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: !superAdmin,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<StoreSettings>) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
