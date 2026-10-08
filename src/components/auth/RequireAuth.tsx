import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";
import { getHomePathForRole, type UserRole } from "../../services/authService";

type RequireAuthProps = {
  allowedRoles?: UserRole[];
};

export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = getHomePathForRole(user.role);
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

