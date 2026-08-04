import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import { useEnrollmentQueue } from '../hooks/useEnrollmentQueue';
import { useEnrollmentWorkspace } from '../hooks/useEnrollmentWorkspace';
import { EnrollmentQueue } from './EnrollmentQueue';
import { EnrollmentCard } from './EnrollmentCard';
import { EnrollmentSummary } from './EnrollmentSummary';
import { EnrollmentValidation } from './EnrollmentValidation';
import { EnrollmentTimeline } from './EnrollmentTimeline';
import { EnrollmentAudit } from './EnrollmentAudit';
import { EnrollmentHistory } from './EnrollmentHistory';
import { StudentProvisioning } from './StudentProvisioning';
import { EnrollmentFilters } from './EnrollmentFilters';
import { ExportMenu } from '../../common/reports/ExportMenu';
import { enrollmentRecordToExportRow } from '../utils/enrollment.mapper';
import { Button } from '../../../components/ui/button';
import { ROUTES } from '../../../constants/routes';

export function EnrollmentWorkspace() {
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const [queueSearch, setQueueSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    const canAccess = AdmissionPermissions.canViewEnrollment(permCtx);

    const { queue, isLoading: queueLoading, refetch: refetchQueue } = useEnrollmentQueue(queueSearch, statusFilter);

    const {
        application,
        record,
        summary,
        history,
        audit,
        provisioning,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runEnrollmentAction,
    } = useEnrollmentWorkspace(selectedAppId ?? undefined, permCtx);

    const exportData = record ? [enrollmentRecordToExportRow(record)] : [];

    if (!canAccess) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to access enrollment workspace.</p>
            </div>
        );
    }

    if (!selectedAppId) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Enrollment & Student Provisioning</h1>
                    <p className="text-sm text-gray-500 mt-1">Convert verified applicants into ERP students via Admission Engine</p>
                </div>
                <EnrollmentFilters status={statusFilter} onStatusChange={setStatusFilter} />
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={queueSearch} onChange={e => setQueueSearch(e.target.value)} placeholder="Search enrollment queue…" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Enrollment Queue</h2>
                        <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </Button>
                    </div>
                    <EnrollmentQueue items={queue} isLoading={queueLoading} onSelect={id => setSelectedAppId(id)} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <button type="button" onClick={() => { setSelectedAppId(null); refetchQueue(); }} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-gray-900 truncate">{application?.student_name ?? 'Enrollment'}</h1>
                    <p className="text-sm text-gray-500">{application?.grade_applied_for ?? ''} · {record?.phase?.replace(/_/g, ' ') ?? ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMISSION.DETAILS(selectedAppId))} className="text-xs">
                    Applicant 360
                </Button>
                <ExportMenu title="Enrollment Record" data={exportData} columns={Object.keys(exportData[0] ?? { Candidate: '' })} />
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </div>

            {error ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-rose-600 font-bold">Failed to load enrollment data.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button>
                </div>
            ) : isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading enrollment data…</div>
            ) : (
                <>
                    <EnrollmentSummary summary={summary} />
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {record && <EnrollmentCard record={record} selected />}
                            <StudentProvisioning
                                steps={provisioning.provisioningSteps}
                                validation={record?.validation}
                                phase={record?.phase}
                            />
                        </div>
                        <div className="space-y-4">
                            <EnrollmentValidation
                                record={record}
                                canConfirm={permissions.canConfirm}
                                canEnroll={permissions.canEnroll}
                                canReject={permissions.canReject}
                                canRollback={permissions.canRollback}
                                isSubmitting={isSubmitting}
                                onAction={(action, payload) => runEnrollmentAction(action, payload ?? {})}
                            />
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Enrollment Timeline</h3>
                                <EnrollmentTimeline entries={history} />
                            </div>
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Enrollment Audit</h3>
                                <EnrollmentAudit entries={audit} />
                            </div>
                            <EnrollmentHistory entries={history} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default EnrollmentWorkspace;
