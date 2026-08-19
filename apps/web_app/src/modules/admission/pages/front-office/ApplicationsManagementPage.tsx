import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  RotateCcw,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit3,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Clock,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Receipt,
  Printer,
  Banknote,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';
import {
  useGetApplicationsQuery,
  ApplicationItem,
} from '@/shared/api/admission.api';
import { useGetGradesQuery, useGetAcademicYearsQuery } from '@/shared/api/academic.api';
import { ApplicationStatusBadge } from '../../components/application/ApplicationStatusBadge';
import { ApplicationDetailsSheet } from '../../components/application/ApplicationDetailsSheet';
import { UpdateApplicationStatusModal } from '../../components/application/UpdateApplicationStatusModal';
import { EditApplicationModal } from '../../components/application/EditApplicationModal';
import { WithdrawApplicationDialog } from '../../components/application/WithdrawApplicationDialog';
import { PaymentStatusBadge } from '../../components/fee/PaymentStatusBadge';
import { CollectAdmissionFeeDialog } from '../../components/fee/CollectAdmissionFeeDialog';
import { AdmissionFeeReceiptDialog } from '../../components/fee/AdmissionFeeReceiptDialog';

export const ApplicationsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL Search Params for state preservation
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const searchText = searchParams.get('searchText') || '';
  const statusFilter = searchParams.get('status') || 'ALL';
  const gradeFilter = searchParams.get('grade_id') || 'ALL';
  const academicYearFilter = searchParams.get('academic_year_id') || 'ALL';
  const sort = searchParams.get('sort') || 'created_at';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

  // Search input local state for debounced/enter typing
  const [searchInput, setSearchInput] = useState(searchText);

  // Modal / Sheet states
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<ApplicationItem | null>(null);
  const [selectedAppForStatus, setSelectedAppForStatus] = useState<ApplicationItem | null>(null);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<ApplicationItem | null>(null);
  const [selectedAppForWithdraw, setSelectedAppForWithdraw] = useState<ApplicationItem | null>(null);
  const [selectedAppForPayment, setSelectedAppForPayment] = useState<ApplicationItem | null>(null);
  const [selectedAppForReceipt, setSelectedAppForReceipt] = useState<ApplicationItem | null>(null);

  // Queries
  const { data: gradesData = [] } = useGetGradesQuery();
  const { data: academicYearsData = [] } = useGetAcademicYearsQuery();

  const queryParams = useMemo(() => {
    return {
      page,
      pageSize,
      searchText: searchText.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      grade_id: gradeFilter !== 'ALL' ? gradeFilter : undefined,
      academic_year_id: academicYearFilter !== 'ALL' ? academicYearFilter : undefined,
      sort,
      order,
    };
  }, [page, pageSize, searchText, statusFilter, gradeFilter, academicYearFilter, sort, order]);

  const {
    data: applicationsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetApplicationsQuery(queryParams);

  const applicationsList = applicationsResponse?.data || [];
  const meta = applicationsResponse?.meta || {
    total: applicationsList.length,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Row selection hook
  const {
    selectedIds,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    toggleRow,
    isSelected,
    clearSelection,
  } = useTableSelection({
    data: applicationsList,
    getId: (app) => app.application_id || app.id || '',
  });

  // Helper for updating query params
  const updateQueryParam = (updates: Record<string, string | number | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === 'ALL' || v === '') {
        newParams.delete(k);
      } else {
        newParams.set(k, String(v));
      }
    });
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParam({ searchText: searchInput, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  // Calculate high-level KPIs from list / summary
  const kpiStats = useMemo(() => {
    const total = meta.total || applicationsList.length;
    const underReview = applicationsList.filter((a) => a.status === 'under_review').length;
    const actionRequired = applicationsList.filter((a) =>
      ['documents_pending', 'assessment_pending'].includes(a.status),
    ).length;
    const approved = applicationsList.filter((a) => a.status === 'approved').length;

    return { total, underReview, actionRequired, approved };
  }, [applicationsList, meta.total]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Front Office Applications
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Review applicant files, track admission pipeline progress, and manage application statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/admissions/verification')}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Document Verification
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/admissions/inquiries')}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <Users className="w-4 h-4 text-slate-500" />
            View Enquiries & Leads
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/admissions/inquiries?action=new')}
            className="h-10 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Lead / Application
          </Button>
        </div>
      </div>

      {/* KPI Cards (min-h-[92px] uniform height matching Phase 1 Leads) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="min-h-[92px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Total Applications</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {kpiStats.total}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="min-h-[92px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Under Review</span>
            <div className="text-2xl font-black text-purple-600 font-mono">
              {kpiStats.underReview}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="min-h-[92px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Action Required</span>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {kpiStats.actionRequired}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="min-h-[92px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Approved & Ready</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {kpiStats.approved}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Uniform h-10 Controls) */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student, application #, lead #, guardian, phone..."
              className="pl-9 h-10 text-xs w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={statusFilter || 'ALL'}
              onValueChange={(val) => updateQueryParam({ status: val, page: 1 })}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Stages</SelectItem>
                <SelectItem value="submitted" className="text-xs">Submitted</SelectItem>
                <SelectItem value="documents_pending" className="text-xs">Documents Pending</SelectItem>
                <SelectItem value="assessment_pending" className="text-xs">Assessment Pending</SelectItem>
                <SelectItem value="under_review" className="text-xs">Under Review</SelectItem>
                <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                <SelectItem value="waitlisted" className="text-xs">Waitlisted</SelectItem>
                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                <SelectItem value="withdrawn" className="text-xs">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grade Filter (Sends exact grade_id UUID) */}
          <div className="w-full lg:w-44">
            <Select
              value={gradeFilter || 'ALL'}
              onValueChange={(val) => updateQueryParam({ grade_id: val, page: 1 })}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Grades</SelectItem>
                {gradesData.map((g: any) => (
                  <SelectItem key={g.grade_id || g.id} value={g.grade_id || g.id} className="text-xs">
                    {g.grade_name || g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Academic Year Filter */}
          <div className="w-full lg:w-44">
            <Select
              value={academicYearFilter || 'ALL'}
              onValueChange={(val) => updateQueryParam({ academic_year_id: val, page: 1 })}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Academic Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Academic Years</SelectItem>
                {academicYearsData.map((ay: any) => (
                  <SelectItem
                    key={ay.academic_year_id || ay.id}
                    value={ay.academic_year_id || ay.id}
                    className="text-xs"
                  >
                    {ay.academic_year_name || ay.name || ay.year_label || 'Academic Year'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="h-10 px-3 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </form>
      </div>

      {/* Applications Table Container (Horizontal Scroll with min-w-[1250px] and Full Grid Borders) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[1250px] border-collapse">
            <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
              <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                {/* 1. Selection Checkbox Column */}
                <TableHead className="w-[44px] min-w-[44px] max-w-[44px] text-center p-0 border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      disabled={applicationsList.length === 0}
                      aria-label="Select all applications"
                    />
                  </div>
                </TableHead>

                {/* 2. S.NO Column */}
                <TableHead className="w-[55px] min-w-[55px] max-w-[55px] text-center text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-1">
                  S.NO
                </TableHead>

                {/* 3. Application # */}
                <TableHead className="w-[140px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Application #
                </TableHead>

                {/* 4. Applicant & Guardian */}
                <TableHead className="min-w-[220px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Applicant & Guardian
                </TableHead>

                {/* 5. Grade */}
                <TableHead className="w-[100px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Grade
                </TableHead>

                {/* 6. Academic Year */}
                <TableHead className="w-[120px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Academic Year
                </TableHead>

                {/* 7. App Date */}
                <TableHead className="w-[110px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  App Date
                </TableHead>

                {/* 8. Status */}
                <TableHead className="w-[150px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Status
                </TableHead>

                {/* 9. Docs */}
                <TableHead className="w-[110px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Docs
                </TableHead>

                {/* 10. Assessment */}
                <TableHead className="w-[120px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Assessment
                </TableHead>

                {/* 11. Payment */}
                <TableHead className="w-[110px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                  Payment
                </TableHead>

                {/* 12. Actions */}
                <TableHead className="w-[70px] text-center text-xs font-bold text-slate-600 dark:text-slate-300 px-2">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading applications...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-6 h-6" />
                      <span className="font-semibold">Failed to load applications</span>
                      <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 text-xs mt-1">
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : applicationsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        No applications found
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Try adjusting search filters or convert enquiries to create new applications.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                applicationsList.map((app, index) => {
                  const appId = app.application_id || app.id || '';
                  const rowSelected = isSelected(appId);
                  const serialNumber = (page - 1) * pageSize + index + 1;
                  const lead = app.lead;
                  const sName =
                    app.student_name ||
                    lead?.student_name ||
                    [lead?.student_first_name, lead?.student_last_name].filter(Boolean).join(' ') ||
                    'Applicant';
                  const gName = app.grade_name || lead?.grade_name || '—';
                  const ayName = app.academic_year?.academic_year_name || '—';
                  const dateStr = new Date(app.application_date || app.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  // Docs summary chip
                  const docs = app.documents || [];
                  const docsVerifiedCount = docs.filter((d) => d.verify_status === 'verified').length;
                  const totalDocs = docs.length;

                  // Assessment result chip
                  const assessment = app.assessment;
                  const payment = app.payment;

                  return (
                    <TableRow
                      key={appId}
                      data-state={rowSelected ? 'selected' : undefined}
                      className={`border-b border-slate-200/80 dark:border-slate-800/80 transition-colors ${
                        rowSelected
                          ? 'bg-blue-50/60 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* 1. Selection Checkbox */}
                      <TableCell
                        className="text-center p-0 border-r border-slate-200/80 dark:border-slate-800/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={rowSelected}
                            onCheckedChange={() => toggleRow(appId)}
                            aria-label={`Select application ${app.application_number}`}
                          />
                        </div>
                      </TableCell>

                      {/* 2. S.NO */}
                      <TableCell className="text-center font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80 px-1 py-3">
                        {serialNumber}
                      </TableCell>

                      {/* 3. Application # */}
                      <TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        <button
                          onClick={() => setSelectedAppForDetails(app)}
                          className="hover:underline text-left"
                        >
                          {app.application_number}
                        </button>
                      </TableCell>

                      {/* 4. Applicant & Guardian */}
                      <TableCell className="border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {sName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {sName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                              <span>{lead?.contact_name || 'Guardian'}</span>
                              {lead?.lead_number && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-slate-500">
                                    {lead.lead_number}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 5. Grade */}
                      <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        {gName}
                      </TableCell>

                      {/* 6. Academic Year */}
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        {ayName}
                      </TableCell>

                      {/* 7. Application Date */}
                      <TableCell className="text-xs text-slate-500 font-medium border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        {dateStr}
                      </TableCell>

                      {/* 8. Pipeline Status */}
                      <TableCell className="border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        <ApplicationStatusBadge status={app.status} />
                      </TableCell>

                      {/* 9. Documents Summary */}
                      <TableCell className="border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        {totalDocs > 0 ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              docsVerifiedCount === totalDocs
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {docsVerifiedCount}/{totalDocs} Verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            0 Docs
                          </span>
                        )}
                      </TableCell>

                      {/* 10. Assessment */}
                      <TableCell className="border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                        {assessment ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              assessment.result === 'pass' || assessment.result === 'recommended'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {assessment.percentage ? `${assessment.percentage}% ` : ''}
                            {assessment.result || 'Done'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">—</span>
                        )}
                      </TableCell>

                      {/* 11. Payment */}
                      <TableCell className="border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3 text-center">
                        <PaymentStatusBadge status={payment?.payment_status || 'pending'} />
                      </TableCell>

                      {/* 12. Row Action Dropdown */}
                      <TableCell className="text-center px-2 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem
                              onClick={() => setSelectedAppForDetails(app)}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              View Full Details
                            </DropdownMenuItem>

                            {payment?.payment_status === 'paid' ? (
                              <DropdownMenuItem
                                onClick={() => setSelectedAppForReceipt(app)}
                                className="gap-2 cursor-pointer text-emerald-700 dark:text-emerald-300"
                              >
                                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                View Fee Receipt
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setSelectedAppForPayment(app)}
                                className="gap-2 cursor-pointer text-emerald-700 dark:text-emerald-300 font-semibold"
                              >
                                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                Collect Admission Fee
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => setSelectedAppForStatus(app)}
                              className="gap-2 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                              Update Status
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setSelectedAppForEdit(app)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              Edit Application
                            </DropdownMenuItem>

                            {lead?.lead_number && (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/app/admissions/inquiries?searchText=${lead.lead_number}`)
                                }
                                className="gap-2 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                                View Lead (#{lead.lead_number})
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setSelectedAppForWithdraw(app)}
                              className="gap-2 cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Withdraw Application
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server-side Pagination Footer */}
        <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong>{applicationsList.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong>–
            <strong>{Math.min(page * pageSize, meta.total)}</strong> of{' '}
            <strong>{meta.total}</strong> applications
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => updateQueryParam({ pageSize: parseInt(val, 10), page: 1 })}
              >
                <SelectTrigger className="h-8 w-18 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                  <SelectItem value="20" className="text-xs">20</SelectItem>
                  <SelectItem value="50" className="text-xs">50</SelectItem>
                  <SelectItem value="100" className="text-xs">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <span>
                Page <strong>{page}</strong> of <strong>{meta.totalPages || 1}</strong>
              </span>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => updateQueryParam({ page: page - 1 })}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages || isFetching}
                  onClick={() => updateQueryParam({ page: page + 1 })}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Application Details Sheet */}
      <ApplicationDetailsSheet
        isOpen={!!selectedAppForDetails}
        onClose={() => setSelectedAppForDetails(null)}
        application={selectedAppForDetails}
        onOpenUpdateStatus={(app) => {
          setSelectedAppForDetails(null);
          setSelectedAppForStatus(app);
        }}
        onOpenEdit={(app) => {
          setSelectedAppForDetails(null);
          setSelectedAppForEdit(app);
        }}
        onOpenWithdraw={(app) => {
          setSelectedAppForDetails(null);
          setSelectedAppForWithdraw(app);
        }}
      />

      {/* Update Application Status Modal */}
      <UpdateApplicationStatusModal
        isOpen={!!selectedAppForStatus}
        onClose={() => setSelectedAppForStatus(null)}
        application={selectedAppForStatus}
        onSuccess={() => refetch()}
      />

      {/* Edit Application Modal */}
      <EditApplicationModal
        isOpen={!!selectedAppForEdit}
        onClose={() => setSelectedAppForEdit(null)}
        application={selectedAppForEdit}
        onSuccess={() => refetch()}
      />

      {/* Withdraw Application Dialog */}
      <WithdrawApplicationDialog
        isOpen={!!selectedAppForWithdraw}
        onClose={() => setSelectedAppForWithdraw(null)}
        application={selectedAppForWithdraw}
        onSuccess={() => refetch()}
      />

      {/* Collect Admission Fee Dialog */}
      <CollectAdmissionFeeDialog
        open={!!selectedAppForPayment}
        onOpenChange={(open) => !open && setSelectedAppForPayment(null)}
        application={selectedAppForPayment}
        onSuccess={() => refetch()}
      />

      {/* View Fee Receipt Dialog */}
      <AdmissionFeeReceiptDialog
        open={!!selectedAppForReceipt}
        onOpenChange={(open) => !open && setSelectedAppForReceipt(null)}
        application={selectedAppForReceipt}
      />
    </div>
  );
};

export default ApplicationsManagementPage;
