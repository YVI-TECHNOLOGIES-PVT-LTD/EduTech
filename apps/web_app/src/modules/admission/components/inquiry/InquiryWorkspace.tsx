import React, { useState, useMemo, useEffect } from 'react';
import { Plus, RefreshCw, Search, AlertTriangle, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { ExportMenu } from '../../../common/reports/ExportMenu';
import { useLeadSearch } from '../../hooks/useLeadSearch';
import { useConvertEnquiry, useCreateEnquiry } from '../../hooks/useInquiry';
import { useLeadAssignment } from '../../hooks/useLeadAssignment';
import { useInquiryWorkspace } from '../../hooks/useInquiryWorkspace';
import { useAuth } from '../../../../context/AuthContext';
import { useMasterData } from '../../context/MasterDataContext';
import { useAdmissionMasterData } from '../../context/AdmissionMasterDataContext';
import { findDuplicates } from '../../utils/duplicate.detector';
import { ADMISSION_ERROR_LABELS, parseAdmissionApiError } from '../../utils/admissionError.utils';
import {
    filterBySection,
    leadToExportRow,
    type WorkspaceSection,
} from '../../utils/lead.mapper';
import type { Lead } from '../../types/admission.types';
import { LoadingSkeleton } from '../../../dashboard/components/feedback/LoadingSkeleton';
import { ErrorState } from '../../../dashboard/components/feedback/ErrorState';
import { EmptyState } from '../../../dashboard/components/feedback/EmptyState';
import { InquiryKPIs } from './InquiryKPIs';
import { LeadCard } from './LeadCard';
import { LeadDuplicateAlert } from './LeadDuplicateAlert';

const SECTIONS: { id: WorkspaceSection; label: string }[] = [
    { id: 'walkins', label: 'New Walk-ins' },
    { id: 'online', label: 'Online Inquiries' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'unassigned', label: 'Unassigned' },
    { id: 'followups', label: "Today's Follow-ups" },
    { id: 'converted', label: 'Converted' },
    { id: 'archived', label: 'Archived' },
];

function WorkspaceErrorBanner({
    error,
    onDismiss,
    onRetry,
}: {
    error: unknown;
    onDismiss?: () => void;
    onRetry?: () => void;
}) {
    const parsed = parseAdmissionApiError(error);
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-red-600">
                            {ADMISSION_ERROR_LABELS[parsed.kind]}
                        </p>
                        <p className="text-xs text-red-800 dark:text-red-200 font-medium mt-0.5">{parsed.message}</p>
                    </div>
                </div>
                {onDismiss && (
                    <button type="button" onClick={onDismiss} className="text-red-400 hover:text-red-600" aria-label="Dismiss">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            {parsed.retryable && onRetry && (
                <Button type="button" variant="outline" size="sm" onClick={onRetry} className="self-start text-xs h-7">
                    Retry
                </Button>
            )}
        </div>
    );
}

interface InquiryWorkspaceProps {
    mode?: 'workspace' | 'assignment';
    openCreateOnMount?: boolean;
    initialSection?: WorkspaceSection;
}

export function InquiryWorkspace({
    mode = 'workspace',
    openCreateOnMount = false,
    initialSection,
}: InquiryWorkspaceProps) {
    const { user, hasPermission } = useAuth();
    const counselorId = user?.id ?? '';
    
    // Master Data Hooks
    const {
        activeSchoolId,
        activeAcademicYearId,
        schools,
        academicYears,
        grades,
        boards,
        admissionSources,
        categories,
        bloodGroups,
        religions,
        occupations,
        relationships,
        countries,
        states,
        cities,
        hostelRoomTypes,
        quotas
    } = useMasterData();

    const { counselors, transportRoutes, feeStructures } = useAdmissionMasterData();

    const [activeSection, setActiveSection] = useState<WorkspaceSection>(
        initialSection ?? (mode === 'assignment' ? 'unassigned' : 'walkins'),
    );
    const [isCreateOpen, setIsCreateOpen] = useState(openCreateOnMount);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        school_id: '',
        academic_year_id: '',
        student_name: '',
        parent_name: '',
        email: '',
        phone: '',
        grade_applied_for: '',
        source: 'Walk-in',
        board: 'CBSE',
        counselor_id: '',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
        relationship: 'Father',
        occupation: 'Salaried',
        religion: 'Hindu',
        category: 'General',
        blood_group: 'A+',
        transport_route_id: '',
        hostel_room_type: 'Single (Non-AC)',
        fee_structure_id: '',
        quota: 'Regular',
        date_of_birth: '',
        gender: 'Male',
        current_school: '',
        address: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [createError, setCreateError] = useState<unknown>(null);
    const [assignError, setAssignError] = useState<unknown>(null);
    const [lastConvertId, setLastConvertId] = useState<string | null>(null);
    const [lastAssignLeadId, setLastAssignLeadId] = useState<string | null>(null);

    // Sync active context to form data on change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            school_id: prev.school_id || activeSchoolId,
            academic_year_id: prev.academic_year_id || activeAcademicYearId,
        }));
    }, [activeSchoolId, activeAcademicYearId]);

    useEffect(() => {
        if (grades.length > 0 && !formData.grade_applied_for) {
            setFormData(prev => ({ ...prev, grade_applied_for: grades[0].name }));
        }
    }, [grades, formData.grade_applied_for]);

    useEffect(() => {
        if (counselors.length > 0 && !formData.counselor_id) {
            setFormData(prev => ({ ...prev, counselor_id: counselors[0].id }));
        }
    }, [counselors, formData.counselor_id]);

    useEffect(() => {
        if (transportRoutes.length > 0 && !formData.transport_route_id) {
            setFormData(prev => ({ ...prev, transport_route_id: transportRoutes[0].id }));
        }
    }, [transportRoutes, formData.transport_route_id]);

    useEffect(() => {
        if (feeStructures.length > 0 && !formData.fee_structure_id) {
            setFormData(prev => ({ ...prev, fee_structure_id: feeStructures[0].id }));
        }
    }, [feeStructures, formData.fee_structure_id]);

    const { leads, inquiries, metrics, allRecords, isLoading, error, refetch, canManageLeads, buckets, todayLeadIds } =
        useInquiryWorkspace();
    const canAssign = canManageLeads || hasPermission('admission.visitors.manage') || hasPermission('admission.enquiry.create');
    const { query, setQuery, results: searchResults } = useLeadSearch(
        leads.length ? leads : inquiries,
    );
    const convertMutation = useConvertEnquiry();
    const createMutation = useCreateEnquiry();
    const { assign, isAssigning } = useLeadAssignment();

    const sectionLeads = useMemo(() => {
        const pool = searchResults.length || query ? searchResults : (leads.length ? leads : inquiries as Lead[]);
        return filterBySection(activeSection, inquiries, leads.length ? leads : inquiries as Lead[], todayLeadIds);
    }, [activeSection, inquiries, leads, todayLeadIds, searchResults, query]);

    const displayLeads = query ? sectionLeads.filter(l => searchResults.some(r => r.id === l.id)) : sectionLeads;

    const duplicates = useMemo(
        () =>
            isCreateOpen
                ? findDuplicates(
                      {
                          phone: formData.phone,
                          email: formData.email,
                          parent_name: formData.parent_name,
                          student_name: formData.student_name,
                      },
                      allRecords,
                  )
                : [],
        [isCreateOpen, formData, allRecords],
    );

    const exportData = useMemo(
        () => (leads.length ? leads : inquiries as Lead[]).map(leadToExportRow),
        [leads, inquiries],
    );

    useEffect(() => {
        if (openCreateOnMount) {
            setIsCreateOpen(true);
        }
    }, [openCreateOnMount]);

    useEffect(() => {
        if (initialSection) {
            setActiveSection(initialSection);
        }
    }, [initialSection]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (formData.student_name.trim().length < 2) newErrors.student_name = 'Required (min 2 chars)';
        if (formData.parent_name.trim().length < 2) newErrors.parent_name = 'Required (min 2 chars)';
        if (!/^\+?[0-9]{10,15}$/.test(formData.phone.trim())) newErrors.phone = 'Invalid phone';
        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            return;
        }
        if (!formData.date_of_birth) {
            setErrors({ date_of_birth: 'Date of birth is required — needed when converting to an application' });
            return;
        }
        setErrors({});
        setCreateError(null);
        try {
            // Serialize extra fields into remarks
            const extraFields = {
                board: formData.board,
                counselor_id: formData.counselor_id,
                counselor_name: counselors.find(c => c.id === formData.counselor_id)?.full_name || '',
                country: formData.country,
                state: formData.state,
                city: formData.city,
                relationship: formData.relationship,
                occupation: formData.occupation,
                religion: formData.religion,
                category: formData.category,
                blood_group: formData.blood_group,
                transport_route_id: formData.transport_route_id,
                transport_route_name: transportRoutes.find(r => r.id === formData.transport_route_id)?.name || '',
                hostel_room_type: formData.hostel_room_type,
                fee_structure_id: formData.fee_structure_id,
                fee_structure_name: feeStructures.find(f => f.id === formData.fee_structure_id)?.name || '',
                quota: formData.quota
            };

            await createMutation.mutateAsync({
                school_id: formData.school_id || activeSchoolId,
                academic_year_id: formData.academic_year_id || activeAcademicYearId,
                student_name: formData.student_name.trim(),
                parent_name: formData.parent_name.trim(),
                parent_email: formData.email.trim(),
                parent_phone: formData.phone.trim(),
                grade_applied_for: formData.grade_applied_for,
                source: formData.source,
                date_of_birth: formData.date_of_birth || null,
                gender: formData.gender,
                current_school: formData.current_school || null,
                address: formData.address || null,
                remarks: JSON.stringify(extraFields)
            });
            setIsCreateOpen(false);
            setFormData({
                school_id: activeSchoolId,
                academic_year_id: activeAcademicYearId,
                student_name: '',
                parent_name: '',
                email: '',
                phone: '',
                grade_applied_for: grades[0]?.name || '',
                source: 'Walk-in',
                board: 'CBSE',
                counselor_id: counselors[0]?.id || '',
                country: 'India',
                state: 'Telangana',
                city: 'Hyderabad',
                relationship: 'Father',
                occupation: 'Salaried',
                religion: 'Hindu',
                category: 'General',
                blood_group: 'A+',
                transport_route_id: transportRoutes[0]?.id || '',
                hostel_room_type: 'Single (Non-AC)',
                fee_structure_id: feeStructures[0]?.id || '',
                quota: 'Regular',
                date_of_birth: '',
                gender: 'Male',
                current_school: '',
                address: '',
            });
        } catch (err: unknown) {
            setCreateError(err);
        }
    };

    const handleAssign = async (leadId: string) => {
        setAssignError(null);
        setLastAssignLeadId(leadId);
        try {
            const isReceptionist = (hasPermission('admission.visitors.manage') || hasPermission('admission.enquiry.create')) && !hasPermission('admission.leads.manage');
            if (isReceptionist) {
                await assign(leadId, undefined, 'round_robin');
            } else {
                if (!counselorId) return;
                await assign(leadId, counselorId);
            }
        } catch (err: unknown) {
            setAssignError(err);
        }
    };

    const handleConvert = (leadId: string) => {
        setLastConvertId(leadId);
        convertMutation.reset();
        convertMutation.mutate(leadId);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 pb-6">
                <LoadingSkeleton type="kpi" count={3} />
                <LoadingSkeleton type="list" count={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 pb-6">
                <ErrorState
                    title="Unable to Load Inquiry Workspace"
                    message="We could not retrieve inquiry data. Check your connection and permissions, then try again."
                    onRetry={() => void refetch()}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                        {mode === 'assignment' ? 'Counselor Assignment Desk' : 'Enterprise Inquiry Workspace'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {mode === 'assignment'
                            ? 'Assign counselors, reassign, and manage lead queues.'
                            : 'Operational CRM console — walk-ins through conversion.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                    <ExportMenu
                        title="Inquiry Report"
                        data={exportData}
                        columns={Object.keys(exportData[0] ?? { Student: '' })}
                    />
                    {mode === 'workspace' && (
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white gap-1.5">
                            <Plus className="w-4 h-4" /> Add Inquiry
                        </Button>
                    )}
                </div>
            </div>

            {mode === 'workspace' && <InquiryKPIs metrics={metrics} />}

            {createError != null && (
                <WorkspaceErrorBanner
                    error={createError}
                    onDismiss={() => setCreateError(null)}
                    onRetry={() => {
                        setCreateError(null);
                        void handleCreate({ preventDefault: () => undefined } as React.FormEvent);
                    }}
                />
            )}

            {assignError != null && (
                <WorkspaceErrorBanner
                    error={assignError}
                    onDismiss={() => setAssignError(null)}
                    onRetry={
                        lastAssignLeadId
                            ? () => {
                                  setAssignError(null);
                                  void handleAssign(lastAssignLeadId);
                              }
                            : undefined
                    }
                />
            )}

            {convertMutation.isError && convertMutation.error && (
                <WorkspaceErrorBanner
                    error={convertMutation.error}
                    onDismiss={() => convertMutation.reset()}
                    onRetry={
                        lastConvertId
                            ? () => {
                                  convertMutation.reset();
                                  convertMutation.mutate(lastConvertId);
                              }
                            : undefined
                    }
                />
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search student, parent, phone, email, inquiry #, program, counselor, status…"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
            </div>

            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                {SECTIONS.filter(s => mode !== 'assignment' || ['unassigned', 'assigned', 'followups'].includes(s.id)).map(
                    section => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(section.id)}
                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                                activeSection === section.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-400'
                            }`}
                        >
                            {section.label}
                            {section.id === 'followups' && buckets.today.length > 0 && (
                                <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                    {buckets.today.length}
                                </span>
                            )}
                        </button>
                    ),
                )}
            </div>

            {displayLeads.length === 0 ? (
                <EmptyState
                    title="No Records in This Section"
                    message={
                        mode === 'workspace'
                            ? 'There are no inquiries matching this filter. Use Add Inquiry to register a new walk-in or online enquiry.'
                            : 'No leads are waiting for assignment in this section.'
                    }
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayLeads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead as Lead}
                            onConvert={canManageLeads ? handleConvert : undefined}
                            onAssign={mode === 'assignment' ? handleAssign : id => handleAssign(id)}
                            showAssign={canAssign && (mode === 'assignment' || activeSection === 'unassigned')}
                            counselorId={counselorId}
                            isConverting={convertMutation.isPending}
                            isAssigning={isAssigning}
                            defaultExpanded={selectedLeadId === lead.id}
                        />
                    ))}
                </div>
            )}

            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-card rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-sm font-black text-gray-900">New Walk-In Inquiry</h2>
                        {duplicates.length > 0 && (
                            <LeadDuplicateAlert
                                matches={duplicates}
                                onOpenExisting={id => {
                                    setSelectedLeadId(id);
                                    setIsCreateOpen(false);
                                    setActiveSection('online');
                                }}
                            />
                        )}
                        <form onSubmit={handleCreate} className="space-y-4">
                            {/* Academic Info Grid */}
                            <div className="border-b border-gray-100 pb-3">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">1. Institution & Academic Details</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">School *</label>
                                        <select
                                            value={formData.school_id}
                                            onChange={e => setFormData({ ...formData, school_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                            required
                                        >
                                            {schools.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Academic Year *</label>
                                        <select
                                            value={formData.academic_year_id}
                                            onChange={e => setFormData({ ...formData, academic_year_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                            required
                                        >
                                            {academicYears.length === 0 ? (
                                                <option value="">No Academic Year</option>
                                            ) : (
                                                academicYears.map(y => (
                                                    <option key={y.id} value={y.id}>{y.year_label}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Applying Grade *</label>
                                        <select
                                            value={formData.grade_applied_for}
                                            onChange={e => setFormData({ ...formData, grade_applied_for: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                            required
                                        >
                                            {grades.map(g => (
                                                <option key={g.id} value={g.name}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Board *</label>
                                        <select
                                            value={formData.board}
                                            onChange={e => setFormData({ ...formData, board: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                            required
                                        >
                                            {boards.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Quota *</label>
                                        <select
                                            value={formData.quota}
                                            onChange={e => setFormData({ ...formData, quota: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                            required
                                        >
                                            {quotas.map(q => (
                                                <option key={q} value={q}>{q}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Fee Category / Structure *</label>
                                        <select
                                            value={formData.fee_structure_id}
                                            onChange={e => setFormData({ ...formData, fee_structure_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                            required
                                        >
                                            {feeStructures.map(f => (
                                                <option key={f.id} value={f.id}>{f.name} (₹{f.amount ?? 'N/A'})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Student & Parent Info Grid */}
                            <div className="border-b border-gray-100 pb-3">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">2. Candidate & Parent Information</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Student Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.student_name}
                                            onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-xl text-xs ${errors.student_name ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {errors.student_name && <p className="text-[10px] text-red-500 mt-1">{errors.student_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Date of Birth *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date_of_birth}
                                            onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-xl text-xs ${errors.date_of_birth ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {errors.date_of_birth && <p className="text-[10px] text-red-500 mt-1">{errors.date_of_birth}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Parent Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.parent_name}
                                            onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-xl text-xs ${errors.parent_name ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {errors.parent_name && <p className="text-[10px] text-red-500 mt-1">{errors.parent_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Relationship</label>
                                        <select
                                            value={formData.relationship}
                                            onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {relationships.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Parent Occupation</label>
                                        <select
                                            value={formData.occupation}
                                            onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {occupations.map(o => (
                                                <option key={o} value={o}>{o}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Phone *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-xl text-xs ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                                        />
                                        {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Demographics Grid */}
                            <div className="border-b border-gray-100 pb-3">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">3. Demographics & Contact</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Religion</label>
                                        <select
                                            value={formData.religion}
                                            onChange={e => setFormData({ ...formData, religion: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {religions.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {categories.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Blood Group</label>
                                        <select
                                            value={formData.blood_group}
                                            onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {bloodGroups.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Country</label>
                                        <select
                                            value={formData.country}
                                            onChange={e => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {countries.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">State</label>
                                        <select
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {states.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">City</label>
                                        <select
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {cities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 mt-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Current School</label>
                                        <input
                                            type="text"
                                            value={formData.current_school}
                                            onChange={e => setFormData({ ...formData, current_school: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logistics & Assignment Info */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">4. Operations & Assignments</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Lead Source *</label>
                                        <select
                                            value={formData.source}
                                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                            required
                                        >
                                            {admissionSources.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Assign Counselor</label>
                                        <select
                                            value={formData.counselor_id}
                                            onChange={e => setFormData({ ...formData, counselor_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {counselors.map(c => (
                                                <option key={c.id} value={c.id}>{c.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Transport Route Preference</label>
                                        <select
                                            value={formData.transport_route_id}
                                            onChange={e => setFormData({ ...formData, transport_route_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {transportRoutes.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Hostel Room Type Preference</label>
                                        <select
                                            value={formData.hostel_room_type}
                                            onChange={e => setFormData({ ...formData, hostel_room_type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {hostelRoomTypes.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-white px-5">
                                    {createMutation.isPending ? 'Saving...' : 'Save Inquiry'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InquiryWorkspace;
