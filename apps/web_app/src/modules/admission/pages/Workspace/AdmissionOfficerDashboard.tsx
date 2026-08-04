import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useApplicationList } from '../../hooks/useApplication';
import { useApplicationProgress } from '../../hooks/useApplicationProgress';
import { useAuth } from '../../../../context/AuthContext';
import { REGISTERED_WORKSPACE_LIST, ADMISSION_WORKSPACE_REGISTRY } from '../../core/AdmissionWorkspaceRegistry';
import { AdmissionWorkflowEngine } from '../../core/AdmissionWorkflowEngine';
import { mapUIStatus } from '../../core/AdmissionStatusMapper';
import Applicant360Profile from '../../components/profile360/Applicant360Profile';
import { Button } from '@/components/ui/button';

export function AdmissionOfficerDashboard() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { applications, isLoading, refetch } = useApplicationList({ limit: 1000 });

    // Selected candidate state
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    // Load progress for selected applicant
    const { progress: selectedProgress, isLoading: selectedProgressLoading } = useApplicationProgress(selectedAppId || undefined);

    const activeWorkspace = useMemo(() => {
        const path = location.pathname;
        if (path.endsWith('/review')) return 'APPLICATIONS';
        if (path.endsWith('/queues')) return 'QUEUES';
        if (path.endsWith('/verification')) return 'DOCUMENTS';
        if (path.endsWith('/interviews')) return 'INTERVIEWS';
        if (path.endsWith('/merit')) return 'MERIT';
        if (path.endsWith('/offers') || path.endsWith('/merit/offers')) return 'OFFERS';
        if (path.endsWith('/fees')) return 'FINANCE';
        if (path.endsWith('/enrollment')) return 'ENROLLMENT';
        if (path.endsWith('/reports') || path.endsWith('/analytics')) return 'REPORTS';
        if (path.endsWith('/settings')) return 'SETTINGS';
        return 'DASHBOARD';
    }, [location.pathname]);

    const handleWorkspaceChange = (workspaceId: string) => {
        switch (workspaceId) {
            case 'DASHBOARD': navigate('/app/admissions/dashboard'); break;
            case 'APPLICATIONS': navigate('/app/admissions/review'); break;
            case 'QUEUES': navigate('/app/admissions/queues'); break;
            case 'DOCUMENTS': navigate('/app/admissions/verification'); break;
            case 'INTERVIEWS': navigate('/app/admissions/interviews'); break;
            case 'MERIT': navigate('/app/admissions/merit'); break;
            case 'OFFERS': navigate('/app/admissions/offers'); break;
            case 'FINANCE': navigate('/app/admissions/fees'); break;
            case 'ENROLLMENT': navigate('/app/admissions/enrollment'); break;
            case 'REPORTS': navigate('/app/admissions/reports'); break;
            case 'SETTINGS': navigate('/app/admissions/settings'); break;
            default: navigate('/app/admissions/dashboard');
        }
    };

    const selectedApplication = useMemo(() => {
        return applications.find(a => a.id === selectedAppId) || null;
    }, [applications, selectedAppId]);

    const applicant360View = useMemo(() => {
        if (!selectedApplication) return null;
        const sla = AdmissionWorkflowEngine.calculateSLA(selectedApplication.created_at, selectedApplication.status, selectedApplication.submitted_at);
        const docs = selectedApplication.admission_documents || [];
        return {
            id: selectedApplication.id,
            status: selectedApplication.status,
            uiStatus: mapUIStatus(selectedApplication.status),
            name: selectedApplication.student_name,
            code: selectedApplication.id.slice(0, 8).toUpperCase(),
            email: selectedApplication.parent_email || '',
            phone: selectedApplication.parent_phone || '',
            grade: selectedApplication.grade_applied_for,
            candidateScore: selectedApplication.payment_amount || 0,
            submittedAt: selectedApplication.submitted_at || selectedApplication.created_at,
            progressPercent: AdmissionWorkflowEngine.calculateProgress(selectedApplication.status),
            slaRemainingHours: Math.round(sla.remainingHours),
            slaTotalHours: sla.totalHours,
            counselor: selectedApplication.parent_name || 'Unassigned',
            crmLeadTemp: 'hot' as const,
            crmLeadScore: 85,
            documentChecklist: docs.map((d: any) => ({
                name: d.document_type.replace(/_/g, ' ').toUpperCase(),
                verified: d.status === 'VERIFIED',
            })),
            timelineNodes: [],
            auditLogs: (selectedApplication.admission_audit_logs || []).map((l: any) => ({
                id: l.id,
                action: l.action,
                actor: l.performed_by,
                remarks: l.remarks,
                timestamp: l.created_at,
            })),
            examStatus: (selectedApplication.payment_verified ? 'PASSED' : 'PENDING') as any,
            examScore: 88,
            interviewStatus: (selectedApplication.payment_verified ? 'RECOMMENDED' : 'PENDING') as any,
            feeStatus: (selectedApplication.payment_verified ? 'VERIFIED' : 'PENDING') as any,
        };
    }, [selectedApplication]);

    return (
        <div className="space-y-6 pb-12">
            {/* Header Area */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> Enterprise Admission Desk Console
                    </h2>
                    <p className="text-xs text-gray-400 font-bold uppercase">
                        Unified Dynamics CRM Pipeline, Work Queues, Live SLA Monitoring, & SIS Handoff
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { refetch(); toast.success('Workspace updated'); }}
                    className="text-xs gap-1.5 h-8 font-bold border-gray-300 bg-white"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Workspace
                </Button>
            </div>

            {/* Sub-workspace viewport */}
            <div className="min-h-[500px]">
                {(() => {
                    const workspace = ADMISSION_WORKSPACE_REGISTRY[activeWorkspace];
                    if (!workspace) return null;
                    const Component = workspace.component;
                    
                    const props = {
                        applications,
                        isLoading,
                        refetch,
                        onSelectApp: setSelectedAppId,
                        onNavigate: handleWorkspaceChange,
                        counselorEmail: user?.email,
                    };

                    return <Component {...props} />;
                })()}
            </div>

            {/* Applicant 360 Overlay detail View */}
            {selectedAppId && applicant360View && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 animate-fade-in">
                    <div className="w-full max-w-6xl h-full bg-gray-50 p-6 shadow-2xl flex flex-col space-y-4 overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3 shrink-0">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-indigo-500" /> Applicant 360° Operational Panel
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase">
                                    Track verification checklists, billing installments, scorecard panel details, and SIS provisioning
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedAppId(null); refetch(); }}
                                className="text-xs font-bold border-gray-300 h-8"
                            >
                                Close Panel
                            </Button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                            <Applicant360Profile
                                applicant={applicant360View}
                                applicationId={selectedAppId}
                                progress={selectedProgress}
                                progressLoading={selectedProgressLoading}
                                readOnlyMode={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdmissionOfficerDashboard;
