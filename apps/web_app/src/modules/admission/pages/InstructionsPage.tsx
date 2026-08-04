import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../lib/api-client';

export function InstructionsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCandidateAllocations = async () => {
            try {
                if (!user) return;
                // Get parent's applications
                const { data: apps, error: appErr } = await supabase
                    .from('admission_applications')
                    .select('id, lead_id')
                    .eq('created_by', user.id)
                    .is('deleted_at', null);

                if (appErr) throw appErr;

                const appIds = apps?.map(a => a.id) || [];
                if (appIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // Get allocations
                const { data: allocations, error: allocErr } = await supabase
                    .from('admission_exam_session_candidates')
                    .select('*, admission_exam_schedule(room_name, exam_date, admission_exam_templates(name, duration, total_marks))')
                    .in('application_id', appIds);

                if (allocErr) throw allocErr;

                // Enrich with candidate name from leads
                const enriched = [];
                for (const alloc of allocations || []) {
                    const app = apps.find(a => a.id === alloc.application_id);
                    if (app?.lead_id) {
                        const { data: lead } = await supabase
                            .from('admission_leads')
                            .select('enquiry_id')
                            .eq('id', app.lead_id)
                            .maybeSingle();

                        if (lead?.enquiry_id) {
                            const { data: enquiry } = await supabase
                                .from('admission_enquiries')
                                .select('student_name')
                                .eq('id', lead.enquiry_id)
                                .maybeSingle();

                            enriched.push({
                                ...alloc,
                                student_name: enquiry?.student_name || 'Candidate'
                            });
                        }
                    }
                }

                setCandidates(enriched);
                if (enriched.length > 0) {
                    setSelectedCandidate(enriched[0]);
                }
            } catch (err: any) {
                console.error('Failed to load allocations:', err);
                setError('Could not retrieve candidate allocation.');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidateAllocations();
    }, [user]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCandidate || !otp) {
            setError('Please verify candidate and enter OTP code.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Verify OTP and get Exam Token
            const verifyRes = await apiClient.post('/v1/admission/assessment/otp/verify', {
                candidate_id: selectedCandidate.id,
                otp
            });

            const examToken = verifyRes.data.token;
            localStorage.setItem('admission_exam_token', examToken);

            // 2. Fetch session
            const { data: sessionData } = await supabase
                .from('admission_assessment_sessions')
                .select('id')
                .eq('candidate_allocation_id', selectedCandidate.id)
                .maybeSingle();

            if (!sessionData) {
                throw new Error('Session registration mismatch.');
            }

            localStorage.setItem('admission_exam_session_id', sessionData.id);

            // 3. Start attempt
            const attemptRes = await apiClient.post('/v1/admission/assessment/attempt/start', {
                session_id: sessionData.id
            });

            localStorage.setItem('admission_exam_attempt_id', attemptRes.data.attempt.id);

            // Navigate to workspace
            navigate('/app/admissions/entrance-assessment/workspace');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Verification failed. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestOTP = async () => {
        if (!selectedCandidate) return;
        setError(null);
        try {
            const res = await apiClient.post('/v1/admission/assessment/otp/request', {
                candidate_id: selectedCandidate.id
            });
            alert(`OTP dispatched! (For sandbox verification, code is: ${res.data.otp})`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to dispatch OTP.');
        }
    };

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-gray-500 animate-pulse">
                Verifying entrance assessment availability…
            </div>
        );
    }

    if (candidates.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <h1 className="text-xl font-bold text-gray-900">No Assessment Scheduled</h1>
                <p className="text-sm text-gray-500">
                    Your application is not currently scheduled for an entrance assessment. Please contact the admissions coordinator.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="bg-gradient-to-r from-primary to-indigo-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                    <h1 className="text-3xl font-black tracking-tight">Entrance Assessment Portal</h1>
                    <p className="text-primary-foreground/95 text-sm max-w-xl">
                        Admission Screening & Screening Engine — Greenwood High School ERP
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 transform origin-right" />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">
                        <h2 className="text-base font-black text-gray-900 flex items-center gap-2 border-b pb-4">
                            <Clock className="w-5 h-5 text-primary" /> General Instructions
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900">Timed Assessment</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        The assessment will automatically submit when the duration runs out. Remaining time is calculated and synced on the server.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900">Autosave Safeguard</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Your progress is saved automatically. In case of browser refresh or connection dropouts, log in again to resume your timer.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900">Anti-Cheating Controls</h4>
                                    <p className="text-xs text-gray-500 mt-1 font-medium text-rose-600">
                                        Tab-switching, copying, window blurring, and exiting full-screen are logged as warnings. Exceeding warnings will lock or auto-submit the assessment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6 h-fit">
                    <h2 className="text-base font-black text-gray-900 flex items-center gap-2 border-b pb-4">
                        <ShieldCheck className="w-5 h-5 text-primary" /> Session Verification
                    </h2>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-semibold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700">Select Candidate</label>
                            <select
                                className="w-full p-2.5 border rounded-xl text-xs"
                                value={selectedCandidate?.id}
                                onChange={e => {
                                    const c = candidates.find(cand => cand.id === e.target.value);
                                    setSelectedCandidate(c);
                                }}
                            >
                                {candidates.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.student_name} ({c.admission_exam_schedule?.admission_exam_templates?.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCandidate && (
                            <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-500 space-y-1">
                                <p><strong>Duration:</strong> {selectedCandidate.admission_exam_schedule?.admission_exam_templates?.duration} Minutes</p>
                                <p><strong>Total Marks:</strong> {selectedCandidate.admission_exam_schedule?.admission_exam_templates?.total_marks} Marks</p>
                                <p><strong>Ticket Number:</strong> {selectedCandidate.hall_ticket_number}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700">Verification OTP</label>
                                <button
                                    type="button"
                                    onClick={handleRequestOTP}
                                    className="text-xs text-primary font-bold hover:underline"
                                >
                                    Get OTP Code
                                </button>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs text-center tracking-widest font-mono"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Starting attempt…' : 'Authenticate & Write Exam'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default InstructionsPage;
