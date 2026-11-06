import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  LayoutGrid,
  List,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
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
import { toast } from 'sonner';
import { useTableSelection } from '@/hooks/useTableSelection';
import {
  useGetApplicationsQuery,
  useUpdateApplicationStatusMutation,
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

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  enquiry_received: {
    label: 'Enquiry',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  qualified: {
    label: 'Qualified',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  counselling_scheduled: {
    label: 'Counselling',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  campus_visit: {
    label: 'Campus Visit',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  application_submitted: {
    label: 'Application Submitted',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  document_verification: {
    label: 'Document Verification',
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  assessment: {
    label: 'Assessment',
    bg: 'bg-violet-50 dark:bg-violet-950/50',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
  },
  admission_approved: {
    label: 'Admission Approved',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  waitlisted: {
    label: 'Waitlisted',
    bg: 'bg-orange-50 dark:bg-orange-950/50',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-950/50',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  fee_payment_pending: {
    label: 'Fee Payment',
    bg: 'bg-yellow-50 dark:bg-yellow-950/50',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  enrolled: {
    label: 'Enrolled',
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
};

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

  const [selectedAppForDetails, setSelectedAppForDetails] = useState<ApplicationItem | null>(null);
  const [selectedAppForStatus, setSelectedAppForStatus] = useState<ApplicationItem | null>(null);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<ApplicationItem | null>(null);
  const [selectedAppForWithdraw, setSelectedAppForWithdraw] = useState<ApplicationItem | null>(
    null,
  );
  const [selectedAppForPayment, setSelectedAppForPayment] = useState<ApplicationItem | null>(null);
  const [selectedAppForReceipt, setSelectedAppForReceipt] = useState<ApplicationItem | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { user } = useAuth();

  // Reset all modals and active application selections on user/tenant change
  useEffect(() => {
    setSelectedAppForDetails(null);
    setSelectedAppForStatus(null);
    setSelectedAppForEdit(null);
    setSelectedAppForWithdraw(null);
    setSelectedAppForPayment(null);
    setSelectedAppForReceipt(null);
  }, [user?.id, user?.school_id]);

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
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  const handleInlineStatusChange = async (appId: string, newStatus: string) => {
    try {
      setUpdatingAppId(appId);
      await updateApplicationStatus({ id: appId, status: newStatus }).unwrap();
      toast.success(`Application status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update application status');
    } finally {
      setUpdatingAppId(null);
    }
  };

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
            Review applicant files, track admission pipeline progress, and manage application
            statuses.
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
        <div className="min-h-[92px] p-4 rounded-xl border border-border bg-card flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total Applications</span>
            <div className="text-2xl font-black text-foreground font-mono">{kpiStats.total}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="min-h-[92px] p-4 rounded-xl border border-border bg-card flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Under Review</span>
            <div className="text-2xl font-black text-purple-600 font-mono">
              {kpiStats.underReview}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="min-h-[92px] p-4 rounded-xl border border-border bg-card flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Action Required</span>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {kpiStats.actionRequired}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="min-h-[92px] p-4 rounded-xl border border-border bg-card flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Approved & Ready</span>
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
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3"
        >
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
                <SelectItem value="ALL" className="text-xs">
                  All Stages
                </SelectItem>
                <SelectItem value="submitted" className="text-xs">
                  Submitted
                </SelectItem>
                <SelectItem value="documents_pending" className="text-xs">
                  Documents Pending
                </SelectItem>
                <SelectItem value="assessment_pending" className="text-xs">
                  Assessment Pending
                </SelectItem>
                <SelectItem value="under_review" className="text-xs">
                  Under Review
                </SelectItem>
                <SelectItem value="approved" className="text-xs">
                  Approved
                </SelectItem>
                <SelectItem value="waitlisted" className="text-xs">
                  Waitlisted
                </SelectItem>
                <SelectItem value="rejected" className="text-xs">
                  Rejected
                </SelectItem>
                <SelectItem value="withdrawn" className="text-xs">
                  Withdrawn
                </SelectItem>
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
                <SelectItem value="ALL" className="text-xs">
                  All Grades
                </SelectItem>
                {gradesData.map((g: any) => (
                  <SelectItem
                    key={g.grade_id || g.id}
                    value={g.grade_id || g.id}
                    className="text-xs"
                  >
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
                <SelectItem value="ALL" className="text-xs">
                  All Academic Years
                </SelectItem>
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

          {/* View Mode Toggle (Cards vs Table) */}
          <div className="flex items-center rounded-lg border border-border p-1 bg-muted/30 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Student Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Reset Filters Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="h-10 px-3 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0 cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </form>
      </div>

      {/* Batch Selection Banner */}
      {selectedCount > 0 && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{selectedCount} application(s) selected</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            className="h-7 text-xs font-bold border-indigo-200 hover:bg-indigo-100 dark:border-indigo-800 dark:hover:bg-indigo-900 cursor-pointer"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Main Content Area: Cards View or Table View */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-16 text-center space-y-3 bg-card border border-border rounded-xl">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs font-bold text-muted-foreground">Loading applications...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center space-y-3 bg-card border border-border rounded-xl text-red-600">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-sm font-bold">Failed to load applications</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="h-8 text-xs mt-1"
              >
                Retry
              </Button>
            </div>
          ) : applicationsList.length === 0 ? (
            <div className="p-16 text-center space-y-3 bg-card border border-border rounded-xl">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No applications found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No admission applications match your current filters. Try searching with different
                terms or resetting filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {applicationsList.map((app) => {
                const appId = app.application_id || app.id || '';
                const cardSelected = isSelected(appId);
                const lead = app.lead;
                const sName =
                  app.student_name ||
                  lead?.student_name ||
                  [lead?.student_first_name, lead?.student_last_name].filter(Boolean).join(' ') ||
                  'Applicant';
                const gName = app.grade_name || lead?.grade_name || '—';
                const ayName = app.academic_year?.academic_year_name || '—';
                const dateStr = new Date(app.application_date || app.created_at).toLocaleDateString(
                  'en-IN',
                  { day: '2-digit', month: 'short', year: 'numeric' },
                );

                const docs = app.documents || [];
                const docsVerifiedCount = docs.filter((d) => d.verify_status === 'verified').length;
                const totalDocs = docs.length;
                const docsPct =
                  totalDocs > 0 ? Math.round((docsVerifiedCount / totalDocs) * 100) : 0;

                const stage =
                  (lead as any)?.stage || (app as any)?.stage || 'application_submitted';
                const stageInfo = STAGE_CONFIG[stage] || STAGE_CONFIG['application_submitted'];
                const assessment = app.assessment;
                const payment = app.payment;

                return (
                  <Card
                    key={appId}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                      cardSelected
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                        : 'border-border bg-card hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Card Top: Checkbox, App Number & Status */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={cardSelected}
                            onCheckedChange={() => toggleRow(appId)}
                            aria-label={`Select application ${app.application_number}`}
                          />
                          <button
                            onClick={() => setSelectedAppForDetails(app)}
                            className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            {app.application_number}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageInfo.bg} ${stageInfo.text} ${stageInfo.border}`}
                          >
                            {stageInfo.label}
                          </span>
                          <ApplicationStatusBadge status={app.status} />
                        </div>
                      </div>

                      {/* Student Identity Header */}
                      <div className="flex items-start gap-3">
                        <Avatar size="default" className="border border-border/80 shrink-0">
                          <AvatarImage
                            src={(app as any).photo_url || (lead as any)?.photo_url}
                            alt={sName}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {getInitials(sName, 'A')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3
                            onClick={() => setSelectedAppForDetails(app)}
                            className="text-sm font-extrabold text-foreground truncate cursor-pointer hover:text-indigo-600 transition-colors"
                          >
                            {sName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                            <Badge variant="outline" className="text-[10px] font-semibold py-0">
                              {gName}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {ayName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact / Parent Information */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{lead?.contact_name || 'Guardian'}</span>
                          </span>
                          {lead?.lead_number && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              #{lead.lead_number}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                          {lead?.contact_phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-muted-foreground/70" />
                              <span>{lead.contact_phone}</span>
                            </span>
                          )}
                          {lead?.contact_email && (
                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-muted-foreground/70" />
                              <span className="truncate">{lead.contact_email}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress: Documents, Assessment & Payment */}
                      <div className="space-y-2 pt-1 text-xs">
                        {/* Document Verification Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Document Verification</span>
                            </span>
                            <span className="font-mono text-foreground">
                              {docsVerifiedCount} / {totalDocs} Verified
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                docsPct === 100
                                  ? 'bg-emerald-500'
                                  : docsPct > 0
                                    ? 'bg-amber-500'
                                    : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              style={{ width: `${Math.max(5, docsPct)}%` }}
                            />
                          </div>
                        </div>

                        {/* Assessment & Fee Badges */}
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <div className="min-w-0">
                            {assessment ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  assessment.result === 'pass' ||
                                  assessment.result === 'recommended'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                                }`}
                              >
                                Exam: {assessment.percentage ? `${assessment.percentage}% ` : ''}
                                {assessment.result || 'Done'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Exam: Not Scheduled
                              </span>
                            )}
                          </div>
                          <div>
                            <PaymentStatusBadge status={payment?.payment_status || 'pending'} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => setSelectedAppForDetails(app)}
                          className="h-8 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/app/admissions/verification?search=${encodeURIComponent(app.application_number || '')}`,
                            )
                          }
                          className="h-8 px-2.5 text-xs font-semibold gap-1 text-slate-700 dark:text-slate-300 cursor-pointer"
                          title="Verify submitted documents"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Docs</span>
                        </Button>
                        {payment?.payment_status === 'paid' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAppForReceipt(app)}
                            className="h-8 px-2 text-xs font-semibold text-emerald-600 cursor-pointer"
                            title="View Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 mr-1" />
                            Receipt
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAppForPayment(app)}
                            className="h-8 px-2 text-xs font-semibold text-amber-600 cursor-pointer"
                            title="Collect Fee"
                          >
                            <Banknote className="w-3.5 h-3.5 mr-1" />
                            Collect
                          </Button>
                        )}
                      </div>

                      {/* Dropdown Menu for Other Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs">
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
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Applications Table Container (Horizontal Scroll with min-w-[1250px] and Full Grid Borders) */
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-[1250px] border-collapse">
              <TableHeader className="bg-card">
                <TableRow className="border-b border-border hover:bg-transparent">
                  {/* 1. Selection Checkbox Column */}
                  <TableHead className="w-[44px] min-w-[44px] max-w-[44px] text-center p-0 border-r border-border">
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
                  <TableHead className="w-[105px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                    App Date
                  </TableHead>

                  {/* 8. Stage */}
                  <TableHead className="w-[145px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                    Stage
                  </TableHead>

                  {/* 9. Status */}
                  <TableHead className="w-[165px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                    Status
                  </TableHead>

                  {/* 10. Docs */}
                  <TableHead className="w-[110px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                    Docs
                  </TableHead>

                  {/* 11. Assessment */}
                  <TableHead className="w-[120px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                    Assessment
                  </TableHead>

                  {/* 12. Payment */}
                  <TableHead className="w-[110px] text-xs font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 px-3">
                    Payment
                  </TableHead>

                  {/* 13. Actions */}
                  <TableHead className="w-[70px] text-center text-xs font-bold text-slate-600 dark:text-slate-300 px-2">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Loading applications...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="w-6 h-6" />
                        <span className="font-semibold">Failed to load applications</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refetch()}
                          className="h-8 text-xs mt-1"
                        >
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : applicationsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          No applications found
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Try adjusting search filters or convert enquiries to create new
                          applications.
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
                      [lead?.student_first_name, lead?.student_last_name]
                        .filter(Boolean)
                        .join(' ') ||
                      'Applicant';
                    const gName = app.grade_name || lead?.grade_name || '—';
                    const ayName = app.academic_year?.academic_year_name || '—';
                    const dateStr = new Date(
                      app.application_date || app.created_at,
                    ).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    // Docs summary chip
                    const docs = app.documents || [];
                    const docsVerifiedCount = docs.filter(
                      (d) => d.verify_status === 'verified',
                    ).length;
                    const totalDocs = docs.length;

                    // Assessment result chip
                    const assessment = app.assessment;
                    const payment = app.payment;

                    return (
                      <TableRow
                        key={appId}
                        data-state={rowSelected ? 'selected' : undefined}
                        className={`border-b border-border transition-colors ${
                          rowSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
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

                        {/* 8. Candidate Lifecycle Stage */}
                        <TableCell className="border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                          {(() => {
                            const appStatusStr = (app.status as string)?.toLowerCase() || '';
                            const rawStage =
                              (lead as any)?.stage ||
                              (app as any)?.stage ||
                              (appStatusStr === 'approved'
                                ? 'admission_approved'
                                : appStatusStr === 'waitlisted'
                                  ? 'waitlisted'
                                  : appStatusStr === 'rejected'
                                    ? 'rejected'
                                    : 'application_submitted');
                            const stageConf = STAGE_CONFIG[rawStage] || {
                              label: rawStage.replace(/_/g, ' '),
                              bg: 'bg-muted',
                              text: 'text-foreground',
                              border: 'border-border',
                            };
                            return (
                              <span
                                className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border leading-tight ${stageConf.bg} ${stageConf.text} ${stageConf.border}`}
                              >
                                {stageConf.label}
                              </span>
                            );
                          })()}
                        </TableCell>

                        {/* 9. Interactive Application Status Dropdown */}
                        <TableCell className="border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              value={app.status || 'submitted'}
                              onValueChange={(val) => handleInlineStatusChange(appId, val)}
                              disabled={updatingAppId === appId}
                            >
                              <SelectTrigger className="h-7 text-xs font-semibold bg-background rounded-lg border-border w-[150px]">
                                {updatingAppId === appId ? (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                    <span>Saving...</span>
                                  </div>
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent className="text-xs">
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="documents_pending">Docs Pending</SelectItem>
                                <SelectItem value="assessment_pending">
                                  Assessment Pending
                                </SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                                    navigate(
                                      `/app/admissions/inquiries?searchText=${lead.lead_number}`,
                                    )
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
        </div>
      )}

      {/* Server-side Pagination Footer */}
      <div className="rounded-xl border border-border bg-card shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <strong>{applicationsList.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong>–
          <strong>{Math.min(page * pageSize, meta.total)}</strong> of <strong>{meta.total}</strong>{' '}
          applications
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
                <SelectItem value="10" className="text-xs">
                  10
                </SelectItem>
                <SelectItem value="20" className="text-xs">
                  20
                </SelectItem>
                <SelectItem value="50" className="text-xs">
                  50
                </SelectItem>
                <SelectItem value="100" className="text-xs">
                  100
                </SelectItem>
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
