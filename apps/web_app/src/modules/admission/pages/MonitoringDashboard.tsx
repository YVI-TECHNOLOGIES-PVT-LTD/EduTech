import React, { useState, useEffect } from 'react';
import { RefreshCw, Monitor, AlertTriangle, Play, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/button';

export function MonitoringDashboard() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActiveSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Query sessions with attempts and allocations
            const { data, error: err } = await supabase
                .from('admission_assessment_sessions')
                .select('*, admission_assessment_attempts(*, snapshot:admission_assessment_snapshots(duration, name)), candidate:admission_exam_session_candidates(*)')
                .order('created_at', { ascending: false });

            if (err) throw err;

            // Enrich with candidate student name and telemetry warnings
            const enriched = [];
            for (const s of data || []) {
                let studentName = 'Candidate';
                if (s.candidate?.application_id) {
                    const { data: app } = await supabase
                        .from('admission_applications')
                        .select('lead_id')
                        .eq('id', s.candidate.application_id)
                        .maybeSingle();

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

                            studentName = enquiry?.student_name || 'Candidate';
                        }
                    }
                }

                // Query warning count
                const { count } = await supabase
                    .from('admission_assessment_events')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', s.id);

                enriched.push({
                    ...s,
                    student_name: studentName,
                    warning_count: count || 0
                });
            }

            setSessions(enriched);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch monitoring logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveSessions();
        const interval = setInterval(() => {
            fetchActiveSessions();
        }, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: string, heartbeat: string | null) => {
        if (status === 'COMPLETED') {
            return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">Submitted</span>;
        }

        // Heartbeat timeout check (last heartbeat older than 60 seconds)
        if (heartbeat) {
            const diff = Date.now() - new Date(heartbeat).getTime();
            if (diff > 60 * 1000) {
                return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">Disconnected</span>;
            }
        }

        if (status === 'ACTIVE') {
            return <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-lg text-[10px] font-bold animate-pulse">Writing</span>;
        }

        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">Allocated</span>;
    };

    return (
        <div className="space-y-6 pb-12 select-none">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Assessment Monitor</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time invigilation control console — Admission Assessment Engine</p>
                </div>
                <Button onClick={fetchActiveSessions} className="gap-2 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Console
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-2xl">
                    {error}
                </div>
            )}

            {loading && sessions.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500 animate-pulse">
                    Connecting to live telemetry heartbeat registries…
                </div>
            ) : (
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                                <th className="p-4">Candidate</th>
                                <th className="p-4">Ticket</th>
                                <th className="p-4">Template</th>
                                <th className="p-4">IP / Browser</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Warnings</th>
                                <th className="p-4">Invigilation Logs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => {
                                const attempt = s.admission_assessment_attempts?.[0];
                                return (
                                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="p-4 font-bold text-gray-900">{s.student_name}</td>
                                        <td className="p-4 font-mono text-gray-500">{s.candidate?.hall_ticket_number || 'N/A'}</td>
                                        <td className="p-4 text-gray-700">{attempt?.snapshot?.name || 'Entrance Exam'}</td>
                                        <td className="p-4 text-gray-500 truncate max-w-[200px]" title={s.browser_agent}>
                                            <span className="font-mono">{s.ip_address || 'N/A'}</span>
                                        </td>
                                        <td className="p-4">{getStatusBadge(s.status, s.last_heartbeat_at)}</td>
                                        <td className="p-4">
                                            {s.warning_count > 0 ? (
                                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg font-bold">
                                                    <AlertTriangle className="w-3 h-3 shrink-0" /> {s.warning_count}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] text-gray-500">
                                                {s.last_heartbeat_at ? `Heartbeat: ${new Date(s.last_heartbeat_at).toLocaleTimeString()}` : 'No heartbeat yet'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-sm text-gray-400">
                                        No candidates currently allocated or writing assessments.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default MonitoringDashboard;
