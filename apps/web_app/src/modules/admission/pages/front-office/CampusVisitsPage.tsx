import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Search,
  RotateCcw,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MapPin,
  Video,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  MoreVertical,
  CalendarCheck,
  UserX,
  ExternalLink,
  Phone,
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
import {
  useGetCampusVisitsQuery,
  useDeleteVisitMutation,
  LeadVisitItem,
  VisitType,
  VisitStatus,
} from '@/shared/api/crm.api';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { ScheduleVisitDialog } from '../../components/visit/ScheduleVisitDialog';
import { RescheduleVisitDialog } from '../../components/visit/RescheduleVisitDialog';
import { CompleteVisitDialog } from '../../components/visit/CompleteVisitDialog';
import { CancelVisitDialog } from '../../components/visit/CancelVisitDialog';
import { NoShowVisitDialog } from '../../components/visit/NoShowVisitDialog';
import { LeadDetailsSheet } from '../../components/inquiry/LeadDetailsSheet';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<
  VisitStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  scheduled: {
    label: 'Scheduled',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: XCircle,
  },
  no_show: {
    label: 'No Show',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: UserX,
  },
};

export const CampusVisitsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven query state
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const searchText = searchParams.get('search') || '';
  const visitTypeFilter = searchParams.get('visit_type') || 'ALL';
  const statusFilter = searchParams.get('status') || 'ALL';
  const staffFilter = searchParams.get('staff_id') || 'ALL';
  const dateRangeFilter = searchParams.get('date_range') || 'ALL';

  // Search input state
  const [searchInput, setSearchInput] = useState(searchText);

  // Dialog States
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<LeadVisitItem | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedVisitForComplete, setSelectedVisitForComplete] = useState<LeadVisitItem | null>(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedVisitForCancel, setSelectedVisitForCancel] = useState<LeadVisitItem | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedVisitForNoShow, setSelectedVisitForNoShow] = useState<LeadVisitItem | null>(null);
  const [isNoShowOpen, setIsNoShowOpen] = useState(false);

  // Lead Details Drawer State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);

  // Staff List Query
  const { data: staffList = [] } = useGetStaffListQuery();
  const [deleteVisitMutation] = useDeleteVisitMutation();

  // Calculate date boundaries for filter
  const dateParams = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    ).toISOString();

    if (dateRangeFilter === 'today') {
      return { startDate: startOfToday, endDate: endOfToday };
    }
    if (dateRangeFilter === 'upcoming') {
      return { startDate: startOfToday };
    }
    if (dateRangeFilter === 'past') {
      return { endDate: startOfToday };
    }
    if (dateRangeFilter === 'this_week') {
      const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      return { startDate: startOfToday, endDate: endOfWeek };
    }
    return {};
  }, [dateRangeFilter]);

  // Query Params for API
  const queryParams = useMemo(() => {
    return {
      page,
      limit: pageSize,
      search: searchText.trim() || undefined,
      visit_type: visitTypeFilter !== 'ALL' ? (visitTypeFilter as VisitType) : undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as VisitStatus) : undefined,
      staff_id: staffFilter !== 'ALL' ? staffFilter : undefined,
      ...dateParams,
    };
  }, [page, pageSize, searchText, visitTypeFilter, statusFilter, staffFilter, dateParams]);

  const {
    data: visitsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCampusVisitsQuery(queryParams);

  const visits = visitsResponse?.items || [];
  const totalItems = visitsResponse?.total || 0;
  const totalPages = visitsResponse?.totalPages || 1;

  // Dynamic Database-Aggregated KPI Metrics
  const metrics = useMemo(() => {
    if (visitsResponse?.metrics) {
      return visitsResponse.metrics;
    }
    const today = new Date().toDateString();
    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let cancelledNoShowCount = 0;

    visits.forEach((v) => {
      const vDate = new Date(v.scheduled_at).toDateString();
      if (v.status === 'completed') {
        completedCount++;
      } else if (v.status === 'cancelled' || v.status === 'no_show') {
        cancelledNoShowCount++;
      } else if (v.status === 'scheduled') {
        if (vDate === today) {
          todayCount++;
        } else if (new Date(v.scheduled_at) > new Date()) {
          upcomingCount++;
        }
      }
    });

    return {
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      cancelledOrNoShow: cancelledNoShowCount,
    };
  }, [visitsResponse?.metrics, visits]);

  // URL State Updates
  const updateQuery = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'ALL') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleDeleteVisit = async (visit: LeadVisitItem) => {
    if (window.confirm('Are you sure you want to permanently delete this visit record?')) {
      try {
        await deleteVisitMutation({ visitId: visit.visit_id, leadId: visit.lead_id }).unwrap();
        toast.success('Visit record deleted.');
      } catch (err: any) {
        toast.error(err?.data?.error || 'Failed to delete visit.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* 1. Header Banner */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-700/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Front Office Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Campus Visits & Sessions
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Manage campus visits, counselling sessions, school tours and visit outcomes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="icon"
              className="bg-slate-900 border-slate-800 text-white hover:bg-slate-800 h-10 w-10 rounded-xl"
              title="Refresh Visits"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              onClick={() => setIsScheduleOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule Visit
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today's Visits
            </p>
            <p className="text-2xl font-extrabold text-foreground">{metrics.today}</p>
            <p className="text-[11px] text-muted-foreground">Scheduled for today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center border border-purple-100 dark:border-purple-900">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Upcoming
            </p>
            <p className="text-2xl font-extrabold text-foreground">{metrics.upcoming}</p>
            <p className="text-[11px] text-muted-foreground">Future appointments</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Completed
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {metrics.completed}
            </p>
            <p className="text-[11px] text-muted-foreground">Successful sessions</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cancelled / No-Show
            </p>
            <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">
              {metrics.cancelledOrNoShow}
            </p>
            <p className="text-[11px] text-muted-foreground">Missed or cancelled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <UserX className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* 3. Search & Interactive Filter Controls */}
      <Card className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student, lead #, phone..."
              className="pl-9 h-10 text-xs rounded-xl bg-background border-border"
            />
          </form>

          {/* Date Filter */}
          <Select
            value={dateRangeFilter}
            onValueChange={(val) => updateQuery('date_range', val)}
          >
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Dates</SelectItem>
              <SelectItem value="today" className="text-xs">Today's Visits</SelectItem>
              <SelectItem value="this_week" className="text-xs">Next 7 Days</SelectItem>
              <SelectItem value="upcoming" className="text-xs">All Upcoming</SelectItem>
              <SelectItem value="past" className="text-xs">Past Visits</SelectItem>
            </SelectContent>
          </Select>

          {/* Visit Type Filter */}
          <Select
            value={visitTypeFilter}
            onValueChange={(val) => updateQuery('visit_type', val)}
          >
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border">
              <SelectValue placeholder="Visit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
              <SelectItem value="campus" className="text-xs">Campus Tour</SelectItem>
              <SelectItem value="virtual" className="text-xs">Virtual Session</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => updateQuery('status', val)}
          >
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
              <SelectItem value="no_show" className="text-xs">No Show</SelectItem>
            </SelectContent>
          </Select>

          {/* Staff / Counsellor Filter */}
          <Select
            value={staffFilter}
            onValueChange={(val) => updateQuery('staff_id', val)}
          >
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border">
              <SelectValue placeholder="Counsellor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Counsellors</SelectItem>
              {staffList.map((s: any) => (
                <SelectItem key={s.staff_id || s.id} value={s.staff_id || s.id} className="text-xs">
                  {s.name ||
                    (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.employee_code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{visits.length}</strong> of{' '}
            <strong className="text-foreground">{totalItems}</strong> visits
          </span>
          {(searchText ||
            visitTypeFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            staffFilter !== 'ALL' ||
            dateRangeFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 h-7 gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </Card>

      {/* 4. Visits Table */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-muted-foreground font-medium">
              Loading campus visits and sessions...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-foreground">Unable to load campus visits</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs rounded-xl"
            >
              Retry
            </Button>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            {searchText ||
            visitTypeFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            staffFilter !== 'ALL' ||
            dateRangeFilter !== 'ALL' ? (
              <>
                <p className="text-sm font-bold text-foreground">No visits match your filters</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search criteria or resetting filters to view all scheduled visits.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs rounded-xl font-bold gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground">No campus visits scheduled yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Schedule in-person campus tours or virtual counselling sessions with prospective
                  students and parents.
                </p>
                <Button
                  onClick={() => setIsScheduleOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Schedule First Visit
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow>
                  <TableHead className="w-12 text-[11px] font-bold text-muted-foreground uppercase text-center">
                    S.No
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Visit Date & Time
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Lead #
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Student Name
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Grade
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Guardian & Contact
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Visit Type
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Assigned Staff
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">
                    Status
                  </TableHead>
                  <TableHead className="w-16 text-[11px] font-bold text-muted-foreground uppercase text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visits.map((v, index) => {
                  const studentName =
                    v.leads?.student_first_name
                      ? `${v.leads.student_first_name} ${v.leads.student_last_name || ''}`.trim()
                      : 'Applicant';
                  const leadNumber = v.leads?.lead_number || 'N/A';
                  const gradeName =
                    v.leads?.academic_year_grades?.grades?.grade_name || 'Not assigned';
                  const guardianName = v.leads?.contact_name || 'N/A';
                  const guardianPhone = v.leads?.contact_phone;
                  const staffUser = v.staff?.users_staff_user_idTousers;
                  const staffName = staffUser
                    ? `${staffUser.first_name || ''} ${staffUser.last_name || ''}`.trim()
                    : v.staff?.employee_code || 'Unassigned';

                  const statusConf = STATUS_CONFIG[v.status] || STATUS_CONFIG.scheduled;
                  const StatusIcon = statusConf.icon;

                  const scheduledDate = new Date(v.scheduled_at);

                  return (
                    <TableRow key={v.visit_id} className="hover:bg-muted/30 transition-colors">
                      {/* S.No */}
                      <TableCell className="text-center font-mono text-xs text-muted-foreground font-semibold">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">
                            {scheduledDate.toLocaleDateString(undefined, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            {scheduledDate.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </TableCell>

                      {/* Lead # */}
                      <TableCell>
                        <button
                          onClick={() => {
                            setSelectedLeadId(v.lead_id);
                            setIsLeadDetailsOpen(true);
                          }}
                          className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline tracking-tight"
                        >
                          {leadNumber}
                        </button>
                      </TableCell>

                      {/* Student Name */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              setSelectedLeadId(v.lead_id);
                              setIsLeadDetailsOpen(true);
                            }}
                            className="text-xs font-bold text-foreground hover:text-indigo-600 transition-colors text-left"
                          >
                            {studentName}
                          </button>
                        </div>
                      </TableCell>

                      {/* Grade */}
                      <TableCell className="text-xs font-semibold text-foreground">
                        {gradeName}
                      </TableCell>

                      {/* Guardian & Contact */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">{guardianName}</p>
                          {guardianPhone && (
                            <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-foreground/80" />
                              {guardianPhone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Visit Type */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-bold gap-1 px-2.5 py-0.5 rounded-lg ${
                            v.visit_type === 'virtual'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {v.visit_type === 'virtual' ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          <span className="capitalize">
                            {v.visit_type === 'virtual' ? 'Virtual' : 'Campus Tour'}
                          </span>
                        </Badge>
                      </TableCell>

                      {/* Assigned Staff */}
                      <TableCell className="text-xs font-medium text-foreground">
                        {staffName}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-bold gap-1 px-2.5 py-0.5 rounded-lg border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusConf.label}</span>
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLeadId(v.lead_id);
                                setIsLeadDetailsOpen(true);
                              }}
                              className="gap-2 cursor-pointer font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                              View Lead Details
                            </DropdownMenuItem>

                            {v.meeting_link && (
                              <DropdownMenuItem
                                onClick={() => window.open(v.meeting_link!, '_blank')}
                                className="gap-2 cursor-pointer font-semibold text-indigo-600"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Join Virtual Meeting
                              </DropdownMenuItem>
                            )}

                            {v.status === 'scheduled' && (
                              <>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVisitForComplete(v);
                                    setIsCompleteOpen(true);
                                  }}
                                  className="gap-2 cursor-pointer font-semibold text-emerald-600"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Mark Completed
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVisitForReschedule(v);
                                    setIsRescheduleOpen(true);
                                  }}
                                  className="gap-2 cursor-pointer font-semibold text-amber-600"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Reschedule
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVisitForNoShow(v);
                                    setIsNoShowOpen(true);
                                  }}
                                  className="gap-2 cursor-pointer font-semibold text-slate-600 dark:text-slate-400"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Mark No-Show
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVisitForCancel(v);
                                    setIsCancelOpen(true);
                                  }}
                                  className="gap-2 cursor-pointer font-semibold text-red-600"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Cancel Visit
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleDeleteVisit(v)}
                              className="gap-2 cursor-pointer font-semibold text-red-600"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page <strong className="text-foreground">{page}</strong> of{' '}
              <strong className="text-foreground">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuery('page', String(page - 1))}
                disabled={page <= 1}
                className="h-8 rounded-xl text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuery('page', String(page + 1))}
                disabled={page >= totalPages}
                className="h-8 rounded-xl text-xs"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialog Modals */}
      <ScheduleVisitDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        onSuccess={() => refetch()}
      />

      <RescheduleVisitDialog
        visit={selectedVisitForReschedule}
        open={isRescheduleOpen}
        onOpenChange={setIsRescheduleOpen}
        onSuccess={() => {
          setSelectedVisitForReschedule(null);
          refetch();
        }}
      />

      <CompleteVisitDialog
        visit={selectedVisitForComplete}
        open={isCompleteOpen}
        onOpenChange={setIsCompleteOpen}
        onSuccess={() => {
          setSelectedVisitForComplete(null);
          refetch();
        }}
      />

      <CancelVisitDialog
        visit={selectedVisitForCancel}
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onSuccess={() => {
          setSelectedVisitForCancel(null);
          refetch();
        }}
      />

      <NoShowVisitDialog
        visit={selectedVisitForNoShow}
        open={isNoShowOpen}
        onOpenChange={setIsNoShowOpen}
        onSuccess={() => {
          setSelectedVisitForNoShow(null);
          refetch();
        }}
      />

      {/* Lead Details Drawer */}
      <LeadDetailsSheet
        leadId={selectedLeadId}
        open={isLeadDetailsOpen}
        onOpenChange={(open) => {
          setIsLeadDetailsOpen(open);
          if (!open) setSelectedLeadId(null);
        }}
        onLeadUpdated={() => refetch()}
      />
    </div>
  );
};

export default CampusVisitsPage;
