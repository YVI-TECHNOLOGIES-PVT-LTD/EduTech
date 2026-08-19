import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../ui/Loading';
import { PendingApprovalPage } from '../../pages/PendingApproval';
import { AccessDenied } from './AccessDenied';
import { ShieldAlert } from 'lucide-react';
import { useModuleVisibility } from '../../services/ModuleVisibilityService';
import { LandingResolver } from '../../services/LandingResolver';

export const ProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Securing session..." />
      </div>
    );
  }

  // Must be authenticated with active user profile
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <LoginApprovalGate>
      <Outlet />
    </LoginApprovalGate>
  );
};

export const LoginApprovalGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Resolve user roles canonically
  const rawRoles =
    user.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const normalizedRoles = rawRoles.map((r: string) => r.toUpperCase().replace(/[\s_-]+/g, '_'));

  // Institutional Staff and Admin roles always bypass the Parent Login Approval Gate
  const isStaffOrAdmin = normalizedRoles.some((r: string) =>
    [
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'FRONT_OFFICE',
      'FO',
      'FRONT_OFFICE_STAFF',
      'STAFF',
      'ADMISSION_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
      'TEACHER',
      'FINANCE',
      'FINANCE_OFFICER',
      'EXAM_CELL_ADMIN',
      'EXAM_CELL',
    ].includes(r),
  );

  if (isStaffOrAdmin) {
    return <>{children}</>;
  }

  // Only PARENT persona accounts are evaluated for admission login approval status
  const isParent = normalizedRoles.includes('PARENT');
  if (isParent) {
    // Define paths that are allowed for PENDING/REJECTED parents to view admission status
    const allowedPaths = [
      '/app/admissions/my',
      '/app/admissions/status',
      '/app/admissions/wizard',
      '/app/parent',
    ];
    const isAllowedPath = allowedPaths.some((path) => location.pathname.startsWith(path));

    // If parent's login status is PENDING, REJECTED, or BLOCKED and not on allowed path
    if (user.login_status && user.login_status !== 'APPROVED' && !isAllowedPath) {
      return <PendingApprovalPage />;
    }
  }

  return <>{children}</>;
};

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard = ({ permission, children, fallback }: PermissionGuardProps) => {
  const { hasPermission, user, loading, hasRole } = useAuth();
  const location = useLocation();
  const { getVisibleModules } = useModuleVisibility();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Verifying permissions..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission || !hasPermission(permission)) {
    if (fallback) return <>{fallback}</>;

    // PARENT persona fallback route is always parent portal
    if (hasRole('PARENT')) {
      if (
        location.pathname.startsWith('/app/admissions/my') ||
        location.pathname.startsWith('/app/admissions/wizard') ||
        location.pathname.startsWith('/app/parent')
      ) {
        return <>{children}</>;
      }
      return <Navigate to="/app/admissions/my" replace />;
    }

    const visible = getVisibleModules();
    const targetRoute = LandingResolver.resolveLandingRoute(visible);

    if (location.pathname === targetRoute) {
      return <Navigate to="/app/unauthorized" replace />;
    }

    console.warn(
      `[Route Guard] Access to ${location.pathname} denied. Redirecting to landing: ${targetRoute}`,
    );
    return <Navigate to={targetRoute} replace />;
  }

  return <>{children}</>;
};

interface AnyPermissionGuardProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Passes when the user holds at least one of the listed permissions. */
export const AnyPermissionGuard = ({
  permissions,
  children,
  fallback,
}: AnyPermissionGuardProps) => {
  const { hasPermission, user, hasRole } = useAuth();
  const location = useLocation();
  const { getVisibleModules } = useModuleVisibility();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowed = permissions.some((p) => hasPermission && hasPermission(p));
  if (!allowed) {
    if (fallback) return <>{fallback}</>;

    // PARENT persona fallback route is always parent portal
    if (hasRole('PARENT')) {
      if (
        location.pathname.startsWith('/app/admissions/my') ||
        location.pathname.startsWith('/app/admissions/wizard') ||
        location.pathname.startsWith('/app/parent')
      ) {
        return <>{children}</>;
      }
      return <Navigate to="/app/admissions/my" replace />;
    }

    const visible = getVisibleModules();
    const targetRoute = LandingResolver.resolveLandingRoute(visible);

    if (location.pathname === targetRoute) {
      return <Navigate to="/app/unauthorized" replace />;
    }

    console.warn(
      `[Route Guard] Access to ${location.pathname} denied. Redirecting to landing: ${targetRoute}`,
    );
    return <Navigate to={targetRoute} replace />;
  }

  return <>{children}</>;
};

export const ExamOperationGuard = ({ children }: { children: React.ReactNode }) => {
  const { hasRole } = useAuth();
  const isExamAdmin = hasRole('EXAM_CELL_ADMIN');
  const isAdmin = hasRole('ADMIN');

  // ONLY EXAM_CELL_ADMIN is allowed to see the content.
  // Admin is specifically blocked *from this view* even if they have DB permissions.
  // This frontend guard enforces the "Separation of Duty".

  // Logic:
  // If isExamAdmin -> Allowed (Primary Operator)
  // If NOT isExamAdmin AND isAdmin -> Blocked (Restricted Access)
  // If neither -> Blocked (Standard Auth)

  if (isExamAdmin) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Restricted Area</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          This module is managed exclusively by the <strong>Examination Cell</strong>. As a System
          Administrator, you have overview access but cannot perform operations here.
        </p>
        <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-xs font-mono text-gray-500">
          Role: ADMIN (Operational Access Denied)
        </div>
      </div>
    );
  }

  // Fallback for others (will likely be empty or 404 handled by router)
  // But safely return null or Permission denied if they somehow got here
  return <div className="p-10 text-center text-gray-400">Access Denied</div>;
};
