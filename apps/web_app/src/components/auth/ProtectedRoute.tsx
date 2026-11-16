import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../ui/Loading';
import { PendingApprovalPage } from '../../pages/PendingApproval';
import { AccessDenied } from './AccessDenied';
import { ShieldAlert } from 'lucide-react';
import { useModuleVisibility } from '../../services/ModuleVisibilityService';
import { LandingResolver } from '../../services/LandingResolver';

export const ProtectedRoute = () => {
  const { user, isAuthenticated, loading, boundaryState } = useAuth();
  const location = useLocation();

  if (loading || boundaryState === 'initializing' || boundaryState === 'switching') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Securing session..." />
      </div>
    );
  }

  // Must be authenticated with active user profile
  if (!isAuthenticated || !user || boundaryState !== 'stable') {
    const redirectState = location.pathname.startsWith('/app/unauthorized')
      ? undefined
      : { from: location };
    return <Navigate to="/login" state={redirectState} replace />;
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
  const normalizedRoles = rawRoles.map((r: string) => LandingResolver.normalizeRole(r));

  // Institutional Staff and Admin roles always bypass the Parent Login Approval Gate
  const isStaffOrAdmin = normalizedRoles.some((r: string) =>
    [
      'ADMIN',
      'ORG_ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'FRONT_OFFICE',
      'FO',
      'FRONT_OFFICE_STAFF',
      'STAFF',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
      'TEACHER',
      'FACULTY',
      'FINANCE',
      'FINANCE_OFFICER',
      'FINANCE_MANAGER',
      'ACCOUNTANT',
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

    const userRoles =
      user.roles && user.roles.length > 0 ? user.roles : [(user as any).role || 'PARENT'];
    const targetRoute = LandingResolver.resolveLandingRoute(userRoles, getVisibleModules(), user);

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
  const { hasPermission, user, hasRole, loading } = useAuth();
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

  const allowed = permissions.some((p) => hasPermission && hasPermission(p));
  if (!allowed) {
    if (fallback) return <>{fallback}</>;

    const userRoles =
      user.roles && user.roles.length > 0 ? user.roles : [(user as any).role || 'PARENT'];
    const targetRoute = LandingResolver.resolveLandingRoute(userRoles, getVisibleModules(), user);

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

function getNormalizedGuardRoles(user: any): string[] {
  const rawRoles = user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || ''];
  return rawRoles.map((r: string) => LandingResolver.normalizeRole(r)).filter(Boolean);
}

function getPersonaFallbackRoute(user: any, currentPathname: string): string {
  const rawRoles = user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || ''];
  const destination = LandingResolver.resolveLandingRoute(rawRoles, [], user);
  if (destination && destination !== currentPathname) {
    return destination;
  }
  return currentPathname === '/app/profile' ? '/app/unauthorized' : '/app/profile';
}

/**
 * Front Office Route Guard
 * Strictly protects all Front Office workspace, desk, and operations routes.
 * Blocks Parent and Student personas before component mounts.
 */
export const FrontOfficeRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loading message="Verifying Front Office access..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRoles = getNormalizedGuardRoles(user);

  const isStaffOrAdmin = normalizedRoles.some((r: string) =>
    [
      'FRONT_OFFICE',
      'FO',
      'FRONT_OFFICE_STAFF',
      'RECEPTIONIST',
      'STAFF',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
      'FINANCE',
      'FINANCE_OFFICER',
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
      'EXAM_CELL',
      'EXAM_CELL_ADMIN',
      'FACULTY',
      'TEACHER',
    ].includes(r),
  );

  if (isStaffOrAdmin) {
    return <>{children}</>;
  }

  return <Navigate to={getPersonaFallbackRoute(user, location.pathname)} replace />;
};

/**
 * Parent Route Guard
 * Strictly protects all Parent portal and self-service admission routes.
 * Blocks Front Office and Admin users before component mounts, redirecting them to their respective workspace.
 */
export const ParentRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loading message="Verifying Parent Portal access..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRoles = getNormalizedGuardRoles(user);

  const hasNonParentPrimaryPersona = normalizedRoles.some((r: string) =>
    [
      'FINANCE',
      'FINANCE_OFFICER',
      'ACCOUNTANT',
      'FINANCE_MANAGER',
      'BURSAR',
      'FRONT_OFFICE',
      'FO',
      'FRONT_OFFICE_STAFF',
      'RECEPTIONIST',
      'STAFF',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
      'TEACHER',
      'FACULTY',
      'EXAM_CELL',
      'EXAM_CELL_ADMIN',
      'STUDENT',
    ].includes(r),
  );

  if (!hasNonParentPrimaryPersona) {
    const isParent = normalizedRoles.some((r: string) =>
      ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
    );
    if (isParent) {
      return <>{children}</>;
    }
  }

  return <Navigate to={getPersonaFallbackRoute(user, location.pathname)} replace />;
};

/**
 * Admin Route Guard
 * Strictly protects system administrator routes.
 */
export const AdminRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loading message="Verifying administrative credentials..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRoles = getNormalizedGuardRoles(user);

  const isAdmin = normalizedRoles.some((r: string) =>
    [
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
    ].includes(r),
  );

  if (isAdmin) {
    return <>{children}</>;
  }

  return <Navigate to={getPersonaFallbackRoute(user, location.pathname)} replace />;
};

export const SuperAdminRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Validating Super Admin authorization..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRoles = getNormalizedGuardRoles(user);

  const isSuperAdmin = normalizedRoles.some((r: string) =>
    ['SUPERADMIN', 'SUPER_ADMIN'].includes(r),
  );

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  return <Navigate to={getPersonaFallbackRoute(user, location.pathname)} replace />;
};

export const TeacherRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Loading Teacher workspace..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRoles = getNormalizedGuardRoles(user);

  const isTeacherOrAdmin = normalizedRoles.some((r: string) =>
    [
      'TEACHER',
      'FACULTY',
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
    ].includes(r),
  );

  if (isTeacherOrAdmin) {
    return <>{children}</>;
  }

  return <Navigate to={getPersonaFallbackRoute(user, location.pathname)} replace />;
};

export const ExamOperationGuard = ({ children }: { children: React.ReactNode }) => {
  const { hasRole } = useAuth();
  const isExamAdmin = hasRole('EXAM_CELL_ADMIN');
  const isAdmin = hasRole('ADMIN');

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

  return <div className="p-10 text-center text-gray-400">Access Denied</div>;
};
