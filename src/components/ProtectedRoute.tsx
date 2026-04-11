import { useAuth, AppRole } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: AppRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in → send to login
  if (!user) return <Navigate to="/login" replace />;

  // Role restriction check
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2 px-4">
          <p className="text-lg font-semibold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view this page.
          </p>
          <p className="text-xs text-muted-foreground">
            Your role: <span className="font-medium capitalize">{role ?? "unassigned"}</span>
          </p>
        </div>
      </div>
    );
  }

  // If no role assigned yet (new sign-up), show pending message
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2 px-4 max-w-sm">
          <p className="text-lg font-semibold text-foreground">Account Pending</p>
          <p className="text-sm text-muted-foreground">
            Your account has been created. Please wait for an admin to assign your role before you can access the system.
          </p>
        </div>
      </div>
    );
  }

  // Render children (when wrapping a layout) or Outlet (when used as route wrapper)
  return <>{children ?? <Outlet />}</>;
}