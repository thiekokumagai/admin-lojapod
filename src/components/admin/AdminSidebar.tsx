import { forwardRef } from "react";
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { buildImageUrl } from "@/utils/image-url";
import { isSuperAdmin } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { superAdminNavItems, dashboardNavItem, marketingLinkItem, navSections } from "@/data/admin-nav";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export function AdminSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const { data: settings } = useSettings();
  const collapsed = state === "collapsed";
  const superAdmin = isSuperAdmin();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-6 flex items-center gap-3">
          {settings?.whiteLogoUrl || settings?.logoUrl ? (
            <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "gap-3")}>
              <img 
                src={buildImageUrl(settings.whiteLogoUrl || settings.logoUrl!)} 
                alt={settings.storeName || "Logo"} 
                className={cn("object-contain", collapsed ? "w-9 h-9 shrink-0" : "w-10 h-10 shrink-0")} 
              />
              {!collapsed && (
                <span className="text-sidebar-foreground font-bold text-lg tracking-tight truncate">
                  {settings.storeName || "Admin"}
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                LP
              </div>
              {!collapsed && (
                <span className="text-sidebar-foreground font-bold text-lg tracking-tight">
                  {superAdmin ? "Super Admin" : "Loja Pod"}
                </span>
              )}
            </>
          )}
        </div>

        {/* MENU SUPER ADMIN EXCLUSIVO */}
        {superAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Painel de Controle</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={handleLinkClick}
                        className="hover:bg-sidebar-accent/60 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <item.icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          /* MENU PADRÃO DA LOJA */
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={dashboardNavItem.url}
                        end
                        onClick={handleLinkClick}
                        className="hover:bg-sidebar-accent/60 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <dashboardNavItem.icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && <span>{dashboardNavItem.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={marketingLinkItem.url}
                        end
                        onClick={handleLinkClick}
                        className="hover:bg-sidebar-accent/60 transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <marketingLinkItem.icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && <span>{marketingLinkItem.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {navSections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            onClick={handleLinkClick}
                            className="hover:bg-sidebar-accent/60 transition-colors"
                            activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                          >
                            <item.icon className="mr-2 h-4 w-4 shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}