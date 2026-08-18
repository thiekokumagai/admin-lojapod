import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated, getUserRole } from "@/lib/auth";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

interface ProtectedRouteProps {
  allowedRoles?: Array<"SUPER_ADMIN" | "ADMIN">;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getUserRole();
    if (!allowedRoles.includes(role)) {
      const fallbackUrl = role === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/";
      return <Navigate to={fallbackUrl} replace />;
    }
  }

  return (
    <>
      <PWAUpdatePrompt />
      <Outlet />
    </>
  );
}
