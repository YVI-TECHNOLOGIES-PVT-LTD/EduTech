import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  useGetLeadsQuery,
  LeadItem,
  SearchLeadParams,
  LeadStage,
  LeadPriority,
  LeadSource,
} from '@/shared/api/crm.api';
import { useMasterData } from '../../context/MasterDataContext';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { CreateLeadModal } from '../../components/inquiry/CreateLeadModal';
import { EditLeadModal } from '../../components/inquiry/EditLeadModal';
import { LeadDetailsSheet } from '../../components/inquiry/LeadDetailsSheet';
import { AddActivityModal } from '../../components/inquiry/AddActivityModal';
import { ScheduleVisitModal } from '../../components/inquiry/ScheduleVisitModal';
import { DeleteLeadDialog } from '../../components/inquiry/DeleteLeadDialog';
import { CreateApplicationDialog } from '../../components/inquiry/CreateApplicationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';
import {
  UserPlus,
  Search,
  RotateCcw,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  PhoneCall,
  CalendarPlus,
  FileCheck2,
  Users,
  Flame,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
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
    label: 'App Submitted',
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
  high: { label: 'High', color: 'bg-red-500 text-white', icon: '🔥' },
  hot: { label: 'High', color: 'bg-red-500 text-white', icon: '🔥' },
  medium: { label: 'Medium', color: 'bg-amber-500 text-white', icon: '⚡' },
  warm: { label: 'Medium', color: 'bg-amber-500 text-white', icon: '⚡' },
  low: { label: 'Low', color: 'bg-slate-400 text-white', icon: '❄️' },
  cold: { label: 'Low', color: 'bg-slate-400 text-white', icon: '❄️' },
};

