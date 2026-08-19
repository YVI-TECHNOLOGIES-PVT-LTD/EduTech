import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  LeadItem,
  useGetLeadByIdQuery,
  useGetLeadActivitiesQuery,
  useGetLeadVisitsQuery,
  useUpdateLeadStatusMutation,
  useAssignLeadMutation,
  useDeleteLeadActivityMutation,
  useUpdateVisitStatusMutation,
  useDeleteVisitMutation,
  LeadStage,
} from '@/shared/api/crm.api';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { AddActivityModal } from './AddActivityModal';
import { ScheduleVisitModal } from './ScheduleVisitModal';
import { EditLeadModal } from './EditLeadModal';
import { DeleteLeadDialog } from './DeleteLeadDialog';
import { CreateApplicationDialog } from './CreateApplicationDialog';
import {
  User,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  MapPin,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Edit3,
  Trash2,
  UserCheck,
  Activity,
  Sparkles,
  Copy,
  Plus,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface LeadDetailsSheetProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
}

const STAGE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  enquiry_received: {
    label: 'Enquiry Received',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  qualified: {
    label: 'Qualified',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
  counselling_scheduled: {
    label: 'Counselling Scheduled',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  campus_visit: {
    label: 'Campus Visit',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  application_submitted: {
    label: 'Application Submitted',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  document_verification: {
    label: 'Doc Verification',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  assessment: {
    label: 'Assessment',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  admission_approved: {
    label: 'Approved',
    bg: 'bg-green-50 dark:bg-green-950/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  waitlisted: {
    label: 'Waitlisted',
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  fee_payment_pending: {
    label: 'Fee Pending',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  enrolled: {
    label: 'Enrolled',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  hot: { label: 'Hot Priority', color: 'bg-red-500 text-white', icon: '🔥' },
  warm: { label: 'Warm Priority', color: 'bg-amber-500 text-white', icon: '⚡' },
  cold: { label: 'Cold Priority', color: 'bg-slate-400 text-white', icon: '❄️' },
};

export const LeadDetailsSheet: React.FC<LeadDetailsSheetProps> = ({
  leadId,
  open,
  onOpenChange,
  onLeadUpdated,
}) => {
  const { data: lead, isLoading } = useGetLeadByIdQuery(leadId || '', {
    skip: !leadId || !open,
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useGetLeadActivitiesQuery(
    leadId || '',
    { skip: !leadId || !open },
  );

  const { data: visits = [], isLoading: isLoadingVisits } = useGetLeadVisitsQuery(leadId || '', {
    skip: !leadId || !open,
  });

  const { data: staffList = [] } = useGetStaffListQuery();

  const [updateLeadStatus, { isLoading: isUpdatingStatus }] = useUpdateLeadStatusMutation();
  const [assignLead, { isLoading: isAssigning }] = useAssignLeadMutation();
  const [deleteActivity] = useDeleteLeadActivityMutation();
  const [updateVisitStatus] = useUpdateVisitStatusMutation();
  const [deleteVisit] = useDeleteVisitMutation();

  // Child Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  // Assignment quick state
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [assignmentRemarks, setAssignmentRemarks] = useState<string>('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const handleStageChange = async (newStage: string) => {
    if (!lead) return;
    try {
      await updateLeadStatus({ id: lead.lead_id, stage: newStage }).unwrap();
      toast.success(`Stage updated to ${STAGE_CONFIG[newStage]?.label || newStage}`);
      onLeadUpdated?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to update stage';
      toast.error(msg);
    }
  };

  const handleAssignCounsellor = async () => {
    if (!lead || !selectedStaffId) return;
    try {
      await assignLead({
        id: lead.lead_id,
        assigned_counsellor_id: selectedStaffId,
        remarks: assignmentRemarks || undefined,
      }).unwrap();
      toast.success('Counsellor assigned successfully');
      setAssignmentRemarks('');
      onLeadUpdated?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to assign counsellor';
      toast.error(msg);
    }
  };

  const handleMarkVisitCompleted = async (visitId: string) => {
    if (!lead) return;
    try {
      await updateVisitStatus({
        visitId,
        leadId: lead.lead_id,
        status: 'completed',
        remarks: 'Visit completed successfully',
      }).unwrap();
      toast.success('Visit marked as completed');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to update visit');
    }
  };

  const handleDeleteActivityItem = async (activityId: string) => {
    if (!lead) return;
    try {
      await deleteActivity({ activityId, leadId: lead.lead_id }).unwrap();
      toast.success('Activity removed');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to delete activity');
    }
  };

  const handleDeleteVisitItem = async (visitId: string) => {
    if (!lead) return;
    try {
      await deleteVisit({ visitId, leadId: lead.lead_id }).unwrap();
      toast.success('Visit cancelled and removed');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to delete visit');
    }
  };

  if (!open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto bg-background flex flex-col">
          {isLoading || !lead ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-xs font-bold text-muted-foreground">Loading lead details...</p>
            </div>
          ) : (
            <>
              {/* Header Panel */}
              <div className="p-6 border-b border-border bg-card/60 backdrop-blur">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {lead.lead_number}
                      </span>
                      {lead.priority && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            PRIORITY_CONFIG[lead.priority]?.color || 'bg-slate-500 text-white'
                          }`}
                        >
                          {PRIORITY_CONFIG[lead.priority]?.icon}{' '}
                          {PRIORITY_CONFIG[lead.priority]?.label}
                        </span>
                      )}
                      {lead.ai_lead_score !== null && lead.ai_lead_score !== undefined && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Score: {lead.ai_lead_score}/100
                        </span>
                      )}
                    </div>
                    <SheetTitle className="text-2xl font-black text-foreground">
                      {lead.student_name}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                      Applying for{' '}
                      <span className="font-bold text-foreground">
                        {lead.grade_name || 'Standard Grade'}
                      </span>{' '}
                      • Added on {new Date(lead.enquiry_date).toLocaleDateString()}
                    </SheetDescription>
                  </div>

                  {/* Stage Selector */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Stage
                    </span>
                    <Select
                      value={lead.stage}
                      onValueChange={handleStageChange}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs font-bold bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key} className="text-xs font-medium">
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowActivityModal(true)}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    Log Activity
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowVisitModal(true)}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Schedule Visit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="text-xs font-bold gap-1.5 h-8"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    Edit
                  </Button>

                  {lead.stage !== 'application_submitted' && lead.stage !== 'enrolled' && (
                    <Button
                      size="sm"
                      onClick={() => setShowConvertDialog(true)}
                      className="text-xs font-black gap-1.5 h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Convert to Application
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 ml-auto h-8 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="flex-1 p-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full mb-6">
                    <TabsTrigger value="overview" className="text-xs font-bold">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="text-xs font-bold">
                      Activities ({activities.length})
                    </TabsTrigger>
                    <TabsTrigger value="visits" className="text-xs font-bold">
                      Visits ({visits.length})
                    </TabsTrigger>
                    <TabsTrigger value="counsellor" className="text-xs font-bold">
                      Assignment
                    </TabsTrigger>
                  </TabsList>

                  {/* 1. OVERVIEW TAB */}
                  <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                    {/* Primary Contact Card */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-indigo-600" />
                          Primary Guardian & Contact
                        </h4>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {lead.contact_relationship || 'Parent'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div>
                          <p className="text-xs text-muted-foreground">Guardian Name</p>
                          <p className="text-sm font-bold text-foreground">{lead.contact_name}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Phone Number</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${lead.contact_phone}`}
                              className="text-sm font-bold text-indigo-600 hover:underline"
                            >
                              {lead.contact_phone}
                            </a>
                            <button
                              onClick={() => copyToClipboard(lead.contact_phone, 'phone number')}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {lead.contact_email && (
                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">Email Address</p>
                            <div className="flex items-center gap-2">
                              <a
                                href={`mailto:${lead.contact_email}`}
                                className="text-sm font-bold text-indigo-600 hover:underline"
                              >
                                {lead.contact_email}
                              </a>
                              <button
                                onClick={() => copyToClipboard(lead.contact_email!, 'email address')}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Academic & Student Details */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        Student & Academic Profile
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                        <div>
                          <p className="text-xs text-muted-foreground">Grade Applied</p>
                          <p className="text-sm font-bold text-foreground">
                            {lead.grade_name || 'Class 1'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Academic Year</p>
                          <p className="text-sm font-bold text-foreground">
                            {lead.academic_year_name || '2026-2027'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Curriculum</p>
                          <p className="text-sm font-bold text-foreground">
                            {lead.curriculum_preference || 'Standard / CBSE'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-bold text-foreground">
                            {lead.dob ? new Date(lead.dob).toLocaleDateString() : 'Not provided'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="text-sm font-bold text-foreground capitalize">
                            {lead.gender || 'Not specified'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Scholarship Interest</p>
                          <p className="text-sm font-bold text-foreground">
                            {lead.scholarship_interest ? 'Yes (Interested)' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Source & Notes */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Inquiry Source</p>
                          <p className="text-sm font-bold text-foreground capitalize">
                            {lead.source?.replace('_', ' ')}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Assigned Counsellor</p>
                          <p className="text-sm font-bold text-foreground">
                            {lead.counselor?.name || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      {lead.remarks && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Remarks & Notes</p>
                          <p className="text-xs text-foreground bg-muted/50 p-3 rounded-lg leading-relaxed">
                            {lead.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* 2. ACTIVITIES TAB */}
                  <TabsContent value="activities" className="space-y-4 focus-visible:outline-none">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Activity Timeline
                      </h4>
                      <Button
                        size="sm"
                        onClick={() => setShowActivityModal(true)}
                        className="text-xs font-bold gap-1 h-7"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Log Activity
                      </Button>
                    </div>

                    {isLoadingActivities ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <p className="text-xs text-muted-foreground">Loading activities...</p>
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl">
                        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold text-foreground">No activities logged yet</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Log follow-up calls, emails, WhatsApp messages, or meeting notes.
                        </p>
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {activities.map((act) => (
                          <div
                            key={act.activity_id}
                            className="relative group p-3.5 rounded-xl border border-border bg-card hover:shadow-sm transition-all"
                          >
                            <div className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 border-background bg-indigo-600" />
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <span className="text-xs font-bold text-foreground capitalize">
                                  {act.activity_type.replace('_', ' ')}
                                </span>
                                <span className="text-[11px] text-muted-foreground ml-2">
                                  {new Date(act.activity_date).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] capitalize ${
                                    act.status === 'completed'
                                      ? 'text-green-600 border-green-300'
                                      : 'text-amber-600 border-amber-300'
                                  }`}
                                >
                                  {act.status}
                                </Badge>
                                <button
                                  onClick={() => handleDeleteActivityItem(act.activity_id)}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 p-1 transition-opacity"
                                  title="Delete Activity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {act.notes && (
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                {act.notes}
                              </p>
                            )}

                            {act.next_followup_date && (
                              <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Next Follow-up: {new Date(act.next_followup_date).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* 3. VISITS TAB */}
                  <TabsContent value="visits" className="space-y-4 focus-visible:outline-none">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Campus Visits & Counselling Sessions
                      </h4>
                      <Button
                        size="sm"
                        onClick={() => setShowVisitModal(true)}
                        className="text-xs font-bold gap-1 h-7"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Schedule Visit
                      </Button>
                    </div>

                    {isLoadingVisits ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        <p className="text-xs text-muted-foreground">Loading visits...</p>
                      </div>
                    ) : visits.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl">
                        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold text-foreground">No visits scheduled yet</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Schedule a physical campus tour or online counselling session with parent.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visits.map((v) => (
                          <div
                            key={v.visit_id}
                            className="p-4 rounded-xl border border-border bg-card space-y-2 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                                  {v.visit_type === 'virtual' ? (
                                    <Video className="w-4 h-4" />
                                  ) : (
                                    <MapPin className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-foreground">
                                    {v.visit_type === 'virtual'
                                      ? 'Virtual Counselling Session'
                                      : 'Campus Tour & In-person Visit'}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {new Date(v.scheduled_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] capitalize ${
                                    v.status === 'completed'
                                      ? 'text-green-600 border-green-300'
                                      : v.status === 'cancelled'
                                        ? 'text-red-600 border-red-300'
                                        : 'text-purple-600 border-purple-300'
                                  }`}
                                >
                                  {v.status}
                                </Badge>

                                {v.status === 'scheduled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkVisitCompleted(v.visit_id)}
                                    className="text-[10px] font-bold h-6 px-2 text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Done
                                  </Button>
                                )}

                                <button
                                  onClick={() => handleDeleteVisitItem(v.visit_id)}
                                  className="text-muted-foreground hover:text-red-600 p-1"
                                  title="Delete Visit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {v.meeting_link && (
                              <div className="pt-1">
                                <a
                                  href={v.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Join Meeting: {v.meeting_link}
                                </a>
                              </div>
                            )}

                            {v.remarks && (
                              <p className="text-xs text-muted-foreground pt-1">{v.remarks}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* 4. COUNSELLOR ASSIGNMENT TAB */}
                  <TabsContent value="counsellor" className="space-y-4 focus-visible:outline-none">
                    <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Counsellor Assignment & Ownership
                      </h4>

                      <div className="p-3.5 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground">Currently Assigned To</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {lead.counselor?.name ? (
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              {lead.counselor.name} ({lead.counselor.email || 'Staff'})
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">No counsellor currently assigned</span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Label className="text-xs font-bold">Reassign to Staff Member</Label>
                        <Select
                          value={selectedStaffId}
                          onValueChange={setSelectedStaffId}
                        >
                          <SelectTrigger className="text-xs font-medium">
                            <SelectValue placeholder="Select staff member..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.firstName} {s.lastName} ({s.department || s.designation || s.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Textarea
                          placeholder="Assignment notes / handover instructions..."
                          rows={2}
                          value={assignmentRemarks}
                          onChange={(e) => setAssignmentRemarks(e.target.value)}
                        />

                        <Button
                          size="sm"
                          onClick={handleAssignCounsellor}
                          disabled={!selectedStaffId || isAssigning}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black"
                        >
                          {isAssigning && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                          Update Counsellor Assignment
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Child Modals */}
      {lead && (
        <>
          <EditLeadModal
            lead={lead}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onSuccess={() => onLeadUpdated?.()}
          />
          <AddActivityModal
            leadId={lead.lead_id}
            leadNumber={lead.lead_number}
            studentName={lead.student_name}
            open={showActivityModal}
            onOpenChange={setShowActivityModal}
            onSuccess={() => onLeadUpdated?.()}
          />
          <ScheduleVisitModal
            leadId={lead.lead_id}
            leadNumber={lead.lead_number}
            studentName={lead.student_name}
            open={showVisitModal}
            onOpenChange={setShowVisitModal}
            onSuccess={() => onLeadUpdated?.()}
          />
          <DeleteLeadDialog
            lead={lead}
            open={showDeleteDialog}
            onOpenChange={(open) => {
              setShowDeleteDialog(open);
              if (!open) onOpenChange(false);
            }}
            onSuccess={() => {
              onOpenChange(false);
              onLeadUpdated?.();
            }}
          />
          <CreateApplicationDialog
            lead={lead}
            open={showConvertDialog}
            onOpenChange={setShowConvertDialog}
            onSuccess={() => onLeadUpdated?.()}
          />
        </>
      )}
    </>
  );
};
