import {
  LayoutDashboard,
  Package,
  FolderTree,
  SlidersHorizontal,
  Ticket,
  ShoppingBag,
  Landmark,
  Settings,
  Receipt,
  Users,
  Download,
  MapPin,
  Bike,
  Link as LinkIcon,
  Store as StoreIcon,
} from "lucide-react";

export const superAdminNavItems = [
  {
    title: "Dashboard Super Admin",
    url: "/super-admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lojas Cadastradas",
    url: "/super-admin/lojas",
    icon: StoreIcon,
  },
];

export const dashboardNavItem = {
  title: "Dashboard",
  url: "/",
  icon: LayoutDashboard,
};

export const marketingLinkItem = {
  title: "Página de Links",
  url: "/marketing/links",
  icon: LinkIcon,
};

export const navSections = [
  {
    label: "Catálogo",
    items: [
      { title: "Produtos", url: "/produtos", icon: Package },
      { title: "Categorias", url: "/categorias", icon: FolderTree },
      { title: "Variações", url: "/variacoes", icon: SlidersHorizontal },
      { title: "Cupons", url: "/cupons", icon: Ticket },
    ],
  },
  {
    label: "Vendas",
    items: [
      { title: "Pedidos", url: "/pedidos", icon: ShoppingBag },
      { title: "Mapa de Entregas", url: "/mapa-entregas", icon: MapPin },
      { title: "Motoboys", url: "/motoboys", icon: Bike },
      { title: "Clientes", url: "/clientes", icon: Users },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Caixa Atual", url: "/financeiro/atual", icon: Landmark },
      { title: "Contas Fixas", url: "/financeiro/custos-fixos", icon: Receipt },
      { title: "Módulo de Investimento", url: "/investimentos", icon: Landmark },
      { title: "Histórico de Caixas", url: "/caixa", icon: FolderTree },
    ],
  },
  {
    label: "Configuração",
    items: [
      { title: "Configuração", url: "/configuracoes", icon: Settings },
      { title: "Importações", url: "/importacoes", icon: Download },
    ],
  },
];
