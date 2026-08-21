import React, { useState } from 'react';
import {
  useGetLeadByIdQuery,
  useGetLeadActivitiesQuery,
  useGetLeadVisitsQuery,
} from '@/shared/api/crm.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserCheck,
  User,
  Clock,
  Calendar,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { AddActivityModal } from '../inquiry/AddActivityModal';
import { ScheduleVisitModal } from '../inquiry/ScheduleVisitModal';
import { CounsellorAssignmentModal } from '../counselling/CounsellorAssignmentModal';

interface Applicant360CounsellingPanelProps {
  applicationId: string;
  leadId?: string | null;
  applicantName?: string;
  counselorName?: string;
  crmLeadScore?: number;
  readOnlyMode?: boolean;
}

export const Applicant360CounsellingPanel: React.FC<Applicant360CounsellingPanelProps> = ({
  applicationId,
  leadId,
  applicantName,
  counselorName,
  crmLeadScore,
  readOnlyMode = false,
}) => {
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  // If leadId is present, fetch full lead details, activities, and visits
  const { data: lead, isLoading: isLoadingLead } = useGetLeadByIdQuery(leadId || '', {
    skip: !leadId,
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useGetLeadActivitiesQuery(
    leadId || '',
    { skip: !leadId },
  );

  const { data: visits = [], isLoading: isLoadingVisits } = useGetLeadVisitsQuery(leadId || '', {
    skip: !leadId,
  });

  if (!leadId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-500" /> Counselling & Lead Dossier
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Counsellor assignment, discussion logs, follow-up schedule, and campus visits.
          </p>
        </div>

        <div className="p-8 text-center border border-dashed border-border rounded-2xl space-y-2 bg-muted/20">
          <UserCheck className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs font-bold text-foreground">Direct Application Record</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            This applicant was registered directly into the admissions system without a preceding
            CRM lead enquiry.
          </p>
          {counselorName && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <User className="w-3.5 h-3.5" /> Assigned Counsellor: {counselorName}
            </div>
          )}
        </div>
      </div>
    );
  }

  const assignedCounsellor = lead?.counselor?.name || counselorName || 'Unassigned';

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Counselling & Lead Dossier
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lead #{lead?.lead_number || '—'} • Counsellor interactions and follow-up timeline.
          </p>
        </div>

        {!readOnlyMode && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAssignmentModalOpen(true)}
              className="text-xs font-bold h-8 gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              {lead?.assigned_counsellor_id ? 'Reassign' : 'Assign Counsellor'}
            </Button>

            <Button
              size="sm"
              onClick={() => setIsActivityModalOpen(true)}
              className="text-xs font-bold h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Activity
            </Button>
          </div>
        )}
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Assigned Counsellor */}
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
            Assigned Counsellor
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-none">{assignedCounsellor}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lead?.counselor?.email || 'Admissions Staff'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: AI Lead Score */}
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
            Lead Scoring & Priority
          </span>
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-base font-black text-foreground">
                {lead?.ai_lead_score ?? crmLeadScore ?? '—'} / 100
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold">
              {lead?.priority || 'Normal'}
            </Badge>
          </div>
        </div>

        {/* Card 3: Next Follow-up */}
        <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
            Next Follow-up
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold text-foreground">
              {(() => {
                const nextDate =
                  lead?.next_followup_date ||
                  lead?.next_follow_up ||
                  activities.find((a) => a.status === 'scheduled' && a.next_followup_date)
                    ?.next_followup_date;

                return nextDate ? (
                  new Date(nextDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                ) : (
                  <span className="text-muted-foreground font-normal italic">None scheduled</span>
                );
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Timeline Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Counselling & Activity History ({activities.length})
          </h4>
        </div>

        {isLoadingActivities ? (
          <div className="py-6 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-muted-foreground mt-1">Loading counselling history...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-xl">
            <p className="text-xs text-muted-foreground">No counselling interactions logged yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {activities.map((act) => {
              const isCompleted = act.status === 'completed';
              return (
                <div key={act.activity_id} className="relative group">
                  {/* Timeline bullet */}
                  <span
                    className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-background ${
                      isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />
                  <div className="bg-card border border-border rounded-xl p-3 shadow-sm space-y-1.5 hover:shadow transition-shadow">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase px-1.5 py-0"
                        >
                          {act.activity_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {new Date(act.activity_date || act.created_at || '').toLocaleDateString(
                            'en-GB',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          )}
                        </span>
                      </div>
                      <Badge
                        className={`text-[9px] uppercase font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {act.status}
                      </Badge>
                    </div>

                    {act.notes && (
                      <p className="text-xs text-foreground bg-muted/40 p-2 rounded-lg leading-relaxed whitespace-pre-wrap">
                        {act.notes}
                      </p>
                    )}

                    {act.next_followup_date && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold pt-0.5">
                        <Clock className="w-3 h-3" /> Next Follow-up:{' '}
                        {new Date(act.next_followup_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campus Visits Section */}
      {visits.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Campus Visits & Sessions ({visits.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visits.map((v) => (
              <div
                key={v.visit_id}
                className="p-3 border border-border rounded-xl bg-card space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold capitalize text-foreground">
                    {v.visit_type} Visit
                  </span>
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {v.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {new Date(v.scheduled_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {v.remarks && (
                  <p className="text-[11px] text-muted-foreground italic">{v.remarks}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {lead && (
        <CounsellorAssignmentModal
          open={isAssignmentModalOpen}
          onOpenChange={setIsAssignmentModalOpen}
          lead={lead}
          mode={lead.assigned_counsellor_id ? 'reassign' : 'assign'}
        />
      )}

      {/* Add Activity Modal */}
      {lead && (
        <AddActivityModal
          open={isActivityModalOpen}
          onOpenChange={setIsActivityModalOpen}
          leadId={lead.lead_id}
          leadNumber={lead.lead_number}
          studentName={lead.student_name}
        />
      )}

      {/* Schedule Visit Modal */}
      {lead && (
        <ScheduleVisitModal
          open={isVisitModalOpen}
          onOpenChange={setIsVisitModalOpen}
          leadId={lead.lead_id}
          studentName={lead.student_name}
        />
      )}
    </div>
  );
};
