import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Save, ShieldAlert, Monitor, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { supabase } from '../../../lib/supabase';

interface Question {
    id: string;
    question_text: string;
    question_type: 'MCQ' | 'TRUE_FALSE' | 'SUBJECTIVE' | 'MULTIPLE_SELECT';
    section_name: string;
    points: number;
    options: Array<{ id: string; option_text: string }>;
}

export function TestPortal() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [responses, setResponses] = useState<Record<string, { selected_option_id?: string; text_answer?: string }>>({});
    const [bufferedResponses, setBufferedResponses] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;

    // Session & Timers
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [warnings, setWarnings] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs
    const tokenRef = useRef<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const attemptIdRef = useRef<string | null>(null);
    const autosaveTimerRef = useRef<any>(null);
    const heartbeatTimerRef = useRef<any>(null);

    useEffect(() => {
        tokenRef.current = localStorage.getItem('admission_exam_token');
        sessionIdRef.current = localStorage.getItem('admission_exam_session_id');
        attemptIdRef.current = localStorage.getItem('admission_exam_attempt_id');

        if (!tokenRef.current || !sessionIdRef.current || !attemptIdRef.current) {
            navigate('/app/admissions/entrance-assessment');
            return;
        }

        const initializeTest = async () => {
            try {
                // 1. Fetch Attempt Info to compute server timer
                const { data: attempt, error: attemptErr } = await supabase
                    .from('admission_assessment_attempts')
                    .select('*, snapshot:admission_assessment_snapshots(duration)')
                    .eq('id', attemptIdRef.current)
                    .single();

                if (attemptErr || !attempt) throw new Error('Attempt details not found.');

                const duration = attempt.snapshot.duration * 60; // duration in seconds
                const startTime = new Date(attempt.start_time).getTime();
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((startTime + duration * 1000 - now) / 1000));
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    throw new Error('Assessment session has already expired.');
                }

                // 2. Fetch Questions
                const qRes = await apiClient.get(`/v1/admission/assessment/attempt/${attemptIdRef.current}/questions`, {
                    headers: { Authorization: `Bearer ${tokenRef.current}` }
                });
                setQuestions(qRes.data.questions || []);

                // 3. Fetch pre-existing saved answers if resuming
                const { data: savedAnswers } = await supabase
                    .from('admission_assessment_responses')
                    .select('*')
                    .eq('attempt_id', attemptIdRef.current);

                const restored: Record<string, any> = {};
                savedAnswers?.forEach(ans => {
                    restored[ans.snapshot_question_id] = {
                        selected_option_id: ans.selected_option_id || undefined,
                        text_answer: ans.text_answer || undefined
                    };
                });
                setResponses(restored);

                // 4. Log startup event
                await logTelemetry('RECONNECT', { browser: navigator.userAgent });
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to initialize online assessment workspace.');
            } finally {
                setLoading(false);
            }
        };

        initializeTest();

        // Heartbeat timer (30s)
        heartbeatTimerRef.current = setInterval(() => {
            sendHeartbeat();
        }, 30000);

        // Autosave flush timer (10s)
        autosaveTimerRef.current = setInterval(() => {
            flushAutosaveQueue();
        }, 10000);

        // Anti-Cheating Event Listeners
        const handleBlur = () => {
            handleCheatEvent('WINDOW_BLUR', { details: 'Window blurred or lost focus' });
        };
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleCheatEvent('TAB_SWITCH', { details: 'Tab hidden or switched away' });
            }
        };
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            handleCheatEvent('COPY', { details: 'Attempted context menu right-click' });
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                handleCheatEvent('COPY', { details: `Attempted keyboard block: CTRL+${e.key}` });
            }
        };

        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearInterval(heartbeatTimerRef.current);
            clearInterval(autosaveTimerRef.current);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Countdown Timer Loop
    useEffect(() => {
        if (loading || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    triggerAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, loading]);

    const logTelemetry = async (type: string, details?: any) => {
        try {
            await apiClient.post('/v1/admission/assessment/attempt/telemetry', {
                session_id: sessionIdRef.current,
                event_type: type,
                details: details || {}
            }, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
        } catch (e) {
            console.error('Failed to log telemetry:', e);
        }
    };

    const handleCheatEvent = async (type: string, details?: any) => {
        setWarnings(w => w + 1);
        await logTelemetry(type, details);
    };

    const sendHeartbeat = async () => {
        try {
            await apiClient.post('/v1/admission/assessment/attempt/heartbeat', {
                session_id: sessionIdRef.current
            }, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
        } catch (e) {
            console.error('Heartbeat failed:', e);
        }
    };

    const flushAutosaveQueue = async (currentBuffer?: Record<string, any>) => {
        const buffer = currentBuffer || bufferedResponses;
        const keys = Object.keys(buffer);
        if (keys.length === 0) return;

        setIsSaving(true);
        try {
            const payload = keys.map(qid => ({
                snapshot_question_id: qid,
                ...buffer[qid]
            }));

            await apiClient.post(`/v1/admission/assessment/attempt/${attemptIdRef.current}/autosave`, {
                responses: payload
            }, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });

            // Clear buffer on success
            setBufferedResponses(prev => {
                const copy = { ...prev };
                keys.forEach(k => delete copy[k]);
                return copy;
            });
        } catch (err) {
            console.error('Autosave flush failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectOption = (qid: string, optId: string) => {
        const updatedResponse = { selected_option_id: optId };
        setResponses(prev => ({ ...prev, [qid]: updatedResponse }));
        setBufferedResponses(prev => {
            const next = { ...prev, [qid]: updatedResponse };
            // Trigger quick autosave for MCQ updates
            flushAutosaveQueue(next);
            return next;
        });
    };

    const handleTextAnswer = (qid: string, val: string) => {
        const updatedResponse = { text_answer: val };
        setResponses(prev => ({ ...prev, [qid]: updatedResponse }));
        setBufferedResponses(prev => ({ ...prev, [qid]: updatedResponse }));
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const triggerAutoSubmit = async () => {
        setIsSubmitting(true);
        try {
            await flushAutosaveQueue();
            await apiClient.post(`/v1/admission/assessment/attempt/${attemptIdRef.current}/submit`, {}, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
            localStorage.clear();
            navigate('/app/admissions/entrance-assessment/success');
        } catch (e) {
            console.error('Auto submit failed:', e);
            navigate('/app/admissions/entrance-assessment/success');
        }
    };

    const handleFinalSubmit = async () => {
        if (!window.confirm('Are you sure you want to finalize and submit your assessment? You cannot modify answers after this.')) return;
        setIsSubmitting(true);
        try {
            await flushAutosaveQueue();
            await apiClient.post(`/v1/admission/assessment/attempt/${attemptIdRef.current}/submit`, {}, {
                headers: { Authorization: `Bearer ${tokenRef.current}` }
            });
            localStorage.clear();
            navigate('/app/admissions/entrance-assessment/success');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit exam.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-gray-500 animate-pulse">
                Setting up timed assessment snapshot workspace…
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h1 className="text-xl font-bold text-gray-900">Workspace Error</h1>
                <p className="text-sm text-gray-500">{error}</p>
                <button
                    onClick={() => navigate('/app/admissions/entrance-assessment')}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                >
                    Return to Portal
                </button>
            </div>
        );
    }

    // Paginated questions slicing
    const totalPages = Math.ceil(questions.length / itemsPerPage);
    const activeQuestions = questions.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12 select-none">
            {/* Header Workspace */}
            <div className="sticky top-0 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <Monitor className="w-6 h-6 text-primary" />
                    <div>
                        <h2 className="text-sm font-black text-gray-900">Online Assessment Workspace</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Live & Monitored</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Heartbeat Status */}
                    <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-[10px] font-bold">
                        <Video className="w-3.5 h-3.5" /> Camera Active
                    </div>

                    {/* Autosave notice */}
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold">
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Autosaving…' : 'Saved'}</span>
                    </div>

                    {/* Warning Telemetry */}
                    {warnings > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>Warnings: {warnings}</span>
                        </div>
                    )}

                    {/* Countdown Timer */}
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-sm font-black font-mono">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </div>

            {/* Questions Workspace layout */}
            <div className="space-y-6">
                {activeQuestions.map((q, idx) => {
                    const qNumber = currentPage * itemsPerPage + idx + 1;
                    const response = responses[q.id] || {};

                    return (
                        <div key={q.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between border-b pb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase">Question {qNumber} of {questions.length}</span>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{q.points} Points</span>
                            </div>

                            <p className="text-sm font-bold text-gray-900 leading-relaxed">{q.question_text}</p>

                            {/* Options layout */}
                            {q.question_type === 'MCQ' || q.question_type === 'TRUE_FALSE' ? (
                                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                                    {q.options?.map(opt => {
                                        const isSelected = response.selected_option_id === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => handleSelectOption(q.id, opt.id)}
                                                className={`p-4 text-left text-xs font-semibold rounded-xl border transition-all ${
                                                    isSelected
                                                        ? 'bg-primary/5 border-primary text-primary font-black shadow-sm'
                                                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {opt.option_text}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <textarea
                                        rows={4}
                                        value={response.text_answer || ''}
                                        onChange={e => handleTextAnswer(q.id, e.target.value)}
                                        placeholder="Type your response here..."
                                        className="w-full p-4 border border-gray-200 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between pt-4 border-t">
                <button
                    disabled={currentPage === 0}
                    onClick={() => {
                        flushAutosaveQueue();
                        setCurrentPage(prev => prev - 1);
                        window.scrollTo(0, 0);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="text-xs font-bold text-gray-500">
                    Page {currentPage + 1} of {totalPages}
                </div>

                {currentPage < totalPages - 1 ? (
                    <button
                        onClick={() => {
                            flushAutosaveQueue();
                            setCurrentPage(prev => prev + 1);
                            window.scrollTo(0, 0);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting…' : 'Final Submit Assessment'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default TestPortal;
