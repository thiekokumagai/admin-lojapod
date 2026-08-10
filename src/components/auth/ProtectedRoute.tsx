import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

export function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <PWAUpdatePrompt />
      <Outlet />
    </>
  );
}
