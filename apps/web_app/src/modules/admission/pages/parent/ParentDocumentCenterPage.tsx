import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApplicationList } from '../../hooks/useApplication';
import ParentDashboardService from '@/modules/dashboard/services/ParentDashboardService';
import {
  useGetDocumentTypesQuery,
  useGetApplicationDocumentsQuery,
  useUploadAdmissionDocumentMutation,
  useDeleteAdmissionDocumentMutation,
  useLazyGetDocumentSignedUrlQuery,
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
import { DocumentUploadCard } from '../../components/DocumentUploadCard';
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
  Download,
  Building,
  User,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export interface UnifiedStudentCard {
  id: string;
  studentId: string | null;
  applicationId: string;
  studentName: string;
  admissionNo: string;
  gradeName: string;
  sectionName: string | null;
  academicYearName?: string | null;
  photoUrl: string | null;
  isEnrolled: boolean;
  totalRequired: number;
  submitted: number;
  pending: number;
  rejected: number;
  verified: number;
  completionStatus: CanonicalOverallDocumentStatus;
  documents: any[];
}

export function ParentDocumentCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const params = useParams<{ applicationId?: string; id?: string }>();
  const activeParamAppId = params.applicationId || params.id;

  // 1. Fetch parent overview containing registered students and in-progress applications
  const [parentOverview, setParentOverview] = useState<{
    children: any[];
    admissions: any[];
  } | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setIsOverviewLoading(true);
      const data = await ParentDashboardService.getOverview();
      setParentOverview(data);
    } catch (e) {
      console.warn('Failed to load parent overview, relying on application list fallback', e);
    } finally {
      setIsOverviewLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [user?.id, user?.school_id]);

  // 2. Fetch all applications belonging strictly to the authenticated parent as fallback/supplement
  const {
    applications = [],
    isLoading: isAppsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useApplicationList({ limit: 50 }, { mine: true });

  // 3. Document types catalogue
  const { data: docTypes = [], isLoading: isDocTypesLoading } = useGetDocumentTypesQuery();

  // 4. Construct unified student list (One Card Per Student)
  const studentCards = useMemo<UnifiedStudentCard[]>(() => {
    const list: UnifiedStudentCard[] = [];
    const seenAppIds = new Set<string>();
    const seenStudentIds = new Set<string>();

    // A. Enrolled children through authoritative parent relationship
    if (parentOverview?.children && Array.isArray(parentOverview.children)) {
      parentOverview.children.forEach((c: any) => {
        const studentId = c.student_id;
        const appId = c.application_id || studentId;
        if (studentId && seenStudentIds.has(studentId)) return;
        if (studentId) seenStudentIds.add(studentId);
        if (appId) seenAppIds.add(appId);

        const stats = c.document_stats || {};
        let compStatus: CanonicalOverallDocumentStatus = 'Not Started';
        if (stats.rejected > 0) compStatus = 'Action Needed';
        else if (stats.completion_status === 'Complete') compStatus = 'Accepted';
        else if (stats.pending > 0) compStatus = 'In Review';
        else if (stats.submitted > 0) compStatus = 'Action Needed';

        list.push({
          id: studentId || appId,
          studentId: studentId || null,
          applicationId: appId,
          studentName:
            c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Student',
          admissionNo: c.admission_no || 'ADM-PENDING',
          gradeName: c.grade_name || 'Enrolled Student',
          sectionName: c.section_name || null,
          academicYearName: c.academic_year_name || null,
          photoUrl: c.photo_url || null,
          isEnrolled: true,
          totalRequired: stats.total_required || 0,
          submitted: stats.submitted || c.documents?.length || 0,
          pending: stats.pending || 0,
          rejected: stats.rejected || 0,
          verified: stats.verified || 0,
          completionStatus: compStatus,
          documents: c.documents || [],
        });
      });
    }

    // B. In-progress admission applications belonging to the parent
    if (parentOverview?.admissions && Array.isArray(parentOverview.admissions)) {
      parentOverview.admissions.forEach((a: any) => {
        const appId = a.application_id || a.id;
        if (!appId || seenAppIds.has(appId)) return;
        seenAppIds.add(appId);

        const stats = a.document_stats || {};
        let compStatus: CanonicalOverallDocumentStatus = 'Not Started';
        if (stats.rejected > 0) compStatus = 'Action Needed';
        else if (stats.completion_status === 'Complete') compStatus = 'Accepted';
        else if (stats.pending > 0) compStatus = 'In Review';
        else if (stats.submitted > 0) compStatus = 'Action Needed';

        list.push({
          id: appId,
          studentId: null,
          applicationId: appId,
          studentName: a.student_name || 'Applicant',
          admissionNo: a.application_number || 'APP-2026',
          gradeName: a.grade_applied_for || 'Grade Applied',
          sectionName: null,
          academicYearName: a.academic_year_name || null,
          photoUrl: a.photo_url || null,
          isEnrolled: false,
          totalRequired: stats.total_required || 0,
          submitted: stats.submitted || a.documents?.length || 0,
          pending: stats.pending || 0,
          rejected: stats.rejected || 0,
          verified: stats.verified || 0,
          completionStatus: compStatus,
          documents: a.documents || [],
        });
      });
    }

    // C. Fallback: Applications from useApplicationList not already registered
    if (applications && Array.isArray(applications)) {
      applications.forEach((app: any) => {
        const appId = app.application_id || app.id;
        if (!appId || seenAppIds.has(appId)) return;
        seenAppIds.add(appId);

        const lead = app.lead || app.leads;
        const sName =
          app.student_name ||
          (lead
            ? `${lead.student_first_name || ''} ${lead.student_last_name || ''}`.trim()
            : 'Applicant');
        const gName =
          app.grade_applied_for ||
          app.grade_name ||
          lead?.grade_name ||
          lead?.academic_year_grades?.grades?.grade_name ||
          'Grade Applied';

        const stats = getApplicationDocumentStatus({
          documentTypes: docTypes,
          applicationDocuments: app.documents || app.admission_documents || [],
          applicationId: appId,
        });

        list.push({
          id: appId,
          studentId: null,
          applicationId: appId,
          studentName: sName,
          admissionNo: app.application_number || `APP-${appId.slice(0, 8).toUpperCase()}`,
          gradeName: gName,
          sectionName: null,
          academicYearName: app.academic_year?.name || app.academic_year_name || null,
          photoUrl: app.photo_url || null,
          isEnrolled: false,
          totalRequired: stats.requiredCount,
          submitted: stats.uploadedCount,
          pending: stats.pendingCount,
          rejected: stats.rejectedCount,
          verified: stats.verifiedCount,
          completionStatus: stats.overallStatus,
          documents: app.documents || app.admission_documents || [],
        });
      });
    }

    return list;
  }, [parentOverview, applications, docTypes]);

  // Selected student resolution (support both URL parameter and inline selection)
  const [selectedStudentStateId, setSelectedStudentStateId] = useState<string | null>(null);
  const activeSelectedId = activeParamAppId || selectedStudentStateId;

  const selectedStudent = useMemo(() => {
    if (!activeSelectedId || studentCards.length === 0) return null;
    return (
      studentCards.find(
        (s) =>
          s.id === activeSelectedId ||
          s.applicationId === activeSelectedId ||
          s.studentId === activeSelectedId ||
          s.admissionNo === activeSelectedId,
      ) || null
    );
  }, [studentCards, activeSelectedId]);

  const targetAppId = selectedStudent?.applicationId || activeParamAppId || '';

  // Fetch uploaded documents for the active detail application
  const {
    data: uploadedDocs = [],
    isLoading: isDocsLoading,
    refetch: refetchDocs,
  } = useGetApplicationDocumentsQuery(targetAppId, {
    skip: !targetAppId,
  });

  const [uploadDoc] = useUploadAdmissionDocumentMutation();
  const [deleteDoc] = useDeleteAdmissionDocumentMutation();
  const [getSignedUrl] = useLazyGetDocumentSignedUrlQuery();

  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDeleteDoc = async (documentId: string) => {
    if (!documentId) return;
    try {
      await deleteDoc({ documentId, applicationId: targetAppId }).unwrap();
      refetchDocs();
      refetchApps();
      fetchOverview();
    } catch (err: any) {
      console.error('Failed to remove document:', err);
      setActionError(err?.data?.message || err?.message || 'Failed to remove document.');
    }
  };

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
      fetchOverview();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setActionError(
        err?.data?.message || err?.message || 'Failed to upload document. Please try again.',
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
      console.error('Failed to get signed URL:', err);
    }
  };

  const handleDownloadDoc = async (documentId: string, docName?: string) => {
    if (!documentId) return;
    try {
      const res = await getSignedUrl(documentId).unwrap();
      if (res?.signed_url) {
        const link = document.createElement('a');
        link.href = res.signed_url;
        link.download = `${docName || 'document'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to download document:', err);
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
            Action Needed
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
          >
            Rejected
          </Badge>
        );
      case 'Accepted':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
          >
            Accepted
          </Badge>
        );
      case 'In Review':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
          >
            In Review
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
  if (isAppsLoading && isOverviewLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">
            Loading Student Document Records...
          </p>
        </div>
      </PageContainer>
    );
  }

  // Error State
  if (appsError && !parentOverview) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Failed to load student documents</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve student document profiles. Please try again.
            </p>
          </div>
          <Button
            onClick={() => {
              refetchApps();
              fetchOverview();
            }}
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

  // Zero Registered Students State
  if (studentCards.length === 0) {
    return (
      <PageContainer variant="default">
        <PageHeader
          title="Student Document Center"
          description="View verification clearance, audit remarks, and required certificates for your registered children."
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
            >
              Parent Self-Service
            </Badge>
          }
        />
        <EmptyState
          title="No Registered Students Found"
          description="No students or admission applications are currently registered under your parent account."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start New Admission Application
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // =========================================================================
  // VIEW MODE 1: DETAIL VIEW (When a student card is selected)
  // =========================================================================
  if (selectedStudent) {
    const effectiveAppDocs =
      uploadedDocs && uploadedDocs.length > 0 ? uploadedDocs : selectedStudent.documents || [];

    const detailStats = getApplicationDocumentStatus({
      documentTypes: docTypes,
      applicationDocuments: effectiveAppDocs,
      applicationId: targetAppId,
    });

    const handleBackToList = () => {
      setSelectedStudentStateId(null);
      if (activeParamAppId) {
        navigate('/app/admissions/documents');
      }
    };

    return (
      <PageContainer variant="default">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="text-xs font-bold text-muted-foreground hover:text-foreground -ml-2 h-8 px-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to All Students
          </Button>
        </div>

        {/* Student Identity Card */}
        <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Avatar size="lg" className="border border-border/80 shrink-0">
                <AvatarImage
                  src={selectedStudent.photoUrl || undefined}
                  alt={selectedStudent.studentName}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                  {getInitials(selectedStudent.studentName, 'S')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <h2 className="text-lg font-extrabold text-foreground">
                    {selectedStudent.studentName}
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold font-mono tracking-wider text-indigo-600 bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800"
                  >
                    {selectedStudent.isEnrolled
                      ? `ADM: ${selectedStudent.admissionNo}`
                      : selectedStudent.admissionNo}
                  </Badge>
                  {selectedStudent.isEnrolled && (
                    <Badge className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
                      Enrolled Student
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center space-x-1 font-semibold">
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>
                      {selectedStudent.gradeName}
                      {selectedStudent.sectionName
                        ? ` • Section ${selectedStudent.sectionName}`
                        : ''}
                    </span>
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

        {/* Verification Status & Required Certificates List */}
        <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
          <SectionHeader
            title={`${selectedStudent.studentName}'s Documents (${detailStats.uploadedCount} of ${detailStats.requiredCount} Uploaded)`}
            description="Manage required certificates, inspect school audit remarks, and upload document replacements."
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    refetchDocs();
                    refetchApps();
                    fetchOverview();
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  VERIFICATION DESK
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
                  <DocumentUploadCard
                    key={docItem.docTypeId}
                    id={docItem.docTypeId}
                    name={docItem.docTypeName}
                    mandatory={docItem.isMandatory}
                    hint={docItem.description}
                    uploadedDoc={uploadedInfo}
                    isUploading={uploadingDocId === docItem.docTypeId}
                    uploadProgress={uploadingDocId === docItem.docTypeId ? 85 : 0}
                    onFileUpload={(e) =>
                      handleFileUpload(docItem.docTypeId, e, docItem.docTypeName)
                    }
                    onUploadDoc={async (file) => {
                      const pseudoEvent = { target: { files: [file] } } as any;
                      await handleFileUpload(docItem.docTypeId, pseudoEvent, docItem.docTypeName);
                    }}
                    onViewDoc={
                      docItem.uploadedDocument
                        ? () => handleViewDoc(docItem.uploadedDocument!.document_id)
                        : undefined
                    }
                    onRemoveDoc={() => {
                      if (docItem.uploadedDocument?.document_id) {
                        handleDeleteDoc(docItem.uploadedDocument.document_id);
                      }
                    }}
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
  // VIEW MODE 2: STUDENT CARDS OVERVIEW (One card per registered student)
  // =========================================================================
  return (
    <PageContainer variant="default">
      {/* Page Header */}
      <PageHeader
        title="Student Document Center"
        description="Select a registered student to view their document completion status, submit pending certificates, and review school verification feedback."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Parent Self-Service
          </Badge>
        }
        actions={
          <Button
            onClick={() => navigate('/app/admissions/wizard')}
            className="font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Application
          </Button>
        }
      />

      {/* Student Cards Grid */}
      <div className="space-y-6">
        <SectionHeader
          title={`Registered Students (${studentCards.length})`}
          description="Click on any student to inspect, upload, and manage that student's documents."
          action={
            <button
              type="button"
              onClick={() => {
                refetchApps();
                fetchOverview();
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Status</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentCards.map((student) => {
            const progressPct =
              student.totalRequired > 0
                ? Math.min(100, Math.round((student.submitted / student.totalRequired) * 100))
                : 0;

            return (
              <Card
                key={student.id}
                onClick={() => setSelectedStudentStateId(student.id)}
                className="p-6 rounded-2xl border-border/80 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-5 bg-card flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-4">
                  {/* Card Header: Photo + Student Name + Admission No + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <Avatar
                        size="default"
                        className="border border-border/80 shrink-0 group-hover:ring-2 group-hover:ring-indigo-500/30 transition-all"
                      >
                        <AvatarImage
                          src={student.photoUrl || undefined}
                          alt={student.studentName}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {getInitials(student.studentName, 'S')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-extrabold text-foreground truncate group-hover:text-indigo-600 transition-colors">
                          {student.studentName}
                        </h3>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {student.isEnrolled
                              ? `ADM: ${student.admissionNo}`
                              : student.admissionNo}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">{renderStatusBadge(student.completionStatus)}</div>
                  </div>

                  <div className="border-t border-border/60" />

                  {/* Grade, Section & Academic Year */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                    <span className="flex items-center space-x-1 font-semibold">
                      <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>{student.gradeName}</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {student.academicYearName && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-muted/40 text-muted-foreground px-2 py-0.5 rounded border border-border/40">
                          <CalendarDays className="w-3 h-3 text-primary" />
                          {student.academicYearName}
                        </span>
                      )}
                      {student.sectionName && (
                        <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          Sec {student.sectionName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Completion Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground text-[11px]">
                        Documents Completion
                      </span>
                      <span className="text-foreground">
                        {student.submitted} / {student.totalRequired}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          student.completionStatus === 'Action Needed'
                            ? 'bg-purple-500'
                            : student.completionStatus === 'Rejected'
                              ? 'bg-rose-500'
                              : student.completionStatus === 'Accepted'
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground font-medium">
                    <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      <FolderCheck className="w-3 h-3" />
                      {student.submitted} Submitted
                    </span>
                    {student.verified > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {student.verified} Verified
                      </span>
                    )}
                    {student.pending > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3" />
                        {student.pending} Pending
                      </span>
                    )}
                    {student.rejected > 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                        <XCircle className="w-3 h-3" />
                        {student.rejected} Action Needed
                      </span>
                    )}
                    {student.submitted === 0 && (
                      <span className="text-[11px] text-slate-400 italic">No uploads yet</span>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-border/60">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudentStateId(student.id);
                    }}
                    className="w-full font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                  >
                    <FolderCheck className="w-3.5 h-3.5" />
                    <span>View Student Documents</span>
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
