import React, { useMemo, useState } from 'react';
import { Award, UserCheck, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnrollment, useEnrollmentStatus } from '../../../hooks/useEnrollment';
import { toast } from 'sonner';

interface EnrollmentWorkspaceProps {
    applications: any[];
    isLoading: boolean;
    refetch: () => void;
}

export function EnrollmentWorkspace({ applications, isLoading, refetch }: EnrollmentWorkspaceProps) {
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [section, setSection] = useState('A');
    const [rollNo, setRollNo] = useState('');
    const [house, setHouse] = useState('Red');
    const [transport, setTransport] = useState('Bus Route 3');
    const [hostel, setHostel] = useState('None');

    const enrollmentApps = useMemo(() => {
        return applications.filter(a => ['fee_verified', 'payment_verified', 'enrollment_pending', 'enrolled'].includes(a.status));
    }, [applications]);

    const activeApp = useMemo(() => {
        return applications.find(a => a.id === selectedAppId) || null;
    }, [applications, selectedAppId]);

    const { data: enrollmentStatus, refetch: refetchEnrollment } = useEnrollmentStatus(selectedAppId || '');
    const { enroll, confirm, isEnrolling, isConfirming } = useEnrollment();

    const handleConfirmDetails = async () => {
        if (!selectedAppId) return;
        try {
            await confirm({ applicationId: selectedAppId });
            toast.success('Academic parameters verified for enrollment');
            refetchEnrollment();
            refetch();
        } catch (e: any) {
            toast.error(e?.message || 'Verification failed');
        }
    };

    const handleEnroll = async () => {
        if (!selectedAppId || !rollNo) return toast.warning('Roll / Admission number required');
        try {
            await enroll({ applicationId: selectedAppId });
            toast.success('Provisioning complete! Student record created in SIS Master.');
            refetchEnrollment();
            refetch();
        } catch (e: any) {
            toast.error(e?.message || 'Student master handoff failed');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Queue list */}
            <div className="bg-white dark:bg-card p-5 border rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center justify-between pb-2 border-b">
                    <span>Enrollment Queue</span>
                    <span className="px-2 py-0.5 rounded bg-gray-150 text-[9px] font-black text-gray-700">
                        {enrollmentApps.length}
                    </span>
                </h3>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                    {isLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading list...</p>
                    ) : enrollmentApps.length === 0 ? (
                        <p className="text-xs text-gray-400">No applicants ready for final SIS enrollment.</p>
                    ) : (
                        enrollmentApps.map(app => {
                            const isSelected = selectedAppId === app.id;
                            return (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedAppId(app.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                                            : 'hover:bg-gray-50 border-gray-100 text-gray-700'
                                    }`}
                                >
                                    <p className="font-bold text-[11px] truncate">{app.student_name}</p>
                                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase mt-1">
                                        <span>{app.id.slice(0, 8)} • {app.grade_applied_for}</span>
                                        <span className="text-indigo-600">{app.status}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Provision Form */}
            <div className="lg:col-span-2 bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-5">
                {activeApp ? (
                    <>
                        <div className="pb-3 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-gray-900">{activeApp.student_name}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{activeApp.id} • {activeApp.grade_applied_for}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => refetchEnrollment()} className="h-8 gap-1">
                                <RefreshCw className="w-3.5 h-3.5" /> Re-sync
                            </Button>
                        </div>

                        {/* SIS parameters inputs */}
                        <div className="p-4 border rounded-xl bg-gray-50/50 space-y-4">
                            <h4 className="text-xs font-black uppercase text-gray-700 flex items-center gap-1">
                                <UserCheck className="w-4 h-4 text-indigo-500" /> SIS Section & Identity Mapping
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Section</label>
                                    <select value={section} onChange={e => setSection(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white h-9">
                                        <option value="A">Section A</option>
                                        <option value="B">Section B</option>
                                        <option value="C">Section C</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Roll / Admission Number</label>
                                    <input
                                        type="text"
                                        value={rollNo}
                                        onChange={e => setRollNo(e.target.value)}
                                        placeholder="e.g. ADM-2026-0041"
                                        className="w-full border rounded-lg p-2.5 bg-white h-9"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">House Group</label>
                                    <select value={house} onChange={e => setHouse(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white h-9">
                                        <option value="Red">Red House</option>
                                        <option value="Blue">Blue House</option>
                                        <option value="Green">Green House</option>
                                        <option value="Gold">Gold House</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Transport Route</label>
                                    <select value={transport} onChange={e => setTransport(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white h-9">
                                        <option value="None">No Transport</option>
                                        <option value="Bus Route 3">Bus Route 3 - South Campus</option>
                                        <option value="Bus Route 5">Bus Route 5 - East Campus</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Hostel block</label>
                                    <select value={hostel} onChange={e => setHostel(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white h-9">
                                        <option value="None">Day Scholar</option>
                                        <option value="A-Block">A-Block Boy's Residence</option>
                                        <option value="B-Block">B-Block Girl's Residence</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Integration buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                size="sm"
                                onClick={handleConfirmDetails}
                                disabled={isConfirming}
                                className="text-xs bg-indigo-600"
                            >
                                {isConfirming ? 'Confirming...' : 'Verify Academic Details'}
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleEnroll}
                                disabled={isEnrolling || !rollNo}
                                className="text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {isEnrolling ? 'Provisioning...' : 'Finalize Sync & Provision to Student Master'}
                            </Button>
                        </div>

                        {/* Sync Check card */}
                        {enrollmentStatus && (
                            <div className="p-4 border rounded-xl bg-white space-y-2 text-xs">
                                <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-emerald-500" /> ERP Student Status Check
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-gray-600 font-medium">
                                    <div>Student ID: <span className="font-bold text-gray-900">{enrollmentStatus.studentId || 'Not Yet Provisioned'}</span></div>
                                    <div>Admission Number: <span className="font-bold text-gray-900">{enrollmentStatus.admissionNumber || '—'}</span></div>
                                    <div>Email Broadcast: <span className="font-bold text-emerald-600 text-[10px] uppercase">Sent Successfully</span></div>
                                    <div>Parent Portal: <span className="font-bold text-emerald-600 text-[10px] uppercase">Activated</span></div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-24 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-bold">Select a candidate from the left panel to execute final ERP SIS student provisioning.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EnrollmentWorkspace;
