import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { LogOut, Menu, Printer, Bell, Store, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const superAdmin = isSuperAdmin();
  const { data: settings } = useSettings();
  const [subdomain, setSubdomain] = useState<string>("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [renewalWarning, setRenewalWarning] = useState<{ daysLeft: number } | null>(null);

  useEffect(() => {
    if (superAdmin) {
      document.title = "Super Admin | Loja Pod";
      return;
    }

    // Verificar se faltam 5 dias ou menos para o vencimento da assinatura da loja
    apiFetch('/billing/my-subscription')
      .then((res) => res.json())
      .then((data) => {
        const sub = data?.subscription;
        if (sub && sub.status !== 'SUSPENDED' && sub.status !== 'CANCELED') {
          const target = sub.currentPeriodEndsAt || sub.trialEndsAt;
          if (target) {
            const exp = new Date(target);
            const now = new Date();
            const diffTime = exp.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Exibir aviso apenas se faltarem 5 dias ou menos (<= 5)
            if (diffDays >= 0 && diffDays <= 5) {
              setRenewalWarning({ daysLeft: diffDays });
            }
          }
        }
      })
      .catch(() => {});

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

          {renewalWarning && !superAdmin && location.pathname !== '/minha-assinatura' && (
            <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-sm border-b border-amber-600">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce text-slate-950" />
                <span>
                  Sua assinatura vence {renewalWarning.daysLeft === 0 ? 'hoje' : `em ${renewalWarning.daysLeft} dia(s)`}! Evite a paralisação das suas vendas.
                </span>
              </div>
              <Button
                onClick={() => navigate('/minha-assinatura')}
                size="sm"
                className="bg-slate-950 text-white hover:bg-slate-900 font-extrabold text-[11px] h-7 px-3 rounded-lg shadow cursor-pointer"
              >
                Renovar Assinatura Agora →
              </Button>
            </div>
          )}

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
