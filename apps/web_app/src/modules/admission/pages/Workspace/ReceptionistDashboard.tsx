import React, { useState, useMemo } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLeadDashboard } from '../../hooks/useLeads';
import { useCreateEnquiry, useCreateVisitor } from '../../hooks/useInquiry';
import { useFollowups, useCompleteFollowup } from '../../hooks/useFollowups';
import { LeadMetricsPanel } from '../../components/inquiry/LeadMetrics';
import { ActionQueueWidget } from '../../components/widgets/DashboardWidgets';
import { findDuplicates } from '../../utils/duplicate.detector';
import { parseAdmissionApiError } from '../../utils/admissionError.utils';
import { LeadDuplicateAlert } from '../../components/inquiry/LeadDuplicateAlert';
import { useAuth } from '../../../../context/AuthContext';
import { useMasterData } from '../../context/MasterDataContext';

export function ReceptionistDashboard() {
    const { hasPermission } = useAuth();
    const { grades } = useMasterData();
    const canManageLeads = hasPermission('admission.leads.manage');

    const { metrics, allRecords, refetch } = useLeadDashboard();
    const { buckets } = useFollowups();
    const createEnquiry = useCreateEnquiry();
    const createVisitor = useCreateVisitor();
    const completeFollowup = useCompleteFollowup();

    const [parentName, setParentName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [grade, setGrade] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Initialize default grade from dynamic master data
    React.useEffect(() => {
        if (grades.length > 0 && !grade) {
            setGrade(grades[0].name);
        }
    }, [grades, grade]);

    const duplicates = useMemo(
        () =>
            findDuplicates(
                { phone, email, parent_name: parentName, student_name: studentName },
                allRecords,
            ),
        [phone, email, parentName, studentName, allRecords],
    );

    const actionItems = useMemo(
        () =>
            [...buckets.today, ...buckets.missed].slice(0, 8).map(f => ({
                id: f.id,
                title: f.remarks ?? 'Follow-up required',
                description: f.assigned_to ?? f.assigned_staff ?? 'Unassigned',
                status: (buckets.missed.includes(f) ? 'urgent' : 'pending') as 'urgent' | 'pending',
                time: f.scheduled_at ?? f.due_date ?? '',
            })),
        [buckets],
    );

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!parentName || !phone || !studentName) return;

        try {
            await createEnquiry.mutateAsync({
                student_name: studentName.trim(),
                parent_name: parentName.trim(),
                parent_email: email.trim(),
                parent_phone: phone.trim(),
                grade_applied_for: grade,
                source: 'Walk-in',
            });
            await createVisitor.mutateAsync({
                visitor_name: parentName.trim(),
                phone: phone.trim(),
                purpose: 'Admission inquiry',
                student_name: studentName.trim(),
            }).catch(() => undefined);

            setIsSuccess(true);
            refetch();
            setTimeout(() => {
                setIsSuccess(false);
                setParentName('');
                setStudentName('');
                setEmail('');
                setPhone('');
            }, 2000);
        } catch (err) {
            toast.error(parseAdmissionApiError(err).message);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Receptionist Admissions Console
            </h2>

            <LeadMetricsPanel metrics={metrics} variant="reception" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        <UserPlus className="w-4 h-4 text-indigo-500" /> Log Walk-in Inquiry
                    </h3>

                    {duplicates.length > 0 && (
                        <LeadDuplicateAlert matches={duplicates} />
                    )}

                    {isSuccess ? (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 border border-emerald-100 text-xs font-bold">
                            <CheckCircle className="w-4 h-4" /> Inquiry registered successfully!
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4 text-xs font-medium">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase">Student Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={studentName}
                                        onChange={e => setStudentName(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase">Parent/Guardian Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={parentName}
                                        onChange={e => setParentName(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase">Mobile Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase">Email ID</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 font-bold uppercase">Applying Grade</label>
                                <select
                                    value={grade}
                                    onChange={e => setGrade(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                    {grades.length === 0 ? (
                                        <option value="">Loading grades...</option>
                                    ) : (
                                        grades.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={createEnquiry.isPending}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50"
                            >
                                Log Lead Inquiry
                            </button>
                        </form>
                    )}
                </div>

                {canManageLeads && (
                    <div className="space-y-6">
                        <ActionQueueWidget
                            items={actionItems}
                            onItemClick={(id: string) => completeFollowup.mutate(id)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReceptionistDashboard;
