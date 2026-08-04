import React, { useMemo, useState } from 'react';
import { Users, Calendar, AlertCircle, Award, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { admissionApi } from '../../../admission.api';
import { toast } from 'sonner';

interface InterviewWorkspaceProps {
    applications: any[];
    isLoading: boolean;
    refetch: () => void;
}

export function InterviewWorkspace({ applications, isLoading, refetch }: InterviewWorkspaceProps) {
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [score, setScore] = useState('');
    const [remarks, setRemarks] = useState('');
    const [interviewer, setInterviewer] = useState('');
    const [date, setDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const interviewApps = useMemo(() => {
        return applications.filter(a => ['interview', 'document_verified', 'exam_completed'].includes(a.status));
    }, [applications]);

    const activeApp = useMemo(() => {
        return applications.find(a => a.id === selectedAppId) || null;
    }, [applications, selectedAppId]);

    const handleSchedule = async () => {
        if (!selectedAppId || !interviewer || !date) {
            return toast.warning('Interviewer name and schedule date required');
        }
        try {
            setSubmitting(true);
            await admissionApi.scheduleInterview({
                application_id: selectedAppId,
                interviewer_name: interviewer,
                scheduled_date: date
            });
            toast.success('Interview scheduled successfully');
            setInterviewer('');
            setDate('');
            refetch();
        } catch {
            toast.error('Scheduling failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRecordScore = async (recommendation: 'RECOMMENDED' | 'REJECTED' | 'HOLD') => {
        if (!selectedAppId || !score) {
            return toast.warning('Please enter an evaluation score');
        }
        try {
            setSubmitting(true);
            await admissionApi.recordInterviewScore({
                application_id: selectedAppId,
                score: Number(score),
                recommendation,
                remarks: remarks || 'Interview rating logged'
            });
            toast.success('Interview evaluation score recorded');
            setScore('');
            setRemarks('');
            setSelectedAppId(null);
            refetch();
        } catch {
            toast.error('Failed to log evaluation score');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column Candidate List */}
            <div className="bg-white dark:bg-card p-5 border rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center justify-between pb-2 border-b">
                    <span>Interviews Queue</span>
                    <span className="px-2 py-0.5 rounded bg-gray-150 text-[9px] font-black text-gray-700">
                        {interviewApps.length}
                    </span>
                </h3>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                    {isLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading queue...</p>
                    ) : interviewApps.length === 0 ? (
                        <p className="text-xs text-gray-400">No applicants awaiting interviews.</p>
                    ) : (
                        interviewApps.map(app => {
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

            {/* Right Column Evaluation Form */}
            <div className="lg:col-span-2 bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-5">
                {activeApp ? (
                    <>
                        <div className="pb-3 border-b">
                            <h3 className="text-sm font-black text-gray-900">{activeApp.student_name}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{activeApp.id} • {activeApp.grade_applied_for}</p>
                        </div>

                        {/* Scheduling Section */}
                        <div className="p-4 border rounded-xl bg-gray-50/50 space-y-4">
                            <h4 className="text-xs font-black uppercase text-gray-700 flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-indigo-500" /> Schedule Panel Interview
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Interviewer Name</label>
                                    <input
                                        type="text"
                                        value={interviewer}
                                        onChange={e => setInterviewer(e.target.value)}
                                        placeholder="e.g. Dr. Arthur Dent"
                                        className="w-full text-xs border rounded-lg p-2 bg-white h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Schedule Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full text-xs border rounded-lg p-2 bg-white h-9"
                                    />
                                </div>
                            </div>
                            <Button size="sm" onClick={handleSchedule} disabled={submitting} className="text-xs bg-indigo-600 hover:bg-indigo-700">
                                Dispatch Schedule Notification
                            </Button>
                        </div>

                        {/* Scorecard Inputs */}
                        <div className="p-4 border rounded-xl bg-white space-y-4">
                            <h4 className="text-xs font-black uppercase text-gray-700 flex items-center gap-1">
                                <Award className="w-4 h-4 text-indigo-500" /> Interview Scorecard & Decision
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Score (0 - 100)</label>
                                    <input
                                        type="number"
                                        value={score}
                                        onChange={e => setScore(e.target.value)}
                                        placeholder="Enter percentage"
                                        className="w-full text-xs border rounded-lg p-2 h-9"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Interviewer Comments</label>
                                    <input
                                        type="text"
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                        placeholder="Log specific strengths or development areas..."
                                        className="w-full text-xs border rounded-lg p-2 h-9"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2 flex-wrap">
                                <Button
                                    size="sm"
                                    onClick={() => handleRecordScore('RECOMMENDED')}
                                    disabled={submitting || !score}
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Recommend Admission
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRecordScore('HOLD')}
                                    disabled={submitting || !score}
                                    className="text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                                >
                                    Place On Hold
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRecordScore('REJECTED')}
                                    disabled={submitting || !score}
                                    className="text-xs"
                                >
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Candidate
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-24 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-bold">Select a candidate from the left panel to begin interview logging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InterviewWorkspace;
