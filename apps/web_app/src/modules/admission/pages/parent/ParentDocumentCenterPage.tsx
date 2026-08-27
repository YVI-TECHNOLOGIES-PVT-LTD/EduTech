import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApplicationList } from '../../hooks/useApplication';
import {
  useGetDocumentTypesQuery,
  useGetApplicationDocumentsQuery,
  useUploadAdmissionDocumentMutation,
  useLazyGetDocumentSignedUrlQuery,
  type ApplicationRecord,
} from '@/shared/api/admission.api';
import {
  getApplicationDocumentStatus,
  formatFileSize,
  type CanonicalOverallDocumentStatus,
} from '../../utils/documentStatus';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DocumentVerificationCard } from '../../components/DocumentVerificationCard';
import {
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  FolderCheck,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export function ParentDocumentCenterPage() {
  const navigate = useNavigate();
  const params = useParams<{ applicationId?: string; id?: string }>();
  const activeParamAppId = params.applicationId || params.id;

  // 1. Fetch all applications belonging strictly to the authenticated parent
  const {
    applications = [],
    isLoading: isAppsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useApplicationList({ limit: 50 }, { mine: true });

  // Resolve selected application if on detail view
  const selectedApp = useMemo(() => {
    if (!activeParamAppId || applications.length === 0) return null;
    return (
      applications.find(
        (app) =>
          app.application_id === activeParamAppId ||
          app.id === activeParamAppId ||
          app.application_number === activeParamAppId,
      ) || null
    );
  }, [applications, activeParamAppId]);

  const targetAppId = selectedApp?.application_id || selectedApp?.id || activeParamAppId || '';

  // 2. Fetch document types catalogue
  const { data: docTypes = [], isLoading: isDocTypesLoading } = useGetDocumentTypesQuery(
    targetAppId ? { application_id: targetAppId } : undefined,
  );

  // 3. Fetch uploaded documents for the active detail application
  const {
    data: uploadedDocs = [],
    isLoading: isDocsLoading,
    refetch: refetchDocs,
  } = useGetApplicationDocumentsQuery(targetAppId, {
    skip: !targetAppId,
  });

  const [uploadDoc] = useUploadAdmissionDocumentMutation();
  const [getSignedUrl] = useLazyGetDocumentSignedUrlQuery();

  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleFileUpload = async (
    docTypeId: string,
    e: React.ChangeEvent<HTMLInputElement>,
    docTypeName?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !targetAppId) return;

    setActionError(null);

    if (file.size > 10 * 1024 * 1024) {
      setActionError('File size exceeds maximum allowed limit of 10MB.');
      return;
    }

    setUploadingDocId(docTypeId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docTypeId)) {
        formData.append('document_type_id', docTypeId);
      }
      if (docTypeName) {
        formData.append('document_type', docTypeName);
        formData.append('document_code', docTypeName);
      }
      formData.append('application_id', targetAppId);

      await uploadDoc({ applicationId: targetAppId, formData }).unwrap();
      refetchDocs();
      refetchApps();
    } catch (err: any) {
      console.error('Failed to resubmit document:', err);
      setActionError(
        err?.data?.message || err?.message || 'Failed to resubmit document. Please try again.',
      );
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleViewDoc = async (documentId: string) => {
    if (!documentId) return;
    try {
      const res = await getSignedUrl(documentId).unwrap();
      if (res?.signed_url) {
        window.open(res.signed_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to get signed download URL:', err);
    }
  };

  const renderStatusBadge = (overallStatus: CanonicalOverallDocumentStatus) => {
    switch (overallStatus) {
      case 'Action Needed':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
          >
            Action Needed ⚠
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
          >
            Rejected ✕
          </Badge>
        );
      case 'Accepted':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
          >
            Accepted ✓
          </Badge>
        );
      case 'In Review':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
          >
            In Review ⏳
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800"
          >
            Not Started
          </Badge>
        );
    }
  };

  // Loading State
  if (isAppsLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">
            Loading Document Status Center...
          </p>
        </div>
      </PageContainer>
    );
  }

  // Error State
  if (appsError) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Failed to load applications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve your admission applications. Please try again.
            </p>
          </div>
          <Button
            onClick={() => refetchApps()}
            variant="outline"
            size="sm"
            className="font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Zero Applications State
  if (applications.length === 0) {
    return (
      <PageContainer variant="default">
        <PageHeader
          title="Document Status Center"
          description="View verification clearance, audit remarks, and document approval status for your children."
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
            >
              Admission Self-Service
            </Badge>
          }
        />
        <EmptyState
          title="No Admission Applications Found"
          description="You need a registered admission application to view document verification status."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start New Application
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // =========================================================================
  // VIEW MODE 1: DETAIL VIEW (/app/admissions/documents/:applicationId)
  // =========================================================================
  if (activeParamAppId) {
    if (!selectedApp) {
      return (
        <PageContainer variant="default">
          <div className="p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Application Not Found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                The requested application ID is invalid or does not belong to your account.
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/admissions/documents')}
              variant="outline"
              size="sm"
              className="font-bold text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Document Center
            </Button>
          </div>
        </PageContainer>
      );
    }

    const studentName =
      selectedApp.student_name ||
      (selectedApp.leads
        ? `${selectedApp.leads.student_first_name || ''} ${selectedApp.leads.student_last_name || ''}`.trim()
        : selectedApp.lead
          ? `${selectedApp.lead.student_first_name || ''} ${selectedApp.lead.student_last_name || ''}`.trim()
          : 'Applicant');

    const appNumber =
      selectedApp.application_number ||
      selectedApp.applicationNumber ||
      `APP-${targetAppId.slice(0, 8).toUpperCase()}`;

    const gradeApplied =
      selectedApp.grade_applied_for ||
      selectedApp.grade_name ||
      (selectedApp.lead as any)?.grade_applied_for ||
      selectedApp.leads?.academic_year_grades?.grades?.grade_name ||
      'Grade Applied';

    const effectiveAppDocs =
      uploadedDocs && uploadedDocs.length > 0
        ? uploadedDocs
        : selectedApp?.documents || (selectedApp as any)?.admission_documents || [];

    // Canonical Status Calculation for Detail View
    const detailStats = getApplicationDocumentStatus({
      documentTypes: docTypes,
      applicationDocuments: effectiveAppDocs,
      applicationId: targetAppId,
    });

    return (
      <PageContainer variant="default">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/admissions/documents')}
            className="text-xs font-bold text-muted-foreground hover:text-foreground -ml-2 h-8 px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Document Center
          </Button>
        </div>

        {/* Application Header Card */}
        <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Avatar size="lg" className="border border-border/80 shrink-0">
                <AvatarImage
                  src={
                    (selectedApp as any).photo_url ||
                    (selectedApp as any).student_photo_url ||
                    (selectedApp.lead as any)?.photo_url
                  }
                  alt={studentName}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                  {getInitials(studentName, 'A')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <h2 className="text-lg font-extrabold text-foreground">{studentName}</h2>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold font-mono tracking-wider text-indigo-600 bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800"
                  >
                    {appNumber}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center space-x-1 font-semibold">
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>Grade: {gradeApplied}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              <div className="flex items-center space-x-1 text-xs font-bold text-muted-foreground">
                <span>Documents:</span>
                <span className="text-foreground font-extrabold">
                  {detailStats.uploadedCount} / {detailStats.requiredCount}
                </span>
              </div>
              {renderStatusBadge(detailStats.overallStatus)}
            </div>
          </div>
        </Card>

        {actionError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Verification Status & Required Certificates Grid */}
        <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
          <SectionHeader
            title={`Required Verification Certificates (${detailStats.uploadedCount} of ${detailStats.requiredCount} Uploaded)`}
            description="View verification clearance, audit remarks, and replacement requests from the school admission desk."
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    refetchDocs();
                    refetchApps();
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  STATUS CENTER
                </span>
              </div>
            }
          />

          {isDocsLoading || isDocTypesLoading ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">
                Updating certificates list...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {detailStats.documents.map((docItem) => {
                const uploadedInfo = docItem.uploadedDocument
                  ? {
                      file_name: docItem.fileName || `${docItem.docTypeName}.pdf`,
                      file_size: formatFileSize(docItem.fileSize),
                      status: docItem.status,
                      reason: docItem.verificationRemarks || undefined,
                      uploaded_at: docItem.uploadedAt,
                    }
                  : undefined;

                return (
                  <DocumentVerificationCard
                    key={docItem.docTypeId}
                    docKey={docItem.docTypeId}
                    name={docItem.docTypeName}
                    mandatory={docItem.isMandatory}
                    hint={docItem.description}
                    uploaded={uploadedInfo}
                    isUploading={uploadingDocId === docItem.docTypeId}
                    onUpload={(e) => handleFileUpload(docItem.docTypeId, e, docItem.docTypeName)}
                    onView={
                      docItem.uploadedDocument
                        ? () => handleViewDoc(docItem.uploadedDocument!.document_id)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </Card>
      </PageContainer>
    );
  }

  // =========================================================================
  // VIEW MODE 2: OVERVIEW CARDS LIST (/app/admissions/documents)
  // =========================================================================
  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Document Status Center"
        description="Track verification progress, review school audit feedback, and manage required certificates for your children."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Admission Self-Service
          </Badge>
        }
        actions={
          <Button
            onClick={() => navigate('/app/admissions/wizard')}
            className="font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Start New Application
          </Button>
        }
      />

      {/* Applications Cards Section */}
      <div className="space-y-6">
        <SectionHeader
          title={`Registered Applications (${applications.length})`}
          description="Select an application to view verification clearance and document status."
          action={
            <button
              type="button"
              onClick={() => refetchApps()}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Status</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app: ApplicationRecord) => {
            const appId = app.application_id || app.id;
            const studentName =
              app.student_name ||
              (app.leads
                ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                : app.lead
                  ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
                  : 'Applicant');

            const appNumber =
              app.application_number ||
              app.applicationNumber ||
              (appId ? `APP-${appId.slice(0, 8).toUpperCase()}` : 'APP-2026');

            const gradeApplied =
              app.grade_applied_for ||
              app.grade_name ||
              (app.lead as any)?.grade_applied_for ||
              app.leads?.academic_year_grades?.grades?.grade_name ||
              'Grade Applied';

            const submittedDate =
              app.application_date || app.submitted_at || app.created_at
                ? new Date(
                    app.application_date || app.submitted_at || app.created_at,
                  ).toLocaleDateString()
                : 'Recently';

            const appDocs =
              app.documents && app.documents.length > 0
                ? app.documents
                : (app as any).admission_documents || [];

            // Canonical Status Calculation for Application Card
            const stats = getApplicationDocumentStatus({
              documentTypes: docTypes,
              applicationDocuments: appDocs,
              applicationId: appId,
            });

            const progressPct =
              stats.requiredCount > 0
                ? Math.min(100, Math.round((stats.uploadedCount / stats.requiredCount) * 100))
                : 0;

            return (
              <Card
                key={appId}
                className="p-6 rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow space-y-5 bg-card flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <Avatar size="default" className="border border-border/80 shrink-0">
                        <AvatarImage
                          src={
                            (app as any).photo_url ||
                            (app as any).student_photo_url ||
                            (app.lead as any)?.photo_url
                          }
                          alt={studentName}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {getInitials(studentName, 'A')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-extrabold text-foreground truncate">
                          {studentName}
                        </h3>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {appNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">{renderStatusBadge(stats.overallStatus)}</div>
                  </div>

                  <div className="border-t border-border/60" />

                  {/* Context Info */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                    <span className="flex items-center space-x-1 font-semibold">
                      <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>{gradeApplied}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-[11px]">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>{submittedDate}</span>
                    </span>
                  </div>

                  {/* Document Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground text-[11px]">Documents</span>
                      <span className="text-foreground">
                        {stats.uploadedCount} / {stats.requiredCount}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          stats.overallStatus === 'Action Needed'
                            ? 'bg-purple-500'
                            : stats.overallStatus === 'Rejected'
                              ? 'bg-rose-500'
                              : stats.overallStatus === 'Accepted'
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Verification Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground font-medium">
                    {stats.resubmissionCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                        <RotateCcw className="w-3 h-3" />
                        {stats.resubmissionCount} Action Needed
                      </span>
                    )}
                    {stats.verifiedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {stats.verifiedCount} Accepted
                      </span>
                    )}
                    {stats.pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3" />
                        {stats.pendingCount} In Review
                      </span>
                    )}
                    {stats.rejectedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                        <XCircle className="w-3 h-3" />
                        {stats.rejectedCount} Rejected
                      </span>
                    )}
                    {stats.notUploadedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/40 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                        {stats.notUploadedCount} Not Uploaded
                      </span>
                    )}
                    {stats.uploadedCount === 0 && (
                      <span className="text-[11px] text-slate-400 italic">No uploads yet</span>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-border/60">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/app/admissions/documents/${appId}`)}
                    className="w-full font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <FolderCheck className="w-3.5 h-3.5" />
                    <span>View Documents</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}

export default ParentDocumentCenterPage;
