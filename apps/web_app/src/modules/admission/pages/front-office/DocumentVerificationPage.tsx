import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  AlertCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DocumentStatusBadge } from '../../components/document/DocumentStatusBadge';
import {
  DocumentPreviewDialog,
  DocumentPreviewItem,
} from '../../components/document/DocumentPreviewDialog';
import { VerifyDocumentDialog } from '../../components/document/VerifyDocumentDialog';
import { RejectDocumentDialog } from '../../components/document/RejectDocumentDialog';
import { RequestResubmissionDialog } from '../../components/document/RequestResubmissionDialog';
import {
  useGetApplicationsQuery,
  useGetDocumentTypesQuery,
  DocumentTypeDto,
} from '@/shared/api/admission.api';
import { useGetAcademicYearsQuery, useGetGradesQuery } from '@/shared/api/academic.api';
import { useTableSelection } from '@/hooks/useTableSelection';

export const DocumentVerificationPage: React.FC = () => {
  // Filter States
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Document Viewer & Quick Action Dialog States
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [quickVerifyDoc, setQuickVerifyDoc] = useState<DocumentPreviewItem | null>(null);
  const [quickRejectDoc, setQuickRejectDoc] = useState<DocumentPreviewItem | null>(null);
  const [quickResubmitDoc, setQuickResubmitDoc] = useState<DocumentPreviewItem | null>(null);

  // Queries
  const {
    data: applicationsData,
    isLoading: isAppsLoading,
    isFetching: isAppsFetching,
    error: appsError,
    refetch: refetchApps,
  } = useGetApplicationsQuery({
    page: 1,
    pageSize: 100, // Fetch up to 100 applications for full document queue extraction
    grade_id: gradeFilter === 'all' ? undefined : gradeFilter,
    academic_year_id: academicYearFilter === 'all' ? undefined : academicYearFilter,
  });

  const { data: documentTypes = [], isLoading: isDocTypesLoading } = useGetDocumentTypesQuery();
  const { data: grades = [] } = useGetGradesQuery();
  const { data: academicYears = [] } = useGetAcademicYearsQuery();

  // Document Type Lookup Map
  const docTypeMap = useMemo(() => {
    const map = new Map<string, DocumentTypeDto>();
    documentTypes.forEach((dt) => map.set(dt.document_type_id, dt));
    return map;
  }, [documentTypes]);

  // Extract and flatten all documents from applications
  const allQueueDocuments = useMemo(() => {
    const apps = applicationsData?.data || [];
    const list: DocumentPreviewItem[] = [];

    apps.forEach((app) => {
      const docs = app.documents || [];
      const studentName =
        app.student_name ||
        (app.lead
          ? `${app.lead.student_first_name} ${app.lead.student_last_name || ''}`.trim()
          : 'Unnamed Applicant');
      const gradeName = app.grade_name || app.lead?.grade_name || '—';
      const academicYearName = app.academic_year?.academic_year_name || '—';

      docs.forEach((doc) => {
        const docTypeDef = docTypeMap.get(doc.document_type_id);
        const docName =
          doc.document_type_name ||
          doc.document_types?.document_name ||
          docTypeDef?.document_name ||
          'Admission Document';

        list.push({
          document_id: doc.document_id,
          application_id: app.application_id || app.id,
          application_number: app.application_number || 'APP-PENDING',
          student_name: studentName,
          lead_number: app.lead?.lead_number || null,
          grade_name: gradeName,
          academic_year_name: academicYearName,
          document_name: docName,
          original_file_name: doc.original_file_name,
          mime_type: doc.mime_type,
          file_size: doc.file_size,
          verify_status: doc.verify_status || 'pending',
          verification_remarks: doc.verification_remarks,
          uploaded_at: doc.uploaded_at,
          verified_by: doc.verified_by,
          verified_at: doc.verified_at,
          is_mandatory: docTypeDef?.is_mandatory ?? doc.document_types?.is_mandatory ?? false,
        });
      });
    });

    return list;
  }, [applicationsData, docTypeMap]);

  // Filter queue documents
  const filteredDocuments = useMemo(() => {
    return allQueueDocuments.filter((doc) => {
      // Status Filter
      if (statusFilter !== 'all' && doc.verify_status !== statusFilter) {
        return false;
      }
      // Document Type Filter
      if (docTypeFilter !== 'all') {
        const matchingDocType = docTypeMap.get(docTypeFilter);
        if (matchingDocType && doc.document_name !== matchingDocType.document_name) {
          return false;
        }
      }
      // Text Search
      if (searchText.trim() !== '') {
        const q = searchText.toLowerCase().trim();
        const matchesAppNum = doc.application_number?.toLowerCase().includes(q) || false;
        const matchesStudent = doc.student_name?.toLowerCase().includes(q) || false;
        const matchesDocName = doc.document_name?.toLowerCase().includes(q) || false;
        const matchesFileName = doc.original_file_name?.toLowerCase().includes(q) || false;
        const matchesLead = doc.lead_number?.toLowerCase().includes(q) || false;

        if (
          !matchesAppNum &&
          !matchesStudent &&
          !matchesDocName &&
          !matchesFileName &&
          !matchesLead
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allQueueDocuments, statusFilter, docTypeFilter, docTypeMap, searchText]);

  // Real-time KPI Calculation
  const kpis = useMemo(() => {
    let total = allQueueDocuments.length;
    let pending = 0;
    let verified = 0;
    let actionRequired = 0;

    allQueueDocuments.forEach((doc) => {
      const st = (doc.verify_status || 'pending').toLowerCase();
      if (st === 'verified') verified++;
      else if (st === 'pending') pending++;
      else if (st === 'rejected' || st === 'resubmission_requested') actionRequired++;
    });

    return { total, pending, verified, actionRequired };
  }, [allQueueDocuments]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, page, pageSize]);

  // Table Row Selection
  const {
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    toggleRow,
    isSelected,
    selectedCount,
    clearSelection,
  } = useTableSelection({
    data: paginatedDocuments,
    getId: (doc: DocumentPreviewItem) => doc.document_id,
  });

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDocTypeFilter('all');
    setGradeFilter('all');
    setAcademicYearFilter('all');
    setPage(1);
    clearSelection();
  };

  const handleOpenPreview = (doc: DocumentPreviewItem) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Document Verification
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review, verify, and resolve applicant documents across the admission pipeline.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchApps()}
            disabled={isAppsFetching}
            className="h-10 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAppsFetching ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Cards (Consistent min-h-[92px] matching Phase 1 & Phase 2 Standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="min-h-[92px] p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Documents
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {isAppsLoading ? '—' : kpis.total}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </Card>

        <Card className="min-h-[92px] p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-100 font-mono">
              {isAppsLoading ? '—' : kpis.pending}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="min-h-[92px] p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Verified Documents
            </span>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
              {isAppsLoading ? '—' : kpis.verified}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="min-h-[92px] p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Action / Resubmit
            </span>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-100 font-mono">
              {isAppsLoading ? '—' : kpis.actionRequired}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <RotateCcw className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter Toolbar (Uniform h-10 Controls Matching Leads/Applications Standard) */}
      <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search Input (Flexible Width) */}
          <div className="relative sm:col-span-2 md:col-span-1 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search applicant, app #, file..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter || 'all'}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Verification Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verification Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="resubmission_requested">Resubmission Required</SelectItem>
            </SelectContent>
          </Select>

          {/* Document Type Filter */}
          <Select
            value={docTypeFilter || 'all'}
            onValueChange={(val) => {
              setDocTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Document Types</SelectItem>
              {documentTypes.map((dt) => (
                <SelectItem key={dt.document_type_id} value={dt.document_type_id}>
                  {dt.document_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Grade Filter */}
          <Select
            value={gradeFilter || 'all'}
            onValueChange={(val) => {
              setGradeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Academic Year + Reset Action */}
          <div className="flex items-center gap-2">
            <Select
              value={academicYearFilter || 'all'}
              onValueChange={(val) => {
                setAcademicYearFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 text-xs flex-1">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Years</SelectItem>
                {academicYears.map((ay) => (
                  <SelectItem key={ay.id} value={ay.id}>
                    {ay.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 text-xs text-slate-500 hover:text-slate-900 font-semibold px-3 shrink-0"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Selected Count Indicator */}
        {selectedCount > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {selectedCount} document{selectedCount > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7 text-[11px] text-slate-500"
            >
              Clear selection
            </Button>
          </div>
        )}
      </Card>

      {/* Verification Queue Enterprise Data Table (Full Grid Lines, Fixed S.NO/Checkbox, Predictable Widths) */}
      <Card className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className="w-full min-w-[1240px] border-collapse">
            <TableHeader className="bg-card sticky top-0 z-10 border-b border-border">
              <TableRow className="hover:bg-transparent">
                {/* Column 1: Checkbox (Fixed 48px, Centered) */}
                <TableHead className="w-12 min-w-[48px] max-w-[48px] text-center p-0 border-r border-border">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all documents in queue"
                    />
                  </div>
                </TableHead>

                {/* Column 2: S.NO (Fixed 56px, Centered) */}
                <TableHead className="w-14 min-w-[56px] max-w-[56px] text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest py-3.5 border-r border-slate-200 dark:border-slate-800 px-1">
                  S.NO
                </TableHead>

                {/* Column 3: Application Number (Fixed 150px) */}
                <TableHead className="w-40 min-w-[150px] text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                  Application #
                </TableHead>

                {/* Column 4: Applicant & Grade (Wider 210px) */}
                <TableHead className="min-w-[210px] text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                  Applicant & Grade
                </TableHead>

                {/* Column 5: Document File (190px) */}
                <TableHead className="min-w-[190px] text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                  Original File
                </TableHead>

                {/* Column 6: Document Type (160px) */}
                <TableHead className="w-44 min-w-[160px] text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                  Requirement Type
                </TableHead>

                {/* Column 7: Uploaded Date (120px) */}
                <TableHead className="w-32 min-w-[120px] text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                  Uploaded At
                </TableHead>

                {/* Column 8: Status (150px) */}
                <TableHead className="w-40 min-w-[150px] text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                  Status
                </TableHead>

                {/* Column 9: Verified Details (160px) */}
                <TableHead className="min-w-[160px] text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                  Verified Details
                </TableHead>

                {/* Column 10: Actions (Fixed 140px, Right Aligned) */}
                <TableHead className="w-36 min-w-[140px] text-right text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest py-3.5 px-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isAppsLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow
                    key={`skeleton-${idx}`}
                    className="border-b border-slate-200/80 dark:border-slate-800/80"
                  >
                    <TableCell colSpan={10} className="py-4 px-4 text-center">
                      <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : appsError ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-rose-500 font-semibold text-xs"
                  >
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-80" />
                    Failed to load document verification queue. Please refresh.
                  </TableCell>
                </TableRow>
              ) : paginatedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        No documents in queue
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {allQueueDocuments.length > 0
                          ? 'No documents matched the current filters. Try resetting the filters.'
                          : 'No applicant documents currently uploaded in the system.'}
                      </p>
                      {allQueueDocuments.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="h-8 text-xs font-semibold mt-2"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocuments.map((doc, index) => {
                  const rowSelected = isSelected(doc.document_id);
                  const isVerified = doc.verify_status === 'verified';

                  return (
                    <TableRow
                      key={doc.document_id}
                      data-state={rowSelected ? 'selected' : undefined}
                      onClick={() => handleOpenPreview(doc)}
                      className={`cursor-pointer transition-colors border-b border-border ${
                        rowSelected
                          ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
                      }`}
                    >
                      {/* Column 1: Checkbox */}
                      <TableCell
                        className="w-12 min-w-[48px] max-w-[48px] text-center p-0 border-r border-slate-200/80 dark:border-slate-800/80 align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={rowSelected}
                            onCheckedChange={() => toggleRow(doc.document_id)}
                            aria-label={`Select document ${doc.document_name} for ${doc.student_name}`}
                          />
                        </div>
                      </TableCell>

                      {/* Column 2: S.NO */}
                      <TableCell className="w-14 min-w-[56px] max-w-[56px] text-center font-mono text-xs font-semibold text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-1 align-middle">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>

                      {/* Column 3: Application # */}
                      <TableCell className="w-40 min-w-[150px] font-mono text-xs font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-3.5 align-middle">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800">
                          {doc.application_number}
                        </span>
                      </TableCell>

                      {/* Column 4: Applicant & Grade */}
                      <TableCell className="min-w-[210px] border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-3.5 text-xs align-middle">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[190px]">
                          {doc.student_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[190px]">
                          {doc.grade_name} • {doc.academic_year_name}
                        </div>
                      </TableCell>

                      {/* Column 5: Document File */}
                      <TableCell className="min-w-[190px] border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-3.5 text-xs align-middle">
                        <div
                          className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                          title={doc.original_file_name || doc.document_name}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px] font-mono text-[11px]">
                            {doc.original_file_name || doc.document_name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 6: Requirement Type */}
                      <TableCell className="w-44 min-w-[160px] border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-3.5 text-xs align-middle">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {doc.document_name}
                        </div>
                        <div className="mt-0.5">
                          {doc.is_mandatory ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Column 7: Uploaded Date */}
                      <TableCell className="w-32 min-w-[120px] border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-3.5 text-xs text-slate-600 dark:text-slate-300 align-middle">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}
                      </TableCell>

                      {/* Column 8: Status */}
                      <TableCell className="w-40 min-w-[150px] border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-3.5 align-middle">
                        <DocumentStatusBadge status={doc.verify_status} />
                      </TableCell>

                      {/* Column 9: Verified Details */}
                      <TableCell className="min-w-[160px] border-r border-slate-200/80 dark:border-slate-800/80 py-3.5 px-3.5 text-xs text-slate-500 align-middle">
                        {doc.verified_at ? (
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                              {new Date(doc.verified_at).toLocaleDateString()}
                            </span>
                            {doc.verification_remarks && (
                              <span
                                className="text-[10px] text-slate-400 italic truncate block max-w-[140px]"
                                title={doc.verification_remarks}
                              >
                                {doc.verification_remarks}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Column 10: Actions */}
                      <TableCell
                        className="w-36 min-w-[140px] py-3.5 px-4 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPreview(doc)}
                            className="h-8 px-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 gap-1 shadow-2xs"
                            title="Inspect and Review in Document Viewer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Button>

                          {!isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuickVerifyDoc(doc)}
                              className="h-8 px-2 text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50 shadow-2xs"
                              title="Quick Verify"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredDocuments.length > 0 && (
          <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filteredDocuments.length)} of {filteredDocuments.length}{' '}
              documents
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-2.5 text-xs font-semibold gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-2.5 text-xs font-semibold gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Production Document Preview Viewer Modal */}
      <DocumentPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        document={previewDoc}
        onVerificationSuccess={() => {
          refetchApps();
        }}
      />

      {/* Quick Action Dialogs */}
      <VerifyDocumentDialog
        open={!!quickVerifyDoc}
        onOpenChange={(open) => !open && setQuickVerifyDoc(null)}
        document={quickVerifyDoc}
        onSuccess={() => refetchApps()}
      />

      <RejectDocumentDialog
        open={!!quickRejectDoc}
        onOpenChange={(open) => !open && setQuickRejectDoc(null)}
        document={quickRejectDoc}
        onSuccess={() => refetchApps()}
      />

      <RequestResubmissionDialog
        open={!!quickResubmitDoc}
        onOpenChange={(open) => !open && setQuickResubmitDoc(null)}
        document={quickResubmitDoc}
        onSuccess={() => refetchApps()}
      />
    </div>
  );
};

export default DocumentVerificationPage;
