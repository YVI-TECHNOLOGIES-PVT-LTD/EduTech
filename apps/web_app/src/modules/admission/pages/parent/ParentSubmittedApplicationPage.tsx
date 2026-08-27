import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  FileCheck,
  ShieldCheck,
  ArrowLeft,
  Printer,
  Calendar,
  Building2,
  Phone,
  Mail,
  History,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useApplication } from '../../hooks/useApplication';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatStatusLabel, getStatusColor } from '../../core/AdmissionStatusMapper';

interface ReadOnlyFieldProps {
  label: string;
  value?: string | number | null | boolean;
  mono?: boolean;
  capitalize?: boolean;
  className?: string;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({
  label,
  value,
  mono = false,
  capitalize = false,
  className = '',
}) => {
  let displayValue: string;

  if (value === null || value === undefined || value === '') {
    displayValue = 'Not provided';
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else {
    displayValue = String(value);
  }

  const isMissing = displayValue === 'Not provided';

  return (
    <div className={`space-y-1 ${className}`}>
      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
        {label}
      </span>
      <p
        className={`text-xs font-bold ${
          isMissing ? 'text-muted-foreground/60 italic font-medium' : 'text-foreground'
        } ${mono ? 'font-mono' : ''} ${capitalize ? 'capitalize' : ''}`}
      >
        {displayValue}
      </p>
    </div>
  );
};

export function ParentSubmittedApplicationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { application, isLoading, error, refetch } = useApplication(id);

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-16 text-center space-y-3">
          <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">
            Loading submitted application details...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error || !application) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Application Not Found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve the specified admission application. It may have been removed or
              you do not have permission to view it.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/app/admissions/my')}
              variant="outline"
              size="sm"
              className="font-bold text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to My Applications
            </Button>
            <Button onClick={() => refetch()} size="sm" className="font-bold text-xs">
              Retry
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const lead = application.lead || (application as any).leads;

  const studentName =
    application.student_name ||
    (lead
      ? `${lead.student_first_name || ''} ${lead.student_last_name || ''}`.trim()
      : 'Applicant');

  const appNumber =
    application.application_number ||
    application.applicationNumber ||
    (application.application_id
      ? `APP-${application.application_id.slice(0, 8).toUpperCase()}`
      : 'APP-2026');

  const appStatus = application.status || 'submitted';

  const submittedDate =
    application.application_date || application.submitted_at || application.created_at
      ? new Date(
          application.application_date || application.submitted_at || application.created_at,
        ).toLocaleDateString()
      : 'Recently';

  const dobFormatted = lead?.dob ? new Date(lead.dob).toLocaleDateString() : 'Not provided';

  const gradeApplied =
    application.grade_name ||
    application.grade_applied_for ||
    lead?.grade_name ||
    (lead as any)?.grade_applied_for ||
    'Not specified';

  const academicYearLabel =
    application.academic_year?.academic_year_name ||
    (application as any).academic_year_name ||
    'Academic Year 2025-26';

