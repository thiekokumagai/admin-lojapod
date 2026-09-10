import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Produtos",
    url: "/produtos",
    icon: Package,
    exact: false,
  },
  {
    title: "Pedidos",
    url: "/pedidos",
    icon: ShoppingBag,
    exact: false,
  },
  {
    title: "Caixa Atual",
    url: "/financeiro/atual",
    icon: Landmark,
    exact: false,
  },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border md:hidden pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="flex h-16 items-center justify-around px-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-all duration-200 select-none",
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                      isActive ? "bg-primary/15 text-primary scale-105" : "text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.75px]")} />
                  </div>
                  <span className="truncate max-w-[76px] leading-tight text-[10px] mt-0.5">
                    {item.title}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
