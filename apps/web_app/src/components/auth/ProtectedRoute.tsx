
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../ui/Loading';
import { PendingApprovalPage } from '../../pages/PendingApproval';
import { AccessDenied } from './AccessDenied';
import { ShieldAlert } from 'lucide-react';
import { useModuleVisibility } from '../../services/ModuleVisibilityService';
import { LandingResolver } from '../../services/LandingResolver';

export const ProtectedRoute = () => {
    const { user, loading, session } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading message="Securing session..." />
            </div>
        );
    }

    // Check Supabase session AND Backend Profile
    if (!session || !user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <LoginApprovalGate>
            <Outlet />
        </LoginApprovalGate>
    );
};

export const LoginApprovalGate = ({ children }: { children: React.ReactNode }) => {
    const { user, hasRole } = useAuth();
    const location = useLocation();

    if (!user) return null;

    // Admins and Exam Cell Admins always bypass the gate
    if (hasRole('ADMIN') || hasRole('EXAM_CELL_ADMIN')) return <>{children}</>;

    // Define paths that are allowed for PENDING/REJECTED users
    const allowedPaths = ['/app/admissions/my', '/app/admissions/'];
    const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));

    if (user.login_status !== 'APPROVED' && !isAllowedPath) {
        return <PendingApprovalPage />;
    }

    return <>{children}</>;
};

interface PermissionGuardProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard = ({
    permission,
    children,
    fallback,
}: PermissionGuardProps) => {
    const { hasPermission, user } = useAuth();
    const location = useLocation();
    const { getVisibleModules } = useModuleVisibility();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!hasPermission || !hasPermission(permission)) {
        if (fallback) return <>{fallback}</>;
        
        const visible = getVisibleModules();
        const targetRoute = LandingResolver.resolveLandingRoute(visible);
        
        if (location.pathname === targetRoute) {
            return <Navigate to="/app/unauthorized" replace />;
        }
        
        console.warn(`[Route Guard] Access to ${location.pathname} denied. Redirecting to landing: ${targetRoute}`);
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
    const { hasPermission, user } = useAuth();
    const location = useLocation();
    const { getVisibleModules } = useModuleVisibility();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const allowed = permissions.some(p => hasPermission && hasPermission(p));
    if (!allowed) {
        if (fallback) return <>{fallback}</>;
        
        const visible = getVisibleModules();
        const targetRoute = LandingResolver.resolveLandingRoute(visible);
        
        if (location.pathname === targetRoute) {
            return <Navigate to="/app/unauthorized" replace />;
        }
        
        console.warn(`[Route Guard] Access to ${location.pathname} denied. Redirecting to landing: ${targetRoute}`);
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
                    This module is managed exclusively by the <strong>Examination Cell</strong>.
                    As a System Administrator, you have overview access but cannot perform operations here.
                </p>
                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-xs font-mono text-gray-500">
                    Role: ADMIN (Operational Access Denied)
                </div>
            </div>
        );
    }

    // Fallback for others (will likely be empty or 404 handled by router)
    // But safely return null or Permission denied if they somehow got here
    return (
        <div className="p-10 text-center text-gray-400">
            Access Denied
        </div>
    );
};
