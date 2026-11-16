import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Award,
  CreditCard,
  GraduationCap,
  Users,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RecordDecisionModal } from '../components/application/RecordDecisionModal';
import { EnrollmentModal } from '../components/enrollment/EnrollmentModal';
import { useGetApprovedApplicationsQuery } from '@/shared/api/student.api';
import { useGetApplicationsQuery } from '@/shared/api/admission.api';
import { toast } from 'sonner';

export function AdmissionDecisionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlStatus = searchParams.get('status')?.toUpperCase() || 'ALL';

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus);

  // Sync with searchParams
  useEffect(() => {
    const status = searchParams.get('status')?.toUpperCase() || 'ALL';
    if (status !== statusFilter) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  // Modal Selection States
  const [selectedAppForDecision, setSelectedAppForDecision] = useState<any | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const [selectedAppForEnrollment, setSelectedAppForEnrollment] = useState<any | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  // Queries
  const {
    data: approvedApps = [],
    isLoading: isApprovedLoading,
    refetch: refetchApproved,
  } = useGetApprovedApplicationsQuery({ search: searchTerm });

  const {
    data: allAppsResponse,
    isLoading: isAllAppsLoading,
    refetch: refetchAllApps,
  } = useGetApplicationsQuery({ limit: 50 });

  const allApps: any[] = (allAppsResponse as any)?.data || allAppsResponse || [];
  const isLoading = isApprovedLoading && isAllAppsLoading;

  // Merge & Deduplicate Applications
  const candidateList = React.useMemo(() => {
    const map = new Map<string, any>();

    // 1. First index approved / enrollment records
    approvedApps.forEach((app) => {
      map.set(app.application_id, {
        ...app,
        id: app.application_id,
        applicationId: app.application_id,
        applicationNumber: app.application_number,
        studentName: app.student_name,
        grade: app.grade_name,
        academicYear: app.academic_year_name || '2026-2027',
        decisionStatus: app.decision_status || (app.is_decision_approved ? 'approved' : 'pending'),
        paymentStatus: app.payment_status || (app.is_fee_paid ? 'paid' : 'pending'),
        isEnrolled: app.is_enrolled,
        admissionNo: app.student?.admission_no,
      });
    });

    // 2. Supplement with general application list if not present
    allApps.forEach((app) => {
      const appId = app.application_id || app.id;
      if (!map.has(appId)) {
        const studentName =
          app.student_name ||
          (app.leads
            ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
            : 'Applicant');
        const decisionStatus =
          app.admission_decisions?.decision_status ||
          (app.status === 'approved'
            ? 'approved'
            : app.status === 'waitlisted'
              ? 'waitlisted'
              : app.status === 'rejected'
                ? 'rejected'
                : 'pending');
        const paymentStatus =
          app.admission_fee_payments?.payment_status || app.payment_status || 'pending';
        const isEnrolled = app.status === 'enrolled' || !!app.students;

        map.set(appId, {
          ...app,
          application_id: appId,
          id: appId,
          applicationId: appId,
          applicationNumber: app.application_number || app.applicationNumber || 'APP-2026',
          studentName,
          grade: app.grade_applied_for || app.grade_name || 'Grade 1',
          academicYear: app.academic_years?.year_name || '2026-2027',
          decisionStatus,
          paymentStatus,
          isEnrolled,
          admissionNo: app.students?.admission_no,
          decision_date: app.admission_decisions?.decision_date,
          scholarship_percentage: app.admission_decisions?.scholarship_percentage,
          offer_expiry_date: app.admission_decisions?.offer_expiry_date,
          waitlist_position: app.admission_decisions?.waitlist_position,
          is_decision_approved: decisionStatus === 'approved' || isEnrolled,
          is_fee_paid: paymentStatus === 'paid' || paymentStatus === 'waived' || isEnrolled,
        });
      }
    });

    return Array.from(map.values());
  }, [approvedApps, allApps]);

  // Filtered list
  const filteredCandidates = React.useMemo(() => {
    return candidateList.filter((item) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        item.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.grade?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'PENDING') {
        matchesStatus = item.decisionStatus === 'pending' && !item.isEnrolled;
      } else if (statusFilter === 'APPROVED') {
        matchesStatus = item.decisionStatus === 'approved' && !item.isEnrolled;
      } else if (statusFilter === 'WAITLISTED') {
        matchesStatus = item.decisionStatus === 'waitlisted';
      } else if (statusFilter === 'REJECTED') {
        matchesStatus = item.decisionStatus === 'rejected';
      } else if (statusFilter === 'ENROLLED') {
        matchesStatus = item.isEnrolled;
      }

      return matchesSearch && matchesStatus;
    });
  }, [candidateList, searchTerm, statusFilter]);

  // KPI Metrics
  const metrics = React.useMemo(() => {
    const total = candidateList.length;
    const approved = candidateList.filter(
      (c) => c.decisionStatus === 'approved' && !c.isEnrolled,
    ).length;
    const waitlisted = candidateList.filter((c) => c.decisionStatus === 'waitlisted').length;
    const rejected = candidateList.filter((c) => c.decisionStatus === 'rejected').length;
    const enrolled = candidateList.filter((c) => c.isEnrolled).length;
    const pending = candidateList.filter(
      (c) => c.decisionStatus === 'pending' && !c.isEnrolled,
    ).length;

    return { total, approved, waitlisted, rejected, enrolled, pending };
  }, [candidateList]);

  const handleOpenDecision = (candidate: any) => {
    setSelectedAppForDecision(candidate);
    setIsDecisionModalOpen(true);
  };

  const handleOpenEnrollment = (candidate: any) => {
    setSelectedAppForEnrollment(candidate);
    setIsEnrollmentModalOpen(true);
  };

  const refreshAll = () => {
    refetchApproved();
    refetchAllApps();
  };

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Admission Decisions & Seat Offer Desk"
        description="Review evaluated assessment candidates, record committee decisions, issue scholarship offers, and proceed to SIS student enrollment."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Phase 3 Lifecycle Desk
          </Badge>
        }
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              className="text-xs font-bold gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </Button>
          </div>
        }
      />

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-4 rounded-2xl bg-card border-border/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Candidates
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-foreground">{metrics.total}</span>
            <Users className="w-4 h-4 text-muted-foreground/60" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Pending Decision
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300">
              {metrics.pending}
            </span>
            <Scale className="w-4 h-4 text-indigo-500" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Seats Approved
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300">
              {metrics.approved}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Waitlisted
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-300">
              {metrics.waitlisted}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            SIS Enrolled
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-300">
              {metrics.enrolled}
            </span>
            <GraduationCap className="w-4 h-4 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Main Candidate Decision & Enrollment Queue Card */}
      <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-5">
        {/* Controls: Search & Status Filter Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search candidate name, application number, grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Candidates' },
              { id: 'PENDING', label: 'Pending Decision' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'WAITLISTED', label: 'Waitlisted' },
              { id: 'REJECTED', label: 'Rejected' },
              { id: 'ENROLLED', label: 'Enrolled SIS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Queue Table */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Loading decision queue...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <EmptyState
            title="No Candidates Found in This Filter"
            description="No applications match the selected status or search term."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Candidate &amp; Application</th>
                  <th className="py-3 px-4">Grade &amp; Year</th>
                  <th className="py-3 px-4">Decision Status</th>
                  <th className="py-3 px-4">Fee Status</th>
                  <th className="py-3 px-4">Offer / Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCandidates.map((candidate) => {
                  const isApproved =
                    candidate.decisionStatus === 'approved' || candidate.isEnrolled;
                  const isWaitlisted = candidate.decisionStatus === 'waitlisted';
                  const isRejected = candidate.decisionStatus === 'rejected';
                  const isFeePaid = candidate.is_fee_paid;
                  const canEnroll = isApproved && isFeePaid && !candidate.isEnrolled;

                  return (
                    <tr key={candidate.id} className="hover:bg-muted/30 transition-colors group">
                      {/* Candidate Name & Ref */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            {candidate.studentName}
                            {candidate.isEnrolled && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[9px] uppercase tracking-wider border border-emerald-300">
                                Enrolled
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-muted-foreground text-[11px]">
                            {candidate.applicationNumber}
                          </p>
                        </div>
                      </td>

                      {/* Grade & Year */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{candidate.grade}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {candidate.academicYear}
                          </p>
                        </div>
                      </td>

                      {/* Decision Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : isWaitlisted
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : isRejected
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {candidate.decisionStatus || 'Pending'}
                        </span>
                      </td>

                      {/* Fee Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isFeePaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {isFeePaid ? 'Paid / Waived' : 'Payment Pending'}
                        </span>
                      </td>

                      {/* Decision Details (Scholarship / Expiry / Roll No) */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          {candidate.isEnrolled ? (
                            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              ADM: {candidate.admissionNo || 'ADM-2026-ENR'}
                            </p>
                          ) : candidate.scholarship_percentage ? (
                            <p className="font-bold text-indigo-600">
                              Scholarship: {candidate.scholarship_percentage}%
                            </p>
                          ) : isWaitlisted && candidate.waitlist_position ? (
                            <p className="font-bold text-amber-600">
                              Waitlist: #{candidate.waitlist_position}
                            </p>
                          ) : candidate.decision_date ? (
                            <p className="text-muted-foreground">
                              Date: {new Date(candidate.decision_date).toLocaleDateString()}
                            </p>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Primary Decision / Enrollment CTA */}
                          {canEnroll ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenEnrollment(candidate)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shadow-xs h-8 px-2.5"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>Enroll Student</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant={
                                candidate.decisionStatus === 'pending' ? 'default' : 'outline'
                              }
                              onClick={() => handleOpenDecision(candidate)}
                              className={`text-xs font-bold gap-1 h-8 px-2.5 ${
                                candidate.decisionStatus === 'pending'
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                  : 'text-foreground'
                              }`}
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>
                                {candidate.decisionStatus === 'pending'
                                  ? 'Record Decision'
                                  : 'Review Decision'}
                              </span>
                            </Button>
                          )}

                          {/* Applicant 360 Deep Link */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/app/admissions/${candidate.application_id}`)}
                            title="Open Applicant 360 Profile"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Decision Modal */}
      {selectedAppForDecision && (
        <RecordDecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => {
            setIsDecisionModalOpen(false);
            setSelectedAppForDecision(null);
          }}
          application={selectedAppForDecision}
          initialDecision={selectedAppForDecision}
          onSuccess={async () => {
            toast.success('Decision recorded successfully');
            refreshAll();
          }}
        />
      )}

      {/* Final Enrollment Modal */}
      {selectedAppForEnrollment && (
        <EnrollmentModal
          isOpen={isEnrollmentModalOpen}
          onClose={() => {
            setIsEnrollmentModalOpen(false);
            setSelectedAppForEnrollment(null);
          }}
          application={selectedAppForEnrollment}
          onSuccess={async () => {
            refreshAll();
          }}
        />
      )}
    </PageContainer>
  );
}

export default AdmissionDecisionPage;
