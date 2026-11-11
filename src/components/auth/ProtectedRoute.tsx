import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated, getUserRole, type UserRole } from "@/lib/auth";
import { canAccessPath, getFirstAllowedPath } from "@/lib/permissions";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  /** Aplica as permissões por tela para funcionários (role USER). */
  checkScreenPermissions?: boolean;
}

export function ProtectedRoute({ allowedRoles, checkScreenPermissions }: ProtectedRouteProps = {}) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = getUserRole();

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      const fallbackUrl = role === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/";
      return <Navigate to={fallbackUrl} replace />;
    }
  }

  if (checkScreenPermissions && !canAccessPath(location.pathname)) {
    const fallbackUrl = getFirstAllowedPath() ?? "/sem-acesso";
    if (fallbackUrl !== location.pathname) {
      return <Navigate to={fallbackUrl} replace />;
    }
    return <Navigate to="/sem-acesso" replace />;
  }

  return (
    <>
      <PWAUpdatePrompt />
      <Outlet />
    </>
  );
}
