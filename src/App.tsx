import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { isSuperAdmin } from "@/lib/auth";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const SuperAdminDashboardPage = lazy(() => import("@/pages/SuperAdminDashboardPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const CreateOrderPage = lazy(() => import("@/pages/CreateOrderPage"));
const EditOrderPage = lazy(() => import("@/pages/EditOrderPage"));
const OrderDetailsPage = lazy(() => import("@/pages/OrderDetailsPage"));
const DeliveryMapPage = lazy(() => import("@/pages/DeliveryMapPage"));
const CouriersPage = lazy(() => import("@/pages/CouriersPage"));
const CourierDetailsPage = lazy(() => import("@/pages/CourierDetailsPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const CustomerDetailsPage = lazy(() => import("@/pages/CustomerDetailsPage"));
const ProductDetailsPage = lazy(() => import("@/pages/ProductDetailsPage"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const CouponsPage = lazy(() => import("@/pages/CouponsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const LinksManagerPage = lazy(() => import("@/pages/LinksManagerPage"));
const CashRegistersPage = lazy(() => import("@/pages/CashRegistersPage"));
const CashRegisterDetailsPage = lazy(() => import("@/pages/CashRegisterDetailsPage"));
const CurrentCashRegisterPage = lazy(() => import("@/pages/CurrentCashRegisterPage"));
const CustosFixosPage = lazy(() => import("@/pages/CustosFixosPage"));
const InvestmentsPage = lazy(() => import("@/pages/InvestmentsPage"));
const PurchaseAnalysisPage = lazy(() => import("@/pages/PurchaseAnalysisPage"));
const VariationPage = lazy(() => import("@/pages/VariationPage"));
const VariationDetailsPage = lazy(() => import("@/pages/VariationDetailsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SuperAdminStoresPage = lazy(() => import("@/pages/SuperAdminStoresPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const OrderPrintPage = lazy(() => import("@/pages/OrderPrintPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true" aria-label="Carregando">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function RootDashboard() {
  if (isSuperAdmin()) {
    return <SuperAdminDashboardPage />;
  }
  return <DashboardPage />;
}

import GoogleMapsLoader from "@/components/GoogleMapsLoader";
import { DynamicFavicon } from "@/components/DynamicFavicon";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

const App = () => (
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
              
              {/* Rotas exclusivas do Super Admin */}
              <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
                  <Route path="/super-admin/lojas" element={<SuperAdminStoresPage />} />
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
                  <Route path="/mapa-entregas" element={<DeliveryMapPage />} />
                  <Route path="/entregas/rotas" element={<DeliveryMapPage />} />
                  <Route path="/motoboys" element={<CouriersPage />} />
                  <Route path="/motoboys/:id" element={<CourierDetailsPage />} />
                  <Route path="/clientes" element={<CustomersPage />} />
                  <Route path="/clientes/:id" element={<CustomerDetailsPage />} />
                  <Route path="/produtos" element={<ProductsPage />} />
                  <Route path="/produtos/:id" element={<ProductDetailsPage />} />
                  <Route path="/categorias" element={<CategoriesPage />} />
                  <Route path="/cupons" element={<CouponsPage />} />
                  <Route path="/entregas" element={<Navigate to="/configuracoes" replace />} />
                  <Route path="/pagamentos" element={<Navigate to="/configuracoes" replace />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                  <Route path="/marketing/links" element={<LinksManagerPage />} />
                  <Route path="/caixa" element={<CashRegistersPage />} />
                  <Route path="/caixa/:id" element={<CashRegisterDetailsPage />} />
                  <Route path="/financeiro/atual" element={<CurrentCashRegisterPage />} />
                  <Route path="/financeiro/custos-fixos" element={<CustosFixosPage />} />
                  <Route path="/investimentos" element={<InvestmentsPage />} />
                  <Route path="/investimentos/simulacao" element={<PurchaseAnalysisPage />} />
                  <Route path="/variacoes" element={<VariationPage />} />
                  <Route path="/variacoes/:id" element={<VariationDetailsPage />} />
                </Route>
              </Route>

            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
