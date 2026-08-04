import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModuleVisibility } from '../services/ModuleVisibilityService';
import { LandingResolver } from '../services/LandingResolver';
import { FacultyDashboard } from '../modules/dashboard/pages/FacultyDashboard';
import { ParentDashboard } from '../modules/dashboard/pages/ParentDashboard';

export default function Dashboard() {
    const { user, hasPermission } = useAuth();
    const { getVisibleModules } = useModuleVisibility();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const visibleModules = getVisibleModules();
    const targetRoute = LandingResolver.resolveLandingRoute(visibleModules);

    // If targetRoute is different from "/app/dashboard" and valid, redirect to it
    if (targetRoute !== '/app/dashboard' && targetRoute !== '/unauthorized') {
        return <Navigate to={targetRoute} replace />;
    }

    // Render components inline if the resolved landing route is /app/dashboard
    const isFaculty = hasPermission('faculty.dashboard.view');
    const isParent = hasPermission('parent.dashboard.view');

    return (
        <div className="space-y-6">
            {isFaculty && <FacultyDashboard />}
            {isParent && <ParentDashboard />}

            {!isFaculty && !isParent && (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100">
                    <div className="text-4xl mb-4">🔓</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Account Pending Verification</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Your account doesn't have any specific dashboard modules assigned. Please contact the administrator.
                    </p>
                </div>
            )}
        </div>
    );
}

