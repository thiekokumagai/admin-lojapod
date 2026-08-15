import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { LogOut, Menu, Printer, Bell, Store, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate } from "react-router-dom";
import { clearSession } from "@/services/auth.service";
import { isSuperAdmin } from "@/lib/auth";
import { apiFetch } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";
import { getStoreUrl } from "@/utils/store-url";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
import { Key } from "lucide-react";

export function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const superAdmin = isSuperAdmin();
  const { data: settings } = useSettings();
  const [subdomain, setSubdomain] = useState<string>("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  useEffect(() => {
    if (superAdmin) {
      document.title = "Super Admin | Loja Pod";
      return;
    }

    if (!superAdmin && settings && (settings as any).storeId) {
      apiFetch(`/stores/${(settings as any).storeId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.subdomain) setSubdomain(data.subdomain);
        })
        .catch(() => {});
    }

    const socketUrl = import.meta.env.VITE_ADMIN_API?.replace(/\/api$/, '') || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('order.new', () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, navigate, superAdmin, settings]);

  const handleLogout = () => {
    queryClient.clear();
    clearSession();
    navigate("/login", { replace: true });
  };

  const handleTestPush = async () => {
    try {
      await apiFetch('/users/test-push', { method: 'POST' });
      toast.success('Teste de notificação enviado!');
    } catch (error) {
      toast.error('Erro ao enviar teste de notificação.');
      console.error(error);
    }
  };

  return (
    <SidebarProvider>
      {!superAdmin && <PushNotificationManager />}
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger>
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            </div>
            <div className="flex items-center gap-3">
              {!superAdmin && (
                <>
                  {subdomain && (
                    <a
                      href={getStoreUrl(subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                      title="Abrir a vitrine da sua loja em nova aba"
                    >
                      <Store className="h-4 w-4 text-indigo-600" />
                      <span className="hidden sm:inline">Acessar Loja</span>
                      <ExternalLink className="h-3 w-3 opacity-75" />
                    </a>
                  )}
                  <a
                    href="https://drive.google.com/file/d/1DB7OmKxWHq559FePfdJHOsLo3yk2LOZY/view?usp=sharing"
                    target="_blank"
                    className="hidden text-sm font-medium text-blue-500 hover:text-blue-600 sm:flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                    title="Baixar Agente de Impressão"
                  >
                    <Printer className="h-4 w-4" />
                  </a>
                  <Button variant="outline" size="icon" onClick={handleTestPush} title="Testar notificação" className="h-8 w-8 shrink-0">
                    <Bell className="h-4 w-4" />
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 pl-3 ml-2 border-l text-sm font-semibold text-slate-700 hover:text-foreground">
                    {superAdmin ? "👑 Super Admin" : "Administrador"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)} className="cursor-pointer gap-2">
                    <Key className="h-4 w-4" />
                    <span>Alterar Senha</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
