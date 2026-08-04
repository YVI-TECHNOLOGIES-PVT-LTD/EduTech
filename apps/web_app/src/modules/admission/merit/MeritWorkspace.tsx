import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Play, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import { useMeritQueue } from '../hooks/useMeritQueue';
import { useMeritWorkspace } from '../hooks/useMeritWorkspace';
import { MeritQueue } from './MeritQueue';
import { MeritCard } from './MeritCard';
import { MeritSummary } from './MeritSummary';
import { MeritRanking } from './MeritRanking';
import { SeatAllocation } from './SeatAllocation';
import { WaitlistManager } from './WaitlistManager';
import { MeritHistory } from './MeritHistory';
import { ExportMenu } from '../../common/reports/ExportMenu';
import { meritRecordToExportRow } from '../utils/merit.mapper';
import { Button } from '../../../components/ui/button';
import { ROUTES } from '../../../constants/routes';

export function MeritWorkspace() {
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const [queueSearch, setQueueSearch] = useState('');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [intakeLimit, setIntakeLimit] = useState('20');

    const canAccess =
        AdmissionPermissions.canManageMeritSelection(permCtx) ||
        AdmissionPermissions.canGenerateMerit(permCtx);

    const { queue, applications, isLoading: queueLoading, refetch: refetchQueue } = useMeritQueue(queueSearch);

    const {
        application,
        record,
        records,
        summary,
        history,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runMeritAction,
        generateMeritList,
    } = useMeritWorkspace(selectedAppId ?? undefined, permCtx);

    const exportData = records.map(meritRecordToExportRow);
    const schoolId = application?.school_id ?? applications[0]?.school_id ?? user?.school_id;

    if (!canAccess) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to access merit selection.</p>
            </div>
        );
    }

    if (!selectedAppId) {
        return (
            <div className="space-y-6 pb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Merit List & Selection</h1>
                        <p className="text-sm text-gray-500 mt-1">Operational workspace — backend ranking via Admission Engine</p>
                    </div>
                    {permissions.canGenerate && (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                value={intakeLimit}
                                onChange={e => setIntakeLimit(e.target.value)}
                                className="w-20 px-2 py-1.5 border rounded-lg text-xs"
                                placeholder="Intake"
                            />
                            <Button
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() =>
                                    generateMeritList({
                                        schoolId,
                                        intakeLimit: Number(intakeLimit) || 20,
                                        applications,
                                    })
                                }
                                className="gap-1 bg-violet-600 text-white text-xs"
                            >
                                <Play className="w-3.5 h-3.5" /> Generate Merit
                            </Button>
                        </div>
                    )}
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={queueSearch}
                        onChange={e => setQueueSearch(e.target.value)}
                        placeholder="Search queue…"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs"
                    />
                </div>

                <MeritSummary summary={summary} />

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Merit Selection Queue</h2>
                        <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </Button>
                    </div>
                    <MeritQueue items={queue} isLoading={queueLoading} onSelect={id => setSelectedAppId(id)} />
                </div>

                {records.length > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-sm font-black text-gray-900 mb-4">Merit Rankings</h2>
                        <MeritRanking records={records} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <button
                    type="button"
                    onClick={() => { setSelectedAppId(null); refetchQueue(); }}
                    className="p-2 hover:bg-gray-100 rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-gray-900 truncate">{application?.student_name ?? 'Merit Selection'}</h1>
                    <p className="text-sm text-gray-500">{application?.grade_applied_for ?? ''} · {application?.status ?? ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMISSION.DETAILS(selectedAppId))} className="text-xs">
                    Applicant 360
                </Button>
                <ExportMenu title="Merit Record" data={exportData} columns={Object.keys(exportData[0] ?? { Candidate: '' })} />
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </div>

            {error ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-rose-600 font-bold">Failed to load merit data.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button>
                </div>
            ) : isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading merit data…</div>
            ) : (
                <>
                    <MeritSummary summary={summary} />

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {record && <MeritCard record={record} selected />}
                            <MeritRanking records={records} />
                        </div>
                        <div className="space-y-4">
                            <SeatAllocation
                                record={record}
                                canAllocate={permissions.canAllocate}
                                canApprove={permissions.canApprove}
                                isSubmitting={isSubmitting}
                                onAction={(action, payload) => runMeritAction(action, payload ?? {})}
                            />
                            <WaitlistManager
                                record={record}
                                canPublish={permissions.canPublish}
                                canReject={permissions.canReject}
                                isSubmitting={isSubmitting}
                                onAction={(action, payload) => runMeritAction(action, payload ?? {})}
                            />
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Merit History</h3>
                                <MeritHistory entries={history} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default MeritWorkspace;
