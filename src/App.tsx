import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { isSuperAdmin } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import GoogleMapsLoader from "@/components/GoogleMapsLoader";
import { DynamicFavicon } from "@/components/DynamicFavicon";

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      // Se falhar o carregamento dinâmico do chunk no celular por perda de rede ou atualização de hash
      const retryKey = "chunk_retry_" + (typeof window !== "undefined" ? window.location.pathname : "");
      const hasReloaded = typeof window !== "undefined" ? sessionStorage.getItem(retryKey) : null;
      if (!hasReloaded && typeof window !== "undefined") {
        sessionStorage.setItem(retryKey, "true");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(retryKey);
      }
      throw error;
    }
  });
}

const DashboardPage = lazyWithRetry(() => import("@/pages/DashboardPage"));
const SuperAdminDashboardPage = lazyWithRetry(() => import("@/pages/SuperAdminDashboardPage"));
const OrdersPage = lazyWithRetry(() => import("@/pages/OrdersPage"));
const CreateOrderPage = lazyWithRetry(() => import("@/pages/CreateOrderPage"));
const EditOrderPage = lazyWithRetry(() => import("@/pages/EditOrderPage"));
const OrderDetailsPage = lazyWithRetry(() => import("@/pages/OrderDetailsPage"));
const DeliveryMapPage = lazyWithRetry(() => import("@/pages/DeliveryMapPage"));
const CouriersPage = lazyWithRetry(() => import("@/pages/CouriersPage"));
const CourierDetailsPage = lazyWithRetry(() => import("@/pages/CourierDetailsPage"));
const ProductsPage = lazyWithRetry(() => import("@/pages/ProductsPage"));
const CombosPage = lazyWithRetry(() => import("@/pages/CombosPage"));
const ComboDetailsPage = lazyWithRetry(() => import("@/pages/ComboDetailsPage"));
const CustomersPage = lazyWithRetry(() => import("@/pages/CustomersPage"));
const CustomerDetailsPage = lazyWithRetry(() => import("@/pages/CustomerDetailsPage"));
const ProductDetailsPage = lazyWithRetry(() => import("@/pages/ProductDetailsPage"));
const CategoriesPage = lazyWithRetry(() => import("@/pages/CategoriesPage"));
const CouponsPage = lazyWithRetry(() => import("@/pages/CouponsPage"));
const SettingsPage = lazyWithRetry(() => import("@/pages/SettingsPage"));
const LinksManagerPage = lazyWithRetry(() => import("@/pages/LinksManagerPage"));
const CashRegistersPage = lazyWithRetry(() => import("@/pages/CashRegistersPage"));
const CashRegisterDetailsPage = lazyWithRetry(() => import("@/pages/CashRegisterDetailsPage"));
const CurrentCashRegisterPage = lazyWithRetry(() => import("@/pages/CurrentCashRegisterPage"));
const CustosFixosPage = lazyWithRetry(() => import("@/pages/CustosFixosPage"));
const InvestmentsPage = lazyWithRetry(() => import("@/pages/InvestmentsPage"));
const PurchaseAnalysisPage = lazyWithRetry(() => import("@/pages/PurchaseAnalysisPage"));
const VariationPage = lazyWithRetry(() => import("@/pages/VariationPage"));
const VariationDetailsPage = lazyWithRetry(() => import("@/pages/VariationDetailsPage"));
const LoginPage = lazyWithRetry(() => import("@/pages/LoginPage"));
const SuperAdminStoresPage = lazyWithRetry(() => import("@/pages/SuperAdminStoresPage"));
const SuperAdminBillingPage = lazyWithRetry(() => import("@/pages/SuperAdminBillingPage"));
const SuperAdminTransactionsPage = lazyWithRetry(() => import("@/pages/SuperAdminTransactionsPage"));
const SuperAdminPlansPage = lazyWithRetry(() => import("@/pages/SuperAdminPlansPage"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));
const OrderPrintPage = lazyWithRetry(() => import("@/pages/OrderPrintPage"));
const BillingPage = lazyWithRetry(() => import("@/pages/BillingPage"));
const SuspendedStorePage = lazyWithRetry(() => import("@/pages/SuspendedStorePage"));
const ImportacaoPage = lazyWithRetry(() => import("@/pages/ImportacaoPage"));
const DomainPage = lazyWithRetry(() => import("@/pages/DomainPage"));
const StockNotificationsPage = lazyWithRetry(() => import("@/pages/StockNotificationsPage"));
const LoyaltyPage = lazyWithRetry(() => import("@/pages/LoyaltyPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true" aria-label="Carregando">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <GoogleMapsLoader />
      <DynamicFavicon />
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/suspended" element={<SuspendedStorePage />} />
                
                {/* Rotas exclusivas do Super Admin */}
                <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
                    <Route path="/super-admin/lojas" element={<SuperAdminStoresPage />} />
                    <Route path="/super-admin/assinaturas" element={<SuperAdminBillingPage />} />
                    <Route path="/super-admin/transacoes" element={<SuperAdminTransactionsPage />} />
                    <Route path="/super-admin/planos" element={<SuperAdminPlansPage />} />
                  </Route>
                </Route>

                {/* Rotas exclusivas do Admin da Loja */}
                <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                  <Route path="/pedidos/:id/imprimir" element={<OrderPrintPage />} />
                  <Route element={<AdminLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/pedidos" element={<OrdersPage />} />
                    <Route path="/pedidos/novo" element={<CreateOrderPage />} />
                    <Route path="/pedidos/:id/editar" element={<EditOrderPage />} />
                    <Route path="/pedidos/:id" element={<OrderDetailsPage />} />
                    <Route path="/fidelidade" element={<LoyaltyPage />} />
                    <Route path="/mapa-entregas" element={<DeliveryMapPage />} />
                    <Route path="/entregas/rotas" element={<DeliveryMapPage />} />
                    <Route path="/motoboys" element={<CouriersPage />} />
                    <Route path="/motoboys/:id" element={<CourierDetailsPage />} />
                    <Route path="/clientes" element={<CustomersPage />} />
                    <Route path="/clientes/:id" element={<CustomerDetailsPage />} />
                    <Route path="/produtos" element={<ProductsPage />} />
                    <Route path="/produtos/:id" element={<ProductDetailsPage />} />
                    <Route path="/combos" element={<CombosPage />} />
                    <Route path="/combos/:id" element={<ComboDetailsPage />} />
                    <Route path="/avise-me" element={<StockNotificationsPage />} />
                    <Route path="/categorias" element={<CategoriesPage />} />
                    <Route path="/cupons" element={<CouponsPage />} />
                    <Route path="/entregas" element={<Navigate to="/configuracoes" replace />} />
                    <Route path="/pagamentos" element={<Navigate to="/configuracoes" replace />} />
                    <Route path="/configuracoes" element={<SettingsPage />} />
                    <Route path="/minha-assinatura" element={<BillingPage />} />
                    <Route path="/marketing/links" element={<LinksManagerPage />} />
                    <Route path="/caixa" element={<CashRegistersPage />} />
                    <Route path="/caixa/:id" element={<CashRegisterDetailsPage />} />
                    <Route path="/financeiro/atual" element={<CurrentCashRegisterPage />} />
                    <Route path="/financeiro/custos-fixos" element={<CustosFixosPage />} />
                    <Route path="/investimentos" element={<InvestmentsPage />} />
                    <Route path="/investimentos/simulacao" element={<PurchaseAnalysisPage />} />
                    <Route path="/investimentos/analise-compras" element={<PurchaseAnalysisPage />} />
                    <Route path="/variacoes" element={<VariationPage />} />
                    <Route path="/variacoes/:id" element={<VariationDetailsPage />} />
                    <Route path="/importacao" element={<ImportacaoPage />} />
                    <Route path="/dominio" element={<DomainPage />} />
                  </Route>
                </Route>

              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
