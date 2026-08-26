import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  useGetCounsellingMetricsQuery,
  useGetLeadsQuery,
  useConvertLeadToApplicationMutation,
  LeadItem,
  LeadPriority,
  LeadStage,
} from '@/shared/api/crm.api';
import { useGetCounsellorsQuery } from '@/shared/api/staff.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserCheck,
  UserX,
  Users,
  Clock,
  Flame,
  Search,
  RotateCcw,
  Plus,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  Eye,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { FollowUpQueue } from '../../components/counselling/FollowUpQueue';
import { CounsellorAssignmentModal } from '../../components/counselling/CounsellorAssignmentModal';
import { LeadDetailsSheet } from '../../components/inquiry/LeadDetailsSheet';
import { AddActivityModal } from '../../components/inquiry/AddActivityModal';
import { ScheduleVisitModal } from '../../components/inquiry/ScheduleVisitModal';

export const CounsellingPage: React.FC = () => {
  const { user } = useAuth();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [counsellorFilter, setCounsellorFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [followupStatusFilter, setFollowupStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Selection State for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Dialogs & Drawers State
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activityLead, setActivityLead] = useState<LeadItem | null>(null);
  const [visitLead, setVisitLead] = useState<LeadItem | null>(null);
  const [assignmentModalLead, setAssignmentModalLead] = useState<LeadItem | null>(null);
  const [assignmentModalMode, setAssignmentModalMode] = useState<
    'assign' | 'reassign' | 'unassign'
  >('assign');
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isBulkAssignmentOpen, setIsBulkAssignmentOpen] = useState(false);

  // Hard reset all active modals, lead selection, and bulk actions on user/tenant transition
  useEffect(() => {
    setActiveLeadId(null);
    setIsDetailsOpen(false);
    setActivityLead(null);
    setVisitLead(null);
    setAssignmentModalLead(null);
    setIsAssignmentModalOpen(false);
    setIsBulkAssignmentOpen(false);
    setSelectedLeadIds([]);
  }, [user?.id, user?.school_id]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query Params calculation
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      pageSize,
      searchText: debouncedSearch || undefined,
      sort: 'updated_at',
      order: 'desc',
    };

    if (priorityFilter !== 'all') {
      params.priority = priorityFilter as LeadPriority;
    }
    if (stageFilter !== 'all') {
      params.stage = stageFilter as LeadStage;
    }
    if (counsellorFilter === 'unassigned') {
      params.unassigned = true;
    } else if (counsellorFilter !== 'all') {
      params.assigned_counsellor_id = counsellorFilter;
    }
    if (followupStatusFilter !== 'all') {
      params.followup_status = followupStatusFilter;
    }

    return params;
  }, [
    currentPage,
    debouncedSearch,
    priorityFilter,
    stageFilter,
    counsellorFilter,
    followupStatusFilter,
  ]);

  // RTK Query API Hooks
  const {
    data: metricsData,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useGetCounsellingMetricsQuery();

  const {
    data: leadsData,
    isLoading: isLoadingLeads,
    isFetching: isFetchingLeads,
    isError: isLeadsError,
    refetch: refetchLeads,
  } = useGetLeadsQuery(queryParams);

  const { data: counsellors = [] } = useGetCounsellorsQuery();
  const [convertLead, { isLoading: isConverting }] = useConvertLeadToApplicationMutation();

  const leads = leadsData?.data || [];
  const totalLeads = leadsData?.total || 0;
  const totalPages = leadsData?.totalPages || 1;

  // Handle Refresh
  const handleRefresh = () => {
    refetchMetrics();
    refetchLeads();
    toast.success('Counselling data refreshed');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCounsellorFilter('all');
    setPriorityFilter('all');
    setStageFilter('all');
    setFollowupStatusFilter('all');
    setCurrentPage(1);
  };

  // Quick KPI Click Filters
  const handleKpiClick = (type: 'today' | 'followup' | 'unassigned' | 'hot') => {
    handleResetFilters();
    if (type === 'today') {
      setFollowupStatusFilter('today');
    } else if (type === 'followup') {
      setFollowupStatusFilter('overdue');
    } else if (type === 'unassigned') {
      setCounsellorFilter('unassigned');
    } else if (type === 'hot') {
      setPriorityFilter('high');
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(leads.map((l) => l.lead_id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectOne = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds((prev) => [...prev, leadId]);
    } else {
      setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
    }
  };

  // Convert Lead to Application
  const handleConvertLead = async (lead: LeadItem) => {
    try {
      await convertLead(lead.lead_id).unwrap();
      toast.success(`Lead ${lead.lead_number} successfully converted to Application`);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to convert lead to application');
    }
  };

  // Helper for priority badges
  const renderPriorityBadge = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'hot':
        return (
          <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 text-[10px] font-bold uppercase gap-1">
            <Flame className="w-3 h-3 fill-rose-500 text-rose-500" /> High
          </Badge>
        );
      case 'medium':
      case 'warm':
        return (
          <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] font-bold uppercase">
            Medium
          </Badge>
        );
      case 'low':
      case 'cold':
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase">
            Low
          </Badge>
        );
      default:
        return <span className="text-xs text-muted-foreground font-medium">—</span>;
    }
  };

  // Helper for stage badges
  const renderStageBadge = (stage?: string | null) => {
    const formatted = stage ? stage.replace(/_/g, ' ') : 'Enquiry';
    return (
      <Badge
        variant="secondary"
        className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground whitespace-nowrap"
      >
        {formatted}
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Counselling
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Manage counsellor assignments, counselling activities, and admission follow-ups.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs font-bold h-9 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Counselling */}
        <div
          onClick={() => handleKpiClick('today')}
          className="bg-card border border-border/80 hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Today's Counselling
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {metricsData?.today_counselling ?? 0}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <span>Scheduled or logged today</span>
            </p>
          </div>
        </div>

        {/* Card 2: Pending Follow-ups */}
        <div
          onClick={() => handleKpiClick('followup')}
          className="bg-card border border-border/80 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pending Follow-ups
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {metricsData?.pending_followups ?? 0}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Scheduled callback tasks
            </p>
          </div>
        </div>

        {/* Card 3: Unassigned Leads */}
        <div
          onClick={() => handleKpiClick('unassigned')}
          className="bg-card border border-border/80 hover:border-rose-500/50 rounded-2xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Unassigned Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                {metricsData?.unassigned_leads ?? 0}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Requires counsellor allocation
            </p>
          </div>
        </div>

        {/* Card 4: Hot Leads */}
        <div
          onClick={() => handleKpiClick('hot')}
          className="bg-card border border-border/80 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Hot Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4 fill-emerald-500 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {metricsData?.hot_leads ?? 0}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              High admission probability
            </p>
          </div>
        </div>
      </div>

      {/* 3. FOLLOW-UP QUEUE SECTION */}
      <FollowUpQueue
        onViewLead={(leadId) => {
          setActiveLeadId(leadId);
          setIsDetailsOpen(true);
        }}
        onLogActivity={(leadId) => {
          const lead = leads.find((l) => l.lead_id === leadId);
          if (lead) setActivityLead(lead);
        }}
      />

      {/* 4. COUNSELLING LEADS QUEUE TABLE */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        {/* Table Title & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-foreground">Counselling & Leads Queue</h2>
              <p className="text-xs text-muted-foreground">
                Assign counsellors, log direct interactions, schedule visits, and track pipeline
                progress.
              </p>
            </div>

            {/* Total Records Counter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                Total Leads: <strong className="text-foreground">{totalLeads}</strong>
              </span>
            </div>
          </div>

          {/* Search & Filters Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search student, lead #, guardian, phone..."
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* Counsellor Filter */}
            <Select
              value={counsellorFilter}
              onValueChange={(val) => {
                setCounsellorFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Counsellors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Counsellors
                </SelectItem>
                <SelectItem value="unassigned" className="text-xs font-bold text-rose-600">
                  Unassigned Leads
                </SelectItem>
                {counsellors.map((c) => (
                  <SelectItem
                    key={c.staff_id || c.id}
                    value={c.staff_id || c.id}
                    className="text-xs"
                  >
                    {c.display_name || `${c.first_name} ${c.last_name || ''}`.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={priorityFilter}
              onValueChange={(val) => {
                setPriorityFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Priorities
                </SelectItem>
                <SelectItem value="high" className="text-xs text-rose-600 font-bold">
                  High
                </SelectItem>
                <SelectItem value="medium" className="text-xs text-amber-600 font-bold">
                  Medium
                </SelectItem>
                <SelectItem value="low" className="text-xs text-slate-600 font-bold">
                  Low
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Stage Filter */}
            <Select
              value={stageFilter}
              onValueChange={(val) => {
                setStageFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Stages
                </SelectItem>
                <SelectItem value="enquiry_received" className="text-xs">
                  Enquiry Received
                </SelectItem>
                <SelectItem value="qualified" className="text-xs">
                  Qualified
                </SelectItem>
                <SelectItem value="counselling_scheduled" className="text-xs">
                  Counselling Scheduled
                </SelectItem>
                <SelectItem value="campus_visit" className="text-xs">
                  Campus Visit
                </SelectItem>
                <SelectItem value="application_submitted" className="text-xs">
                  Application Submitted
                </SelectItem>
                <SelectItem value="enrolled" className="text-xs">
                  Enrolled
                </SelectItem>
                <SelectItem value="lost" className="text-xs">
                  Lost
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Follow-up Status Filter */}
            <div className="flex gap-1.5">
              <Select
                value={followupStatusFilter}
                onValueChange={(val) => {
                  setFollowupStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs flex-1">
                  <SelectValue placeholder="Follow-up Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Follow-ups
                  </SelectItem>
                  <SelectItem value="overdue" className="text-xs text-rose-600 font-bold">
                    Overdue
                  </SelectItem>
                  <SelectItem value="today" className="text-xs text-indigo-600 font-bold">
                    Today
                  </SelectItem>
                  <SelectItem value="upcoming" className="text-xs text-emerald-600 font-bold">
                    Upcoming
                  </SelectItem>
                  <SelectItem value="none" className="text-xs text-muted-foreground">
                    No Follow-up
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Filters */}
              {(searchInput ||
                counsellorFilter !== 'all' ||
                priorityFilter !== 'all' ||
                stageFilter !== 'all' ||
                followupStatusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetFilters}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 5. BULK ACTION TOOLBAR (Shown when rows selected) */}
        {selectedLeadIds.length > 0 && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white font-bold text-xs">
                {selectedLeadIds.length} Selected
              </Badge>
              <span className="text-xs text-indigo-950 dark:text-indigo-200 font-medium">
                Perform bulk action on selected leads:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold bg-background text-indigo-700 dark:text-indigo-300 border-indigo-300 gap-1.5"
                onClick={() => {
                  setAssignmentModalLead(null);
                  setAssignmentModalMode('assign');
                  setIsBulkAssignmentOpen(true);
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assign Counsellor
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold bg-background text-amber-700 dark:text-amber-300 border-amber-300 gap-1.5"
                onClick={() => {
                  setAssignmentModalLead(null);
                  setAssignmentModalMode('unassign');
                  setIsBulkAssignmentOpen(true);
                }}
              >
                <UserX className="w-3.5 h-3.5" />
                Unassign Counsellor
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedLeadIds([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* 6. LEADS TABLE */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground font-black text-[11px] uppercase tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <Checkbox
                      checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                    />
                  </th>
                  <th className="p-3 w-12 text-center">S.No</th>
                  <th className="p-3">Lead #</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Guardian</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Counsellor</th>
                  <th className="p-3">Next Follow-up</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingLeads ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-3 text-center">
                        <Skeleton className="h-4 w-4 mx-auto" />
                      </td>
                      <td className="p-3 text-center">
                        <Skeleton className="h-4 w-6 mx-auto" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-3 text-right">
                        <Skeleton className="h-7 w-7 ml-auto rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : isLeadsError ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-muted-foreground space-y-2">
                      <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
                      <p className="font-bold text-rose-700 dark:text-rose-400">
                        Failed to load counselling leads
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetchLeads()}
                        className="text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" /> Retry
                      </Button>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-muted-foreground space-y-2">
                      <UserCheck className="w-8 h-8 mx-auto text-muted-foreground/40" />
                      <p className="font-bold text-foreground">No counselling leads found</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        No leads match your current search or filter criteria. Try resetting your
                        filters.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResetFilters}
                        className="text-xs mt-2"
                      >
                        Reset Filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, idx) => {
                    const isSelected = selectedLeadIds.includes(lead.lead_id);
                    const sNo = (currentPage - 1) * pageSize + idx + 1;
                    const studentName =
                      lead.student_name ||
                      `${lead.student_first_name || ''} ${lead.student_last_name || ''}`.trim() ||
                      'Prospective Student';
                    const gradeName =
                      lead.grade_name ||
                      lead.academic_year_grade?.name ||
                      (lead.academic_year_grades as any)?.grades?.grade_name ||
                      'Grade';
                    const counsellorName = lead.counselor?.name || null;
                    const nextFollowupDate = lead.next_followup_date || lead.next_follow_up;

                    return (
                      <tr
                        key={lead.lead_id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(c) => handleSelectOne(lead.lead_id, !!c)}
                          />
                        </td>

                        {/* S.No */}
                        <td className="p-3 text-center text-muted-foreground font-mono text-[11px]">
                          {sNo}
                        </td>

                        {/* Lead Number (Untranslated) */}
                        <td className="p-3 font-mono font-bold text-foreground">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLeadId(lead.lead_id);
                              setIsDetailsOpen(true);
                            }}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors text-left"
                          >
                            {lead.lead_number}
                          </button>
                        </td>

                        {/* Student */}
                        <td className="p-3">
                          <div className="font-bold text-foreground">{studentName}</div>
                          {lead.gender && (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {lead.gender}
                            </span>
                          )}
                        </td>

                        {/* Grade */}
                        <td className="p-3 text-muted-foreground font-medium">{gradeName}</td>

                        {/* Guardian */}
                        <td className="p-3">
                          <div className="font-medium text-foreground">
                            {lead.contact_name || '—'}
                          </div>
                          {lead.contact_relationship && (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {lead.contact_relationship}
                            </span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="p-3 space-y-0.5">
                          {lead.contact_phone && (
                            <a
                              href={`tel:${lead.contact_phone}`}
                              className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {lead.contact_phone}
                            </a>
                          )}
                          {lead.contact_email && (
                            <a
                              href={`mailto:${lead.contact_email}`}
                              className="text-[10px] text-muted-foreground hover:underline flex items-center gap-1 truncate max-w-[140px]"
                            >
                              <Mail className="w-3 h-3" />
                              {lead.contact_email}
                            </a>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="p-3">{renderPriorityBadge(lead.priority)}</td>

                        {/* Stage */}
                        <td className="p-3">{renderStageBadge(lead.stage)}</td>

                        {/* Counsellor */}
                        <td className="p-3">
                          {counsellorName ? (
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{counsellorName}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignmentModalLead(lead);
                                setAssignmentModalMode('assign');
                                setIsAssignmentModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
                            >
                              <UserX className="w-3 h-3" /> Unassigned
                            </button>
                          )}
                        </td>

                        {/* Next Follow-up */}
                        <td className="p-3">
                          {nextFollowupDate ? (
                            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              {new Date(nextFollowupDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-[11px]">
                              None
                            </span>
                          )}
                        </td>

                        {/* Row Actions Dropdown */}
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">
                                Lead Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setActiveLeadId(lead.lead_id);
                                  setIsDetailsOpen(true);
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setActivityLead(lead)}
                                className="gap-2 cursor-pointer"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                Log Activity
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setVisitLead(lead)}
                                className="gap-2 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                Schedule Visit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => {
                                  setAssignmentModalLead(lead);
                                  setAssignmentModalMode(
                                    lead.assigned_counsellor_id ? 'reassign' : 'assign',
                                  );
                                  setIsAssignmentModalOpen(true);
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                                {lead.assigned_counsellor_id
                                  ? 'Reassign Counsellor'
                                  : 'Assign Counsellor'}
                              </DropdownMenuItem>

                              {lead.assigned_counsellor_id && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setAssignmentModalLead(lead);
                                    setAssignmentModalMode('unassign');
                                    setIsAssignmentModalOpen(true);
                                  }}
                                  className="gap-2 cursor-pointer text-amber-600"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Unassign Counsellor
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleConvertLead(lead)}
                                disabled={isConverting}
                                className="gap-2 cursor-pointer text-emerald-600 font-bold"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Convert to Application
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 7. PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-border flex items-center justify-between text-xs bg-muted/20">
              <span className="text-muted-foreground">
                Showing Page <strong className="text-foreground">{currentPage}</strong> of{' '}
                <strong className="text-foreground">{totalPages}</strong> ({totalLeads} leads)
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isFetchingLeads}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isFetchingLeads}
                  className="h-8 px-2.5 text-xs"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 8. SINGLE LEAD ASSIGNMENT MODAL */}
      <CounsellorAssignmentModal
        open={isAssignmentModalOpen}
        onOpenChange={setIsAssignmentModalOpen}
        lead={assignmentModalLead}
        mode={assignmentModalMode}
        onSuccess={() => {
          refetchLeads();
          refetchMetrics();
        }}
      />

      {/* 9. BULK COUNSELLOR ASSIGNMENT MODAL */}
      <CounsellorAssignmentModal
        open={isBulkAssignmentOpen}
        onOpenChange={setIsBulkAssignmentOpen}
        leadIds={selectedLeadIds}
        mode={assignmentModalMode}
        onSuccess={() => {
          setSelectedLeadIds([]);
          refetchLeads();
          refetchMetrics();
        }}
      />

      {/* 10. LEAD DETAILS DRAWER / SHEET */}
      <LeadDetailsSheet
        leadId={activeLeadId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onLeadUpdated={() => {
          refetchLeads();
          refetchMetrics();
        }}
      />

      {/* 11. ADD ACTIVITY MODAL */}
      {activityLead && (
        <AddActivityModal
          open={!!activityLead}
          onOpenChange={(open) => !open && setActivityLead(null)}
          leadId={activityLead.lead_id}
          leadNumber={activityLead.lead_number}
          studentName={activityLead.student_name}
        />
      )}

      {/* 12. SCHEDULE CAMPUS VISIT MODAL */}
      {visitLead && (
        <ScheduleVisitModal
          open={!!visitLead}
          onOpenChange={(open) => !open && setVisitLead(null)}
          leadId={visitLead.lead_id}
          studentName={visitLead.student_name}
        />
      )}
    </div>
  );
};

export default CounsellingPage;