export const LeadsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { grades } = useMasterData();
  const { data: staffList = [] } = useGetStaffListQuery();

  // Filters and Pagination State
  const [searchText, setSearchText] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('ALL');
  const [selectedCounsellorId, setSelectedCounsellorId] = useState<string>('ALL');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Active Modals & Selected Lead
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showVisitModal, setShowVisitModal] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showConvertDialog, setShowConvertDialog] = useState<boolean>(false);

  // Hard reset all modal and selected lead states when user identity or tenant changes
  useEffect(() => {
    setSelectedLeadId(null);
    setSelectedLead(null);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailsSheet(false);
    setShowActivityModal(false);
    setShowVisitModal(false);
    setShowDeleteDialog(false);
    setShowConvertDialog(false);
  }, [user?.id, user?.school_id]);

  // Build query params
  const queryParams: SearchLeadParams = useMemo(() => {
    const params: SearchLeadParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
    };
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (searchText.trim()) params.searchText = searchText.trim();
    if (selectedStage !== 'ALL') params.stage = selectedStage as LeadStage;
    if (selectedPriority !== 'ALL') params.priority = selectedPriority as LeadPriority;
    if (selectedSource !== 'ALL') params.source = selectedSource as LeadSource;
    if (selectedGradeId !== 'ALL' && UUID_REGEX.test(selectedGradeId))
      params.grade_id = selectedGradeId;
    if (selectedCounsellorId !== 'ALL' && UUID_REGEX.test(selectedCounsellorId))
      params.assigned_counsellor_id = selectedCounsellorId;
    return params;
  }, [
    searchText,
    selectedStage,
    selectedPriority,
    selectedSource,
    selectedGradeId,
    selectedCounsellorId,
    sortField,
    sortOrder,
    page,
    pageSize,
  ]);

  const {
    data: leadsResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetLeadsQuery(queryParams);

  const leads = leadsResponse?.data || [];
  const meta = leadsResponse?.meta || {
    total: 0,
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
    data: leads,
    getId: (lead) => lead.lead_id,
  });

  // KPI Metrics Computed from current response and meta
  const stats = useMemo(() => {
    const total = meta.total || 0;
    const high = leads.filter((l) => l.priority === 'high' || l.priority === 'hot').length;
    const qualified = leads.filter((l) => l.stage === 'qualified').length;
    const visits = leads.filter(
      (l) => l.stage === 'campus_visit' || l.stage === 'counselling_scheduled',
    ).length;
    return { total, high, qualified, visits };
  }, [leads, meta.total]);

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedStage('ALL');
    setSelectedPriority('ALL');
    setSelectedSource('ALL');
    setSelectedGradeId('ALL');
    setSelectedCounsellorId('ALL');
    setSortField('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const openDetails = (leadId: string) => {
    setSelectedLeadId(leadId);
    setShowDetailsSheet(true);
  };

  const openEdit = (lead: LeadItem) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const openActivity = (lead: LeadItem) => {
    setSelectedLead(lead);
    setShowActivityModal(true);
  };

  const openVisit = (lead: LeadItem) => {
    setSelectedLead(lead);
    setShowVisitModal(true);
  };

  const openDelete = (lead: LeadItem) => {
    setSelectedLead(lead);
    setShowDeleteDialog(true);
  };

  const openConvert = (lead: LeadItem) => {
    setSelectedLead(lead);
    setShowConvertDialog(true);
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            Front Office Leads & Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal">
            Manage prospective student leads, track communications, schedule campus visits, and
            drive admissions.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-2 shadow-sm h-10 px-4 rounded-xl shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Create New Lead
        </Button>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between min-h-[92px]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Inquiries
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</p>
          </div>
          <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between min-h-[92px]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              🔥 High Priority
            </p>
            <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              {stats.high}
            </p>
          </div>
          <div className="size-10 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between min-h-[92px]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Qualified Leads
            </p>
            <p className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
              {stats.qualified}
            </p>
          </div>
          <div className="size-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between min-h-[92px]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Visits & Sessions
            </p>
            <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {stats.visits}
            </p>
          </div>
          <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="p-3.5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search student, lead #, guardian, phone or email..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-xs sm:text-sm bg-background rounded-xl border-border"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <Select
              value={selectedStage}
              onValueChange={(val) => {
                setSelectedStage(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[155px] h-10 text-xs font-semibold bg-background rounded-xl">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stages</SelectItem>
                {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={selectedPriority}
              onValueChange={(val) => {
                setSelectedPriority(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-10 text-xs font-semibold bg-background rounded-xl">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priority</SelectItem>
                <SelectItem value="high">🔥 High</SelectItem>
                <SelectItem value="medium">⚡ Medium</SelectItem>
                <SelectItem value="low">❄️ Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Grade Filter */}
            <Select
              value={selectedGradeId}
              onValueChange={(val) => {
                setSelectedGradeId(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[135px] h-10 text-xs font-semibold bg-background rounded-xl">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Grades</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Counsellor Filter */}
            <Select
              value={selectedCounsellorId}
              onValueChange={(val) => {
                setSelectedCounsellorId(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[155px] h-10 text-xs font-semibold bg-background rounded-xl">
                <SelectValue placeholder="Counsellor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Counsellors</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="h-10 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Leads Table with Selection Checkbox, S.NO, and Full Grid Borders */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden w-full">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[1250px] border-collapse">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border hover:bg-transparent">
                {/* 1. Selection Checkbox Column */}
                <TableHead className="w-[44px] min-w-[44px] max-w-[44px] text-center p-0 border-r border-border">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      disabled={leads.length === 0}
                      aria-label="Select all leads"
                    />
                  </div>
                </TableHead>

                {/* 2. S.NO Column */}
                <TableHead className="w-[55px] min-w-[55px] max-w-[55px] text-center text-[11px] font-bold uppercase tracking-wider border-r border-border px-1">
                  S.NO
                </TableHead>

                {/* 3. Lead # */}
                <TableHead className="w-[110px] min-w-[110px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Lead #
                </TableHead>

                {/* 4. Student Name */}
                <TableHead className="w-[180px] min-w-[180px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Student Name
                </TableHead>

                {/* 5. Grade */}
                <TableHead className="w-[100px] min-w-[100px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Grade
                </TableHead>

                {/* 6. Guardian */}
                <TableHead className="w-[150px] min-w-[150px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Guardian
                </TableHead>

                {/* 7. Contact */}
                <TableHead className="w-[180px] min-w-[180px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Contact
                </TableHead>

                {/* 8. Source */}
                <TableHead className="w-[110px] min-w-[110px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Source
                </TableHead>

                {/* 9. Stage */}
                <TableHead className="w-[150px] min-w-[150px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Stage
                </TableHead>

                {/* 10. Priority */}
                <TableHead className="w-[105px] min-w-[105px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Priority
                </TableHead>

                {/* 11. AI Score */}
                <TableHead className="w-[95px] min-w-[95px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  AI Score
                </TableHead>

                {/* 12. Counsellor */}
                <TableHead className="w-[140px] min-w-[140px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Counsellor
                </TableHead>

                {/* 13. Enquiry Date */}
                <TableHead className="w-[120px] min-w-[120px] text-[11px] font-bold uppercase tracking-wider border-r border-border px-3">
                  Enquiry Date
                </TableHead>

                {/* 14. Actions */}
                <TableHead className="w-[65px] min-w-[65px] text-right text-[11px] font-bold uppercase tracking-wider px-3">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={14} className="py-4 text-center">
                      <div className="h-4 bg-muted/60 rounded animate-pulse w-full max-w-4xl mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={14} className="py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">
                      Failed to load leads data
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      There was an error communicating with the server. Please try again.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetch()}
                      className="mt-3 text-xs font-semibold rounded-xl"
                    >
                      Retry Loading
                    </Button>
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">No leads found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Try adjusting your filters or search keywords, or create a new lead to get
                      started.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Create New Lead
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead, index) => {
                  const leadId = lead.lead_id;
                  const rowSelected = isSelected(leadId);
                  const serialNumber = (page - 1) * pageSize + index + 1;
                  const stageBadge = STAGE_CONFIG[lead.stage] || {
                    label: lead.stage,
                    bg: 'bg-muted',
                    text: 'text-foreground',
                    border: 'border-border',
                  };
                  const priorityBadge = lead.priority
                    ? PRIORITY_CONFIG[String(lead.priority).toLowerCase()]
                    : null;

                  return (
                    <TableRow
                      key={leadId}
                      data-state={rowSelected ? 'selected' : undefined}
                      className={`border-b border-border/80 transition-colors cursor-pointer group ${
                        rowSelected
                          ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
                      }`}
                      onClick={() => openDetails(leadId)}
                    >
                      {/* 1. Selection Checkbox */}
                      <TableCell
                        className="text-center p-0 border-r border-border/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={rowSelected}
                            onCheckedChange={() => toggleRow(leadId)}
                            aria-label={`Select lead ${lead.lead_number}`}
                          />
                        </div>
                      </TableCell>

                      {/* 2. S.NO */}
                      <TableCell className="text-center font-mono text-xs font-semibold text-muted-foreground border-r border-border/80 px-1 py-3">
                        {serialNumber}
                      </TableCell>

                      {/* 3. Lead Number */}
                      <TableCell className="font-mono text-xs font-medium text-foreground border-r border-border/80 px-3 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {lead.lead_number}
                        </span>
                      </TableCell>

                      {/* 4. Student Name */}
                      <TableCell className="border-r border-border/80 px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {lead.student_first_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-tight truncate">
                              {lead.student_name}
                            </p>
                            {lead.gender && (
                              <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                                {lead.gender}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 5. Grade */}
                      <TableCell className="text-xs font-medium text-foreground border-r border-border/80 px-3 py-3">
                        {lead.grade_name || 'Standard'}
                      </TableCell>

                      {/* 6. Guardian Name */}
                      <TableCell className="border-r border-border/80 px-3 py-3">
                        <p className="text-xs font-medium text-foreground leading-tight">
                          {lead.contact_name}
                        </p>
                        {lead.contact_relationship && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {lead.contact_relationship}
                          </span>
                        )}
                      </TableCell>

                      {/* 7. Contact Info */}
                      <TableCell className="min-w-[180px] border-r border-border/80 px-3 py-3">
                        <div className="space-y-1 text-xs">
                          <p className="font-medium text-foreground flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{lead.contact_phone}</span>
                          </p>
                          {lead.contact_email && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate max-w-[170px]">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{lead.contact_email}</span>
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* 8. Source */}
                      <TableCell className="border-r border-border/80 px-3 py-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize font-medium px-2 py-0.5 rounded-md"
                        >
                          {lead.source?.replace(/_/g, ' ') || 'Direct'}
                        </Badge>
                      </TableCell>

                      {/* 9. Stage */}
                      <TableCell className="border-r border-border/80 px-3 py-3">
                        <span
                          className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border leading-tight ${stageBadge.bg} ${stageBadge.text} ${stageBadge.border}`}
                        >
                          {stageBadge.label}
                        </span>
                      </TableCell>

                      {/* 10. Priority */}
                      <TableCell className="border-r border-border/80 px-3 py-3">
                        {priorityBadge ? (
                          <span
                            className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${priorityBadge.color}`}
                          >
                            <span className="mr-1">{priorityBadge.icon}</span> {priorityBadge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">—</span>
                        )}
                      </TableCell>

                      {/* 11. AI Lead Score */}
                      <TableCell className="border-r border-border/80 px-3 py-3">
                        {lead.ai_lead_score !== null && lead.ai_lead_score !== undefined ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(0, lead.ai_lead_score))}%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-foreground">
                              {lead.ai_lead_score}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">—</span>
                        )}
                      </TableCell>

                      {/* 12. Assigned Counsellor */}
                      <TableCell className="border-r border-border/80 px-3 py-3">
                        {lead.counselor?.name ? (
                          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{lead.counselor.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>

                      {/* 13. Enquiry Date */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-medium border-r border-border/80 px-3 py-3">
                        {new Date(lead.enquiry_date).toLocaleDateString()}
                      </TableCell>

                      {/* 14. Actions Menu */}
                      <TableCell
                        className="text-right px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl p-1.5 shadow-md"
                          >
                            <DropdownMenuItem
                              onClick={() => openDetails(leadId)}
                              className="text-xs font-semibold gap-2 cursor-pointer rounded-lg"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                              View Full Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openActivity(lead)}
                              className="text-xs font-semibold gap-2 cursor-pointer rounded-lg"
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                              Log Activity
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openVisit(lead)}
                              className="text-xs font-semibold gap-2 cursor-pointer rounded-lg"
                            >
                              <CalendarPlus className="w-3.5 h-3.5 text-purple-600" />
                              Schedule Visit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openEdit(lead)}
                              className="text-xs font-semibold gap-2 cursor-pointer rounded-lg"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                              Edit Lead
                            </DropdownMenuItem>

                            {lead.stage !== 'application_submitted' &&
                              lead.stage !== 'enrolled' && (
                                <DropdownMenuItem
                                  onClick={() => openConvert(lead)}
                                  className="text-xs font-semibold gap-2 text-indigo-600 dark:text-indigo-400 cursor-pointer rounded-lg"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  Convert to App
                                </DropdownMenuItem>
                              )}

                            <DropdownMenuSeparator className="my-1" />

                            <DropdownMenuItem
                              onClick={() => openDelete(lead)}
                              className="text-xs font-semibold gap-2 text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              Delete Lead
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

        {/* 5. Pagination Bar */}
        <div className="p-3.5 px-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/15">
          <div>
            Showing{' '}
            <span className="font-semibold text-foreground">
              {meta.total > 0 ? (page - 1) * pageSize + 1 : 0}
            </span>
            –
            <span className="font-semibold text-foreground">
              {Math.min(page * pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{meta.total}</span> leads
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[72px] h-8 text-xs font-semibold bg-background rounded-lg border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-xs font-semibold text-foreground">
                Page {page} of {meta.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
                disabled={page >= (meta.totalPages || 1) || isFetching}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Child Dialogs & Modals */}
      <CreateLeadModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => refetch()}
      />

      <LeadDetailsSheet
        leadId={selectedLeadId}
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        onLeadUpdated={() => refetch()}
      />

      {selectedLead && (
        <>
          <EditLeadModal
            lead={selectedLead}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onSuccess={() => refetch()}
          />

          <AddActivityModal
            leadId={selectedLead.lead_id}
            leadNumber={selectedLead.lead_number}
            studentName={selectedLead.student_name}
            open={showActivityModal}
            onOpenChange={setShowActivityModal}
            onSuccess={() => refetch()}
          />

          <ScheduleVisitModal
            leadId={selectedLead.lead_id}
            leadNumber={selectedLead.lead_number}
            studentName={selectedLead.student_name}
            open={showVisitModal}
            onOpenChange={setShowVisitModal}
            onSuccess={() => refetch()}
          />

          <DeleteLeadDialog
            lead={selectedLead}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onSuccess={() => refetch()}
          />

          <CreateApplicationDialog
            lead={selectedLead}
            open={showConvertDialog}
            onOpenChange={setShowConvertDialog}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </div>
  );
};
