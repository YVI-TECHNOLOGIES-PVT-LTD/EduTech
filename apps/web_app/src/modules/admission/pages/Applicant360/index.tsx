import React from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { AdmissionPermissions } from '../../core/AdmissionPermissions';
import { useApplicant360 } from '../../hooks/useApplicant360';
import { useApplicationProgress } from '../../hooks/useApplicationProgress';
import Applicant360Profile from '../../components/profile360/Applicant360Profile';
import { Button } from '../../../../components/ui/button';

export function Applicant360Page() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const rawTab = searchParams.get('tab');
    const tabParam = rawTab ? rawTab.charAt(0).toUpperCase() + rawTab.slice(1).toLowerCase() : null;
    const pathTab = location.pathname.includes('/documents/')
        ? 'Documents'
        : location.pathname.includes('/timeline/')
          ? 'Timeline'
          : null;
    const { user, hasPermission, hasRole } = useAuth();
    const { view, isLoading, error, refetch, notFound } = useApplicant360(id);
    const { progress, isLoading: progressLoading } = useApplicationProgress(id);

    const permCtx = {
        roles: user?.roles ?? [],
        hasPermission,
        hasRole,
    };

    const canView =
        AdmissionPermissions.canViewApplication(permCtx);
    const readOnlyMode = AdmissionPermissions.isParent(permCtx) && !AdmissionPermissions.isStaff(permCtx);

    if (!canView) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to view this application.</p>
            </div>
        );
    }

    if (!id) {
        return (
            <div className="py-16 text-center space-y-3">
                <p className="text-sm text-gray-500">No application ID provided.</p>
                <Button asChild variant="outline" size="sm">
                    <Link to="/app/admissions"><ArrowLeft className="w-4 h-4 mr-1" /> Back to applications</Link>
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-100 rounded-xl w-64" />
                <div className="h-32 bg-gray-100 rounded-2xl" />
                <div className="h-96 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-16 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">Failed to load applicant profile.</p>
                <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-1">
                    <RefreshCw className="w-4 h-4" /> Retry
                </Button>
            </div>
        );
    }

    if (notFound || !view) {
        return (
            <div className="py-16 text-center space-y-4">
                <p className="text-sm text-gray-500">Application not found.</p>
                <Button asChild variant="outline" size="sm">
                    <Link to="/app/admissions"><ArrowLeft className="w-4 h-4 mr-1" /> Back to applications</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        {readOnlyMode ? 'My Application' : 'Applicant 360° Profile'}
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold uppercase">
                        {readOnlyMode
                            ? 'View status, timeline, documents, interview, exam, and fees'
                            : 'Live data — application, timeline, documents, evaluation, fees'}
                    </p>
                </div>
                {!readOnlyMode && (
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                )}
            </div>

            <Applicant360Profile
                applicant={view}
                applicationId={id}
                progress={progress}
                progressLoading={progressLoading}
                readOnlyMode={readOnlyMode}
                initialTab={(pathTab ?? tabParam) as any}
            />
        </div>
    );
}

export default Applicant360Page;