  const documents = Array.isArray(application.documents)
    ? application.documents
    : Array.isArray((application as any).admission_documents)
      ? (application as any).admission_documents
      : [];

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header with Actions */}
      <PageHeader
        title="Submitted Admission Application"
        description="Official read-only review of information submitted in your child's enrollment application."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Application Form (Read-Only)
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/admissions/my')}
              className="font-bold text-xs flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Applications</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="font-bold text-xs flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Application</span>
            </Button>
          </div>
        }
      />

      {/* Main Form Identity Overview Card */}
      <Card className="p-6 rounded-3xl border-border/80 bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-100 dark:border-indigo-800">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-base font-black text-foreground">{studentName}</h2>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200"
                >
                  {appNumber}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Grade Applied: <span className="font-bold text-foreground">{gradeApplied}</span> •{' '}
                {academicYearLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                Submission Date
              </span>
              <span className="text-xs font-bold text-foreground">{submittedDate}</span>
            </div>
            <span
              className={`px-3.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusColor(
                appStatus,
              )}`}
            >
              {formatStatusLabel(appStatus)}
            </span>
          </div>
        </div>

        {/* Read-Only Notice Banner */}
        <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-medium">
              This application has been formally submitted and is preserved as an immutable official
              record.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(`/app/admissions/status?appId=${application.application_id || id}`)
            }
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline h-7 px-2"
          >
            <span>Track Progress</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>

      {/* SECTION 1: Student Information */}
      <Card className="p-6 rounded-3xl border-border/80 bg-card shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            1. Student Information
          </h3>
          <span className="text-[10px] font-bold font-mono text-muted-foreground">
            WIZARD STEP 2
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-xs">
          <ReadOnlyField label="First Name" value={lead?.student_first_name} />
          <ReadOnlyField label="Last Name" value={lead?.student_last_name} />
          <ReadOnlyField label="Full Legal Name" value={studentName} />
          <ReadOnlyField label="Date of Birth" value={dobFormatted} />
          <ReadOnlyField label="Gender" value={lead?.gender} capitalize />
          <ReadOnlyField
            label="Nationality"
            value={
              application.nationality || (application as any).students?.nationality || 'Indian'
            }
          />
          <ReadOnlyField
            label="Curriculum Preference"
            value={lead?.curriculum_preference || 'CBSE'}
          />
          <ReadOnlyField label="Scholarship Interest" value={lead?.scholarship_interest} />
        </div>
      </Card>

      {/* SECTION 2: Parent / Guardian Information */}
      <Card className="p-6 rounded-3xl border-border/80 bg-card shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            2. Parent / Guardian Details
          </h3>
          <span className="text-[10px] font-bold font-mono text-muted-foreground">
            WIZARD STEP 3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <ReadOnlyField label="Primary Guardian Name" value={lead?.contact_name} />
          <ReadOnlyField
            label="Relationship to Student"
            value={lead?.contact_relationship}
            capitalize
          />
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Contact Phone Number
            </span>
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold font-mono text-foreground">
                {lead?.contact_phone || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Contact Email Address
            </span>
            <div className="flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground truncate" title={lead?.contact_email}>
                {lead?.contact_email || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 3: Academic Preferences & History */}
      <Card className="p-6 rounded-3xl border-border/80 bg-card shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            3. Academic Choice & Historical Background
          </h3>
          <span className="text-[10px] font-bold font-mono text-muted-foreground">
            WIZARD STEP 4
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
            <ReadOnlyField label="Applying For Grade" value={gradeApplied} />
            <ReadOnlyField label="Academic Year" value={academicYearLabel} />
            <ReadOnlyField label="Curriculum" value={lead?.curriculum_preference || 'CBSE'} />
          </div>

          <div className="border-t border-border/40 pt-4">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>Previous Academic Record</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              <ReadOnlyField
                label="Previous School Name"
                value={application.previous_school_name}
              />
              <ReadOnlyField
                label="Previous Board / Curriculum"
                value={application.previous_school_board}
              />
              <ReadOnlyField label="Previous Grade Completed" value={application.previous_grade} />
              <ReadOnlyField
                label="Previous Academic Year"
                value={application.previous_school_year}
              />
              <div className="sm:col-span-2 lg:col-span-4">
                <ReadOnlyField
                  label="Previous School Address"
                  value={application.previous_school_address}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 4: Documents Attached */}
      <Card className="p-6 rounded-3xl border-border/80 bg-card shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            4. Documents Submitted with Application
          </h3>
          <span className="text-[10px] font-bold font-mono text-muted-foreground">
            WIZARD STEP 5
          </span>
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No document attachments recorded during initial application submission.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc: any) => {
              const docName =
                doc.document_type_name ||
                doc.document_types?.document_name ||
                doc.original_file_name ||
                'Submitted Certificate';
              const fileName = doc.original_file_name || 'Attached file';
              const fileSizeStr = doc.file_size
                ? `${(Number(doc.file_size) / (1024 * 1024)).toFixed(2)} MB`
                : null;
              const verifyStatus = doc.verify_status || 'pending';

              return (
                <div
                  key={doc.document_id || doc.id}
                  className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-foreground truncate" title={docName}>
                        {docName}
                      </h4>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                          verifyStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : verifyStatus === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {verifyStatus}
                      </span>
                    </div>
                    <p
                      className="text-[11px] text-muted-foreground font-mono truncate"
                      title={fileName}
                    >
                      {fileName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-1.5">
                    <span>{fileSizeStr || 'Uploaded'}</span>
                    <span>
                      {doc.uploaded_at
                        ? new Date(doc.uploaded_at).toLocaleDateString()
                        : 'Submitted'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* SECTION 5: Submission & Declaration */}
      <Card className="p-6 rounded-3xl border-border/80 bg-indigo-950 text-white shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-indigo-200 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>5. Final Submission Declaration</span>
        </div>

        <div className="space-y-2 text-xs text-indigo-100">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All information provided was certified as true, accurate, and complete by the
              parent/guardian upon application submission.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              School terms and conditions regarding admission policy, code of conduct, and fee
              guidelines were accepted.
            </p>
          </div>
        </div>

        <div className="border-t border-indigo-900 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-indigo-300 font-mono">
          <span>Application Ref: {appNumber}</span>
          <span>Record ID: {application.application_id || id}</span>
        </div>
      </Card>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => navigate('/app/admissions/my')}
          className="font-bold text-xs flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Applications</span>
        </Button>

        <Button
          onClick={() =>
            navigate(`/app/admissions/status?appId=${application.application_id || id}`)
          }
          className="font-bold text-xs flex items-center space-x-1.5 shadow-md"
        >
          <span>View Admission Status</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </PageContainer>
  );
}

export default ParentSubmittedApplicationPage;
