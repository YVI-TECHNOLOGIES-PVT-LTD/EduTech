import React, { useMemo, useState } from 'react';
import {
    Search, Filter, CheckSquare, Trash2, ShieldCheck, AlertCircle, FileSignature,
    Calendar, DollarSign, Award, Clock, ArrowRight, User, Users, CheckCircle2,
    XCircle, Download, Sparkles, History, BookOpen, AlertTriangle, Eye, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { admissionApi } from '../../../admission.api';
import { mapStatusToEnterpriseLabel } from '../../../utils/statusMapper';
import { AdmissionWorkflowEngine } from '../../../core/AdmissionWorkflowEngine';
import { scoreTierLabel } from '../../../utils/lead.score';

interface ApplicationsWorkspaceProps {
    applications: any[];
    isLoading: boolean;
    refetch: () => void;
    onSelectApp: (id: string) => void;
    counselorEmail?: string;
}

export function ApplicationsWorkspace({
    applications,
    isLoading,
    refetch,
    onSelectApp,
    counselorEmail
}: ApplicationsWorkspaceProps) {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    
    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedCounselor, setSelectedCounselor] = useState('All');
    const [selectedSla, setSelectedSla] = useState('All');
    const [selectedRisk, setSelectedRisk] = useState('All');
    const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

    // 10 Pipeline Stages from configuration
    const pipelineColumns = [
        { id: 'RECEIVED', title: 'Application Received' },
        { id: 'UNDER_REVIEW', title: 'Under Review' },
        { id: 'DOCUMENT_VERIFICATION', title: 'Document Verification' },
        { id: 'ENTRANCE_EXAMINATION', title: 'Entrance Examination' },
        { id: 'INTERVIEW_PANEL', title: 'Interview Panel' },
        { id: 'MERIT_LIST', title: 'Merit List' },
        { id: 'OFFER_LETTER', title: 'Offer Letter' },
        { id: 'FEE_VERIFICATION', title: 'Fee Verification' },
        { id: 'ENROLLMENT_PROCESSING', title: 'Enrollment Processing' },
        { id: 'ENROLLED', title: 'Enrolled' },
        { id: 'REJECTED', title: 'Rejected' }
    ];

    // Enrichment mapping with WorkflowEngine
    const enrichedApps = useMemo(() => {
        return applications.map(app => {
            const stage = AdmissionWorkflowEngine.resolveCurrentStage(app.status);
            const sla = AdmissionWorkflowEngine.calculateSLA(app.created_at, app.status, app.submitted_at);
            const progress = AdmissionWorkflowEngine.calculateProgress(app.status);
            
            let risk = 'Low';
            if (sla.status === 'breached') risk = 'High';
            else if (sla.status === 'critical' || sla.status === 'warning') risk = 'Medium';

            return {
                ...app,
                stage,
                slaInfo: sla,
                riskTier: risk,
                progressPercent: progress,
            };
        });
    }, [applications]);

    // Derived unique filter dropdown lists
    const gradesList = useMemo(() => {
        const grades = new Set<string>();
        applications.forEach(a => { if (a.grade_applied_for) grades.add(a.grade_applied_for); });
        return ['All', ...Array.from(grades)];
    }, [applications]);

    const statusList = useMemo(() => {
        const statuses = new Set<string>();
        applications.forEach(a => { if (a.status) statuses.add(a.status); });
        return ['All', ...Array.from(statuses)];
    }, [applications]);

    const counselorsList = useMemo(() => {
        const counselors = new Set<string>();
        applications.forEach(a => { if (a.parent_name) counselors.add(a.parent_name); });
        return ['All', ...Array.from(counselors)];
    }, [applications]);

    // Apply filtering
    const filteredApps = useMemo(() => {
        return enrichedApps.filter(app => {
            const query = searchQuery.toLowerCase().trim();
            const textMatch = !query ||
                app.student_name?.toLowerCase().includes(query) ||
                app.id?.toLowerCase().includes(query) ||
                app.parent_email?.toLowerCase().includes(query) ||
                app.parent_phone?.toLowerCase().includes(query);

            const gradeMatch = selectedGrade === 'All' || app.grade_applied_for === selectedGrade;
            const statusMatch = selectedStatus === 'All' || app.status === selectedStatus;
            const counselorMatch = selectedCounselor === 'All' || app.parent_name === selectedCounselor;
            const slaMatch = selectedSla === 'All' || app.slaInfo.status.toUpperCase() === selectedSla.toUpperCase();
            const riskMatch = selectedRisk === 'All' || app.riskTier === selectedRisk;

            return textMatch && gradeMatch && statusMatch && counselorMatch && slaMatch && riskMatch;
        });
    }, [enrichedApps, searchQuery, selectedGrade, selectedStatus, selectedCounselor, selectedSla, selectedRisk]);

    // Kanban Groups
    const kanbanGroups = useMemo(() => {
        const groups: Record<string, typeof filteredApps> = {};
        pipelineColumns.forEach(col => { groups[col.id] = []; });
        filteredApps.forEach(app => {
            const colId = app.stage.id;
            if (groups[colId]) {
                groups[colId].push(app);
            } else {
                groups['RECEIVED'].push(app);
            }
        });
        return groups;
    }, [filteredApps]);

    // Bulk actions
    const triggerBulkVerify = async () => {
        if (selectedAppIds.length === 0) return toast.warning('Select applications first');
        try {
            await Promise.all(selectedAppIds.map(id => admissionApi.verifyDocs(id, 'Bulk Verified')));
            toast.success(`Successfully verified documents for ${selectedAppIds.length} applications`);
            setSelectedAppIds([]);
            refetch();
        } catch {
            toast.error('Failed to run bulk verify');
        }
    };

    const triggerBulkApprove = async () => {
        if (selectedAppIds.length === 0) return toast.warning('Select applications first');
        try {
            await Promise.all(selectedAppIds.map(id => admissionApi.approve(id, 'Bulk Approved')));
            toast.success(`Successfully approved ${selectedAppIds.length} applications`);
            setSelectedAppIds([]);
            refetch();
        } catch {
            toast.error('Failed to run bulk approval');
        }
    };

    const triggerBulkReject = async () => {
        if (selectedAppIds.length === 0) return toast.warning('Select applications first');
        try {
            await Promise.all(selectedAppIds.map(id => admissionApi.reject(id, 'Bulk Rejected')));
            toast.success(`Successfully rejected ${selectedAppIds.length} applications`);
            setSelectedAppIds([]);
            refetch();
        } catch {
            toast.error('Failed to run bulk reject');
        }
    };

    const triggerExportCSV = () => {
        if (filteredApps.length === 0) return toast.warning('No data to export');
        const headers = 'Application ID,Student Name,Grade,Status,Counselor,Created At,SLA Status\n';
        const rows = filteredApps.map(a => 
            `"${a.id}","${a.student_name}","${a.grade_applied_for}","${a.status}","${a.parent_name || 'Unassigned'}","${a.created_at}","${a.slaInfo.label}"`
        ).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `applications_list_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success('CSV Export Completed');
    };

    return (
        <div className="space-y-4">
            {/* View Mode Toolbar */}
            <div className="flex justify-between items-center bg-gray-50 dark:bg-card p-3 rounded-2xl border">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide pl-2">
                    {filteredApps.length} Application(s) Mapped
                </span>
                <div className="flex gap-2">
                    <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('kanban')} className="text-xs h-8">
                        Kanban Board
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} className="text-xs h-8">
                        Detailed List
                    </Button>
                    <Button variant="outline" size="sm" onClick={triggerExportCSV} className="text-xs h-8 gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Export
                    </Button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <div className="p-5 bg-white border rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Advanced Filters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, code..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-8 text-xs border rounded-lg w-full p-2 h-9"
                        />
                    </div>
                    <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="text-xs border rounded-lg p-2 bg-white h-9">
                        <option value="All">Grade: All</option>
                        {gradesList.filter(g => g !== 'All').map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                    <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="text-xs border rounded-lg p-2 bg-white h-9">
                        <option value="All">Status: All</option>
                        {statusList.filter(s => s !== 'All').map(s => (
                            <option key={s} value={s}>{mapStatusToEnterpriseLabel(s)}</option>
                        ))}
                    </select>
                    <select value={selectedCounselor} onChange={e => setSelectedCounselor(e.target.value)} className="text-xs border rounded-lg p-2 bg-white h-9">
                        <option value="All">Counselor: All</option>
                        {counselorsList.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select value={selectedSla} onChange={e => setSelectedSla(e.target.value)} className="text-xs border rounded-lg p-2 bg-white h-9">
                        <option value="All">SLA: All</option>
                        <option value="Normal">Within SLA</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                        <option value="Breached">Breached</option>
                    </select>
                    <select value={selectedRisk} onChange={e => setSelectedRisk(e.target.value)} className="text-xs border rounded-lg p-2 bg-white h-9">
                        <option value="All">Risk: All</option>
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                    </select>
                </div>
            </div>

            {/* Bulk Operations row */}
            {selectedAppIds.length > 0 && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2 animate-fade-in">
                    <span className="font-bold text-indigo-900">
                        {selectedAppIds.length} application(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={triggerBulkVerify} className="text-xs bg-indigo-600 hover:bg-indigo-700">
                            Bulk Verify Docs
                        </Button>
                        <Button size="sm" onClick={triggerBulkApprove} className="text-xs bg-emerald-600 hover:bg-emerald-700">
                            Bulk Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={triggerBulkReject} className="text-xs">
                            Bulk Reject
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedAppIds([])} className="text-xs bg-white text-gray-600">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Dashboard Workspace Layout views */}
            {isLoading ? (
                <div className="py-24 text-center text-sm text-gray-400 animate-pulse">Loading admissions pipeline…</div>
            ) : filteredApps.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed rounded-2xl bg-gray-50/50">
                    <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs text-gray-400 font-bold">No applications matching active workspace filters.</p>
                </div>
            ) : viewMode === 'kanban' ? (
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[2400px] h-[550px] items-start">
                        {pipelineColumns.map(col => {
                            const colApps = kanbanGroups[col.id] || [];
                            return (
                                <div key={col.id} className="w-[240px] shrink-0 bg-gray-50/70 border rounded-2xl p-3 h-full overflow-y-auto space-y-3 flex flex-col justify-start">
                                    <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 py-1 z-10 border-b">
                                        <span className="text-[10px] font-black text-gray-800 uppercase truncate">{col.title}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[9px] font-black text-gray-700">
                                            {colApps.length}
                                        </span>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        {colApps.map(app => {
                                            const isSelected = selectedAppIds.includes(app.id);
                                            let slaColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                            if (app.slaInfo.status === 'breached') slaColor = 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
                                            else if (app.slaInfo.status === 'critical') slaColor = 'bg-orange-50 text-orange-600 border-orange-100';
                                            else if (app.slaInfo.status === 'warning') slaColor = 'bg-amber-50 text-amber-600 border-amber-100';

                                            return (
                                                <div
                                                    key={app.id}
                                                    className="p-3 bg-white rounded-xl border border-gray-150 hover:shadow-md transition-all space-y-2.5 cursor-pointer relative"
                                                >
                                                    <div className="absolute top-2.5 right-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                if (isSelected) {
                                                                    setSelectedAppIds(prev => prev.filter(id => id !== app.id));
                                                                } else {
                                                                    setSelectedAppIds(prev => [...prev, app.id]);
                                                                }
                                                            }}
                                                            className="w-3.5 h-3.5 rounded border-gray-300"
                                                        />
                                                    </div>
                                                    <div onClick={() => onSelectApp(app.id)} className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0 uppercase">
                                                                {app.student_name.slice(0, 2)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-900 truncate text-[11px] hover:text-indigo-600">{app.student_name}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{app.id.slice(0, 8).toUpperCase()} • {app.grade_applied_for}</p>
                                                            </div>
                                                        </div>

                                                        {/* Progress Meter */}
                                                        <div className="space-y-0.5">
                                                            <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                                                                <span>Progress</span>
                                                                <span>{app.progressPercent}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                                                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${app.progressPercent}%` }} />
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span className="text-[8px] font-black uppercase px-1 rounded bg-indigo-50 text-indigo-600">
                                                                {app.stage.displayName}
                                                            </span>
                                                            <span className={`text-[8px] font-black uppercase px-1 rounded border ${slaColor}`}>
                                                                {app.slaInfo.label}
                                                            </span>
                                                        </div>

                                                        <div className="text-[9px] border-t pt-1.5 flex items-center justify-between text-gray-400 font-bold uppercase">
                                                            <span>Next Action:</span>
                                                            <span className="text-indigo-600 font-black truncate max-w-[120px]">{app.stage.nextAction}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b text-[10px] font-black uppercase text-gray-500">
                                <th className="p-3 w-8">
                                    <input
                                        type="checkbox"
                                        checked={selectedAppIds.length === filteredApps.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedAppIds(filteredApps.map(a => a.id));
                                            } else {
                                                setSelectedAppIds([]);
                                            }
                                        }}
                                        className="w-3.5 h-3.5 rounded border-gray-300"
                                    />
                                </th>
                                <th className="p-3">Application</th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Grade</th>
                                <th className="p-3">Stage</th>
                                <th className="p-3">SLA Status</th>
                                <th className="p-3">Risk Tier</th>
                                <th className="p-3">Next Action</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredApps.map(app => {
                                const isSelected = selectedAppIds.includes(app.id);
                                let slaBadge = 'bg-emerald-50 text-emerald-600';
                                if (app.slaInfo.status === 'breached') slaBadge = 'bg-rose-100 text-rose-700 animate-pulse font-bold';
                                else if (app.slaInfo.status === 'critical') slaBadge = 'bg-orange-50 text-orange-600';
                                else if (app.slaInfo.status === 'warning') slaBadge = 'bg-amber-50 text-amber-600';

                                let riskBadge = 'bg-emerald-50 text-emerald-600';
                                if (app.riskTier === 'High') riskBadge = 'bg-rose-100 text-rose-700 font-bold';
                                else if (app.riskTier === 'Medium') riskBadge = 'bg-orange-50 text-orange-600';

                                return (
                                    <tr key={app.id} className="hover:bg-gray-50/50">
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (isSelected) {
                                                        setSelectedAppIds(prev => prev.filter(id => id !== app.id));
                                                    } else {
                                                        setSelectedAppIds(prev => [...prev, app.id]);
                                                    }
                                                }}
                                                className="w-3.5 h-3.5 rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="p-3 font-bold text-gray-900 uppercase">
                                            {app.id.slice(0, 8)}
                                        </td>
                                        <td className="p-3 font-medium text-gray-900">{app.student_name}</td>
                                        <td className="p-3 text-gray-500 font-bold">{app.grade_applied_for}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-600">
                                                {app.stage.displayName}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${slaBadge}`}>
                                                {app.slaInfo.label}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${riskBadge}`}>
                                                {app.riskTier} RISK
                                            </span>
                                        </td>
                                        <td className="p-3 font-black text-indigo-600">{app.stage.nextAction}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => onSelectApp(app.id)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600"
                                                title="View Dossier"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ApplicationsWorkspace;
