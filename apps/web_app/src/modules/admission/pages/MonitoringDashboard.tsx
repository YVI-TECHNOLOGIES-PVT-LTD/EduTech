import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Monitor,
  AlertTriangle,
  Play,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  DashboardPageHeader,
  DashboardKpiCard,
  DashboardSection,
  DashboardEmptyState,
  DashboardErrorState,
} from '@/components/dashboard';

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
        .select(
          '*, admission_assessment_attempts(*, snapshot:admission_assessment_snapshots(duration, name)), candidate:admission_exam_session_candidates(*)',
        )
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
          warning_count: count || 0,
        });
      }

      setSessions(enriched);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch monitoring telemetry.');
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

  const metrics = useMemo(() => {
    const total = sessions.length;
    let writing = 0;
    let submitted = 0;
    let warnings = 0;

    sessions.forEach((s) => {
      if (s.status === 'COMPLETED') submitted++;
      else if (s.status === 'ACTIVE') writing++;
      warnings += s.warning_count || 0;
    });

    return { total, writing, submitted, warnings };
  }, [sessions]);

  const getStatusBadge = (status: string, heartbeat: string | null) => {
    if (status === 'COMPLETED') {
      return (
        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Submitted
        </span>
      );
    }

    // Heartbeat timeout check (last heartbeat older than 60 seconds)
    if (heartbeat) {
      const diff = Date.now() - new Date(heartbeat).getTime();
      if (diff > 60 * 1000) {
        return (
          <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Disconnected
          </span>
        );
      }
    }

    if (status === 'ACTIVE') {
      return (
        <span className="bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
          Writing
        </span>
      );
    }

    return (
      <span className="bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
        Allocated
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. Header Banner */}
      <DashboardPageHeader
        title="Assessment Invigilation Monitor"
        description="Real-time test session monitoring, proctoring telemetry, heartbeat signals, and integrity warnings."
        badge={{
          text: 'Live Exam Console',
          variant: 'info',
          icon: Monitor,
        }}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActiveSessions}
            disabled={loading}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        }
      />

      {error && <DashboardErrorState message={error} onRetry={fetchActiveSessions} />}

      {/* 2. Invigilation KPIs */}
      <DashboardSection
        title="Session Telemetry Overview"
        description="Active test candidate counts, submitted papers, and detected flags."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Total Candidates"
            value={metrics.total}
            subtitle="Allocated test sessions"
            icon={Users}
            variant="primary"
            loading={loading && sessions.length === 0}
          />
          <DashboardKpiCard
            title="Actively Writing"
            value={metrics.writing}
            subtitle="Live concurrent test-takers"
            icon={Play}
            variant="info"
            loading={loading && sessions.length === 0}
          />
          <DashboardKpiCard
            title="Papers Submitted"
            value={metrics.submitted}
            subtitle="Completed submissions"
            icon={CheckCircle2}
            variant="success"
            loading={loading && sessions.length === 0}
          />
          <DashboardKpiCard
            title="Integrity Warnings"
            value={metrics.warnings}
            subtitle="Window blur & security alerts"
            icon={AlertTriangle}
            variant={metrics.warnings > 0 ? 'danger' : 'neutral'}
            loading={loading && sessions.length === 0}
          />
        </div>
      </DashboardSection>

      {/* 3. Live Session Table */}
      <DashboardSection
        title="Active Assessment Sessions"
        description="Candidate browser coordinates, hall ticket numbers, and live heartbeat telemetry."
      >
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          {sessions.length === 0 ? (
            <DashboardEmptyState
              icon={Monitor}
              title="No Candidates Currently Writing"
              message="There are no active exam sessions running in the portal at this time."
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Template</th>
                    <th className="py-3 px-4">IP / Browser</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Warnings</th>
                    <th className="py-3 px-4">Invigilation Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sessions.map((s) => {
                    const attempt = s.admission_assessment_attempts?.[0];
                    return (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">{s.student_name}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {s.candidate?.hall_ticket_number || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {attempt?.snapshot?.name || 'Entrance Exam'}
                        </td>
                        <td
                          className="py-3 px-4 text-muted-foreground truncate max-w-[200px]"
                          title={s.browser_agent}
                        >
                          <span className="font-mono">{s.ip_address || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(s.status, s.last_heartbeat_at)}
                        </td>
                        <td className="py-3 px-4">
                          {s.warning_count > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 shrink-0" /> {s.warning_count}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">
                          {s.last_heartbeat_at
                            ? `Heartbeat: ${new Date(s.last_heartbeat_at).toLocaleTimeString()}`
                            : 'No heartbeat yet'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardSection>
    </div>
  );
}

export default MonitoringDashboard;
