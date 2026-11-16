import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useConvertApplicationToStudentMutation } from '@/shared/api/student.api';
import {
  useGetDecisionQuery,
  useGetApplicationAssessmentQuery,
  useGetApplicationFeeQuery,
} from '@/shared/api/admission.api';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
  GraduationCap,
  Calendar,
  Layers,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface SectionOption {
  section_id: string;
  section_name: string;
  capacity?: number | null;
  room_no?: string | null;
}

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  availableSections?: SectionOption[];
  onSuccess?: (result: any) => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  application,
  availableSections = [],
  onSuccess,
}) => {
  const appId = application?.application_id || application?.id || '';
  const [sectionId, setSectionId] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [convertApplication, { isLoading: isEnrolling }] = useConvertApplicationToStudentMutation();

  // Load authoritative backend states for prerequisites
  const { data: decisionData } = useGetDecisionQuery(appId, {
    skip: !isOpen || !appId,
  });
  const { data: assessmentData } = useGetApplicationAssessmentQuery(appId, {
    skip: !isOpen || !appId,
  });
  const { data: feeData } = useGetApplicationFeeQuery(appId, {
    skip: !isOpen || !appId,
  });

  const sectionsList: SectionOption[] =
    availableSections.length > 0
      ? availableSections
      : application?.available_sections || application?.leads?.academic_year_grades?.sections || [];

  useEffect(() => {
    if (isOpen) {
      setSectionId(sectionsList[0]?.section_id || '');
      setRollNumber('');
      setRemarks('Enrolled from approved application via Admission Desk');
      setErrorMsg(null);
    }
  }, [isOpen, sectionsList]);

  if (!application) return null;

  const candidateName =
    application.student_name ||
    [
      application.student_first_name || application.leads?.student_first_name,
      application.student_last_name || application.leads?.student_last_name,
    ]
      .filter(Boolean)
      .join(' ') ||
    'Applicant';

  const appNumber =
    application.application_number || application.applicationNumber || `APP-${appId.slice(0, 8)}`;
  const gradeName =
    application.grade_name ||
    application.grade_applied_for ||
    application.leads?.academic_year_grades?.grades?.grade_name ||
    'Grade N/A';
  const academicYear =
    application.academic_year_name || application.academic_years?.academic_year_name || '2026-2027';

  // Evaluate prerequisite gates
  const isDecisionApproved =
    decisionData?.decision_status === 'approved' ||
    application.is_decision_approved ||
    application.decision_status === 'approved' ||
    application.status === 'approved';

  const isFeePaid =
    feeData?.payment_status === 'paid' ||
    feeData?.payment_status === 'waived' ||
    application.is_fee_paid ||
    application.payment_status === 'paid' ||
    application.payment_status === 'waived';

  const isEligibleToEnroll = isDecisionApproved && isFeePaid;

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isDecisionApproved) {
      setErrorMsg('Cannot enroll: Application must have an approved admission decision.');
      return;
    }

    if (!isFeePaid) {
      setErrorMsg('Cannot enroll: Admission fee payment is required before enrollment.');
      return;
    }

    try {
      const response = await convertApplication({
        applicationId: appId,
        section_id: sectionId ? sectionId : undefined,
        roll_number: rollNumber.trim() ? rollNumber.trim() : undefined,
        remarks: remarks.trim() ? remarks.trim() : undefined,
      }).unwrap();

      if (response.success || response.student) {
        toast.success(
          response.is_existing
            ? `Candidate was already enrolled. Student ID: ${response.student?.admission_no || response.student?.student_id}`
            : `Candidate successfully enrolled! Admission No: ${response.student?.admission_no}`,
        );
        if (onSuccess) onSuccess(response);
        onClose();
      }
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Enrollment failed. Please check candidate eligibility.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card shadow-2xl p-0">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-indigo-50/50 via-background to-emerald-50/40 dark:from-indigo-950/20 dark:to-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Finalize Student Enrollment
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Convert approved applicant into official SIS student master &amp; class roster
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] bg-background">
              {appNumber}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleEnroll} className="p-6 space-y-6">
          {/* Candidate Profile Summary Card */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Candidate Name
                </span>
                <h4 className="text-base font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  {candidateName}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Grade &amp; Academic Year
                </span>
                <p className="text-xs font-bold text-foreground mt-0.5 flex items-center justify-end gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  {gradeName} ({academicYear})
                </p>
              </div>
            </div>

            {application.contact_name && (
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/50 flex justify-between">
                <span>
                  Parent/Guardian:{' '}
                  <strong className="text-foreground">{application.contact_name}</strong>
                </span>
                <span>
                  Contact:{' '}
                  <strong className="text-foreground">{application.contact_phone || '—'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Prerequisite Verification Gates */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Enrollment Prerequisite Verification Desk
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Gate 1: Decision */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDecisionApproved
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50/70 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Admission Decision</p>
                    <p className="text-[10px] opacity-80">
                      {isDecisionApproved ? 'Approved by Committee' : 'Pending / Not Approved'}
                    </p>
                  </div>
                </div>
                {isDecisionApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </div>

              {/* Gate 2: Fee Payment */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isFeePaid
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50/70 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Admission Fee</p>
                    <p className="text-[10px] opacity-80">
                      {isFeePaid ? 'Paid & Confirmed' : 'Payment Pending'}
                    </p>
                  </div>
                </div>
                {isFeePaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </div>
            </div>

            {!isEligibleToEnroll && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Enrollment is blocked because required prerequisites are incomplete. Please
                  approve the admission decision and ensure admission fee payment is confirmed
                  first.
                </p>
              </div>
            )}
          </div>

          {/* SIS Assignment Controls */}
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dynamic Section Selection */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="section-select"
                  className="text-xs font-bold text-foreground flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Academic Section
                </Label>
                {sectionsList.length > 0 ? (
                  <select
                    id="section-select"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Assign Later (Unassigned) --</option>
                    {sectionsList.map((sec) => (
                      <option key={sec.section_id} value={sec.section_id}>
                        Section {sec.section_name} {sec.room_no ? `(Room: ${sec.room_no})` : ''}{' '}
                        {sec.capacity ? `[Cap: ${sec.capacity}]` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                    No active sections found for this grade.
                  </p>
                )}
              </div>

              {/* Roll Number Input */}
              <div className="space-y-1.5">
                <Label htmlFor="roll-number" className="text-xs font-bold text-foreground">
                  Class Roll Number (Optional)
                </Label>
                <Input
                  id="roll-number"
                  placeholder="e.g. 01, 102, A-12"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label htmlFor="enrollment-remarks" className="text-xs font-bold text-foreground">
                Enrollment Desk Remarks
              </Label>
              <Textarea
                id="enrollment-remarks"
                placeholder="Enter administrative notes, orientation details, or special instructions..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t flex flex-row items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isEnrolling}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isEligibleToEnroll || isEnrolling}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Enrolling Candidate...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Complete Enrollment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
