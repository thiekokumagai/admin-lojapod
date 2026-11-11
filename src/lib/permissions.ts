import { getAuthSession, getUserRole } from "@/lib/auth";

/**
 * Catálogo de permissões por tela.
 * Mantenha em sincronia com `api-lojapod/src/modules/auth/permissions/screen-permissions.ts`.
 *
 * `paths` são prefixos de rota: "/produtos" libera "/produtos" e "/produtos/:id".
 * "/" (Dashboard) é comparado de forma exata.
 */
export const SCREEN_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", group: "Geral", paths: ["/"] },
  { key: "links", label: "Página de Links", group: "Geral", paths: ["/marketing/links"] },

  { key: "products", label: "Produtos", group: "Catálogo", paths: ["/produtos"] },
  { key: "combos", label: "Combos", group: "Catálogo", paths: ["/combos"] },
  { key: "order_bumps", label: "Peça também", group: "Catálogo", paths: ["/sugestoes"] },
  { key: "stock_notifications", label: "Avise-me quando chegar", group: "Catálogo", paths: ["/avise-me"] },
  { key: "categories", label: "Categorias", group: "Catálogo", paths: ["/categorias"] },
  { key: "variations", label: "Variações", group: "Catálogo", paths: ["/variacoes"] },
  { key: "coupons", label: "Cupons", group: "Catálogo", paths: ["/cupons"] },

  { key: "orders", label: "Pedidos", group: "Vendas", paths: ["/pedidos"] },
  { key: "loyalty", label: "Cartão Fidelidade", group: "Vendas", paths: ["/fidelidade"] },
  { key: "delivery_map", label: "Mapa de Entregas", group: "Vendas", paths: ["/mapa-entregas", "/entregas/rotas"] },
  { key: "couriers", label: "Motoboys", group: "Vendas", paths: ["/motoboys"] },
  { key: "customers", label: "Clientes", group: "Vendas", paths: ["/clientes"] },

  { key: "cash_current", label: "Caixa Atual", group: "Financeiro", paths: ["/financeiro/atual"] },
  { key: "fixed_costs", label: "Contas Fixas", group: "Financeiro", paths: ["/financeiro/custos-fixos"] },
  { key: "investments", label: "Módulo de Investimento", group: "Financeiro", paths: ["/investimentos"] },
  { key: "cash_history", label: "Histórico de Caixas", group: "Financeiro", paths: ["/caixa"] },

  {
    key: "settings",
    label: "Configurações",
    group: "Configuração",
    paths: ["/configuracoes", "/dominio", "/importacao", "/entregas", "/pagamentos"],
  },
] as const;

export type ScreenPermission = (typeof SCREEN_PERMISSIONS)[number]["key"];

/** Telas que só o administrador da loja acessa (nunca liberadas a funcionários). */
export const ADMIN_ONLY_PATHS = ["/minha-assinatura", "/usuarios"];

export const SCREEN_PERMISSION_GROUPS = Array.from(
  new Set(SCREEN_PERMISSIONS.map((p) => p.group)),
).map((group) => ({
  group,
  items: SCREEN_PERMISSIONS.filter((p) => p.group === group),
}));

function matchesPrefix(pathname: string, prefix: string) {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Funcionário da loja (perfil restrito por permissões). */
export function isStaff() {
  return getUserRole() === "USER";
}

export function getUserPermissions(): string[] {
  return getAuthSession()?.user?.permissions ?? [];
}

/** ADMIN e SUPER_ADMIN sempre podem; funcionários dependem das permissões. */
export function hasPermission(key: string) {
  if (!isStaff()) return true;
  return getUserPermissions().includes(key);
}

/** Verifica se a rota atual pode ser aberta pelo usuário logado. */
export function canAccessPath(pathname: string) {
  if (!isStaff()) return true;
  if (ADMIN_ONLY_PATHS.some((p) => matchesPrefix(pathname, p))) return false;

  const screen = SCREEN_PERMISSIONS.find((s) => s.paths.some((p) => matchesPrefix(pathname, p)));
  // Rotas fora do catálogo (ex.: 404) seguem liberadas
  if (!screen) return true;
  return hasPermission(screen.key);
}

/** Primeira tela liberada para o funcionário, usada como página inicial. */
export function getFirstAllowedPath(): string | null {
  if (!isStaff()) return "/";
  const screen = SCREEN_PERMISSIONS.find((s) => hasPermission(s.key));
  return screen ? screen.paths[0] : null;
}
