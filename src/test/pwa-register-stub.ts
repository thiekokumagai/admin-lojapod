// Stub do módulo virtual do vite-plugin-pwa, que só existe no build do Vite.
// Os testes sobrescrevem com vi.mock("virtual:pwa-register/react").
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (v: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (v: boolean) => void],
    updateServiceWorker: async () => {},
  };
}
