import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  RotateCcw,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Printer,
  Copy,
  ArrowUpDown,
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
import { toast } from '@/components/ui/use-toast';
import { useTableSelection } from '@/hooks/useTableSelection';
import { useGetApplicationsQuery, ApplicationItem } from '@/shared/api/admission.api';
import { useGetGradesQuery, useGetAcademicYearsQuery } from '@/shared/api/academic.api';
import { PaymentStatusBadge } from '../../components/fee/PaymentStatusBadge';
import { CollectAdmissionFeeDialog } from '../../components/fee/CollectAdmissionFeeDialog';
import { AdmissionFeeReceiptDialog } from '../../components/fee/AdmissionFeeReceiptDialog';
import { ApplicationDetailsSheet } from '../../components/application/ApplicationDetailsSheet';
import { cn } from '@/lib/utils';

export const FeeCollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven query state
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const searchText = searchParams.get('searchText') || '';
  const paymentStatusFilter = searchParams.get('payment_status') || 'ALL';
  const gradeFilter = searchParams.get('grade_id') || 'ALL';
  const academicYearFilter = searchParams.get('academic_year_id') || 'ALL';
  const paymentModeFilter = searchParams.get('payment_mode') || 'ALL';
  const sort = searchParams.get('sort') || 'created_at';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

  // Search input state
  const [searchInput, setSearchInput] = useState(searchText);

  // Dialog States
  const [selectedAppForPayment, setSelectedAppForPayment] = useState<ApplicationItem | null>(null);
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [selectedAppForReceipt, setSelectedAppForReceipt] = useState<ApplicationItem | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<ApplicationItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Reference Queries
  const { data: gradesData = [] } = useGetGradesQuery();
  const { data: academicYearsData = [] } = useGetAcademicYearsQuery();

  // Query Params
  const queryParams = useMemo(() => {
    return {
      page,
      pageSize,
      searchText: searchText.trim() || undefined,
      payment_status: paymentStatusFilter !== 'ALL' ? (paymentStatusFilter as any) : undefined,
      payment_mode: paymentModeFilter !== 'ALL' ? (paymentModeFilter as any) : undefined,
      grade_id: gradeFilter !== 'ALL' ? gradeFilter : undefined,
      academic_year_id: academicYearFilter !== 'ALL' ? academicYearFilter : undefined,
      sort,
      order,
    };
  }, [
    page,
    pageSize,
    searchText,
    paymentStatusFilter,
    paymentModeFilter,
    gradeFilter,
    academicYearFilter,
    sort,
    order,
  ]);

  const {
    data: applicationsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetApplicationsQuery(queryParams);

  const applications: ApplicationItem[] = applicationsResponse?.data || [];
  const meta = applicationsResponse?.meta || {
    total: applicationsResponse?.total || applications.length,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil((applicationsResponse?.total || applications.length) / pageSize) || 1,
  };

  // Table selection hook
  const {
    selectedIds,
    selectedCount,
    toggleRow,
    toggleSelectAll,
    isSelected,
    isAllSelected,
    isSomeSelected,
    clearSelection,
  } = useTableSelection(
    applications,
    (item: ApplicationItem) => item.application_id || item.id || '',
  );

  // Calculate Operational KPIs
  const kpis = useMemo(() => {
    const totalCount = meta.total || 0;
    let pendingCount = 0;
    let paidCount = 0;
    let actionRequiredCount = 0;

    // Derived from current page items and totals
    applications.forEach((app) => {
      const pStatus = (app.payment?.payment_status || 'pending').toLowerCase();
      if (pStatus === 'paid') {
        paidCount++;
      } else if (pStatus === 'pending') {
        pendingCount++;
      } else {
        actionRequiredCount++;
      }
    });

    return {
      total: totalCount,
      pending: pendingCount,
      paid: paidCount,
      actionRequired: actionRequiredCount,
    };
  }, [meta.total, applications]);

  // Update URL Search Params
  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'ALL') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      next.set('page', '1'); // Reset to page 1 on filter change
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('searchText', searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams({ page: '1', pageSize: String(pageSize) }));
  };

  const handleOpenCollect = (app: ApplicationItem) => {
    setSelectedAppForPayment(app);
    setIsCollectOpen(true);
  };

  const handleOpenReceipt = (app: ApplicationItem) => {
    setSelectedAppForReceipt(app);
    setIsReceiptOpen(true);
  };

  const handleOpenDetails = (app: ApplicationItem) => {
    setSelectedAppForDetails(app);
    setIsDetailsOpen(true);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const renderPaymentModeIcon = (mode?: string | null) => {
    const m = (mode || 'cash').toLowerCase();
    switch (m) {
      case 'bank_transfer':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            <Building2 className="w-3 h-3 text-blue-600" />
            Bank Transfer
          </span>
        );
      case 'card':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
            <CreditCard className="w-3 h-3 text-purple-600" />
            Card
          </span>
        );
      case 'upi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            <QrCode className="w-3 h-3 text-amber-600" />
            UPI
          </span>
        );
      case 'cash':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <Banknote className="w-3 h-3 text-emerald-600" />
            Cash
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Front Office Fee Collection
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Collect and manage admission application fees.
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            <span>Refresh Queue</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="h-10 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </Button>
        </div>
      </div>

      {/* 4 Operational KPI Cards (Matching Leads/Applications/Verification Standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Demands */}
        <Card className="min-h-[92px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Demands
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {isLoading ? '—' : kpis.total}
            </div>
            <span className="text-[10px] text-slate-400 block">Total fee records</span>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </Card>

        {/* Pending Collection */}
        <Card className="min-h-[92px] p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Collection
            </span>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-100 font-mono">
              {isLoading ? '—' : kpis.pending}
            </div>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block">
              Awaiting fee settlement
            </span>
          </div>
          <div className="p-3 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        {/* Paid / Settled */}
        <Card className="min-h-[92px] p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Paid / Settled
            </span>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
              {isLoading ? '—' : kpis.paid}
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">
              Receipts issued
            </span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        {/* Action Required */}
        <Card className="min-h-[92px] p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Action Required
            </span>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-100 font-mono">
              {isLoading ? '—' : kpis.actionRequired}
            </div>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block">
              Partial / waived / failed
            </span>
          </div>
          <div className="p-3 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <AlertCircle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar (Uniform h-10 Controls) */}
      <Card className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-4 relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <Input
              placeholder="Search application, student, lead #, guardian, phone, email, reference..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 text-xs h-10"
            />
          </form>

          {/* Payment Status Filter */}
          <div className="lg:col-span-2">
            <Select
              value={paymentStatusFilter}
              onValueChange={(val) => updateFilter('payment_status', val)}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div className="lg:col-span-2">
            <Select
              value={paymentModeFilter}
              onValueChange={(val) => updateFilter('payment_mode', val)}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grade Filter */}
          <div className="lg:col-span-2">
            <Select value={gradeFilter} onValueChange={(val) => updateFilter('grade_id', val)}>
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Grades</SelectItem>
                {gradesData.map((grade: any) => (
                  <SelectItem key={grade.grade_id || grade.id} value={grade.grade_id || grade.id}>
                    {grade.grade_name || grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Academic Year Filter */}
          <div className="lg:col-span-2">
            <Select
              value={academicYearFilter}
              onValueChange={(val) => updateFilter('academic_year_id', val)}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Academic Years</SelectItem>
                {academicYearsData.map((ay: any) => (
                  <SelectItem
                    key={ay.academic_year_id || ay.id}
                    value={ay.academic_year_id || ay.id}
                  >
                    {ay.academic_year_name || ay.name || ay.year_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected count action bar if items checked */}
        {selectedCount > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-600">
                {selectedCount} application{selectedCount > 1 ? 's' : ''} selected
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="text-xs h-7 text-slate-500"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </Card>

      {/* Error state */}
      {error && !isLoading && (
        <Card className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Failed to load fee records
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            An error occurred while loading the fee collection queue. Please try again.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="text-xs h-8 mt-2"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Production-Grade Fee Data Table */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1300px] border-collapse">
            <TableHeader className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800">
                <TableHead className="w-12 px-3 text-center">
                  <Checkbox
                    checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-14 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  S.NO
                </TableHead>
                <TableHead className="min-w-[130px] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Application #
                </TableHead>
                <TableHead className="min-w-[180px] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Applicant
                </TableHead>
                <TableHead className="min-w-[110px] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Grade
                </TableHead>
                <TableHead className="min-w-[120px] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Academic Year
                </TableHead>
                <TableHead className="min-w-[110px] text-right text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Fee Amount
                </TableHead>
                <TableHead className="min-w-[120px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Payment Status
                </TableHead>
                <TableHead className="min-w-[110px] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Payment Date
                </TableHead>
                <TableHead className="min-w-[130px] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Payment Method
                </TableHead>
                <TableHead className="min-w-[140px] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Transaction Ref
                </TableHead>
                <TableHead className="min-w-[100px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Receipt
                </TableHead>
                <TableHead className="min-w-[130px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow
                    key={idx}
                    className="animate-pulse divide-x divide-slate-100 dark:divide-slate-800"
                  >
                    <TableCell colSpan={13} className="py-4 px-4 text-center">
                      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        No Admission Fee Records Found
                      </div>
                      <p className="text-xs text-slate-400">
                        {searchText || paymentStatusFilter !== 'ALL' || gradeFilter !== 'ALL'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'No admission applications currently require front office fee collection.'}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResetFilters}
                        className="text-xs h-8 mt-2"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app, index) => {
                  const appId = app.application_id || app.id;
                  const itemSelected = isSelected(appId);
                  const serialNo = (page - 1) * pageSize + index + 1;

                  const lead = app.lead;
                  const studentName =
                    app.student_name ||
                    lead?.student_name ||
                    [lead?.student_first_name, lead?.student_last_name].filter(Boolean).join(' ') ||
                    'Applicant';
                  const appNumber = app.application_number || 'APP-PENDING';
                  const gradeName = app.grade_name || lead?.grade_name || '—';
                  const academicYearName = app.academic_year?.academic_year_name || '—';

                  const payment = app.payment;
                  const pStatus = (payment?.payment_status || 'pending').toLowerCase();
                  const isPaid = pStatus === 'paid';
                  const amount = payment?.amount ?? 1200; // Standard 1000 + 200 default
                  const paymentDate = payment?.payment_date
                    ? new Date(payment.payment_date).toLocaleDateString('en-IN')
                    : '—';
                  const txnRef = payment?.transaction_reference || '—';

                  return (
                    <TableRow
                      key={appId}
                      className={cn(
                        'divide-x divide-slate-200 dark:divide-slate-800 transition-colors',
                        itemSelected
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell className="px-3 text-center">
                        <Checkbox
                          checked={itemSelected}
                          onCheckedChange={() => toggleRow(appId)}
                          aria-label={`Select ${studentName}`}
                        />
                      </TableCell>

                      {/* S.NO */}
                      <TableCell className="text-center font-mono text-xs text-slate-500 font-medium">
                        {serialNo}
                      </TableCell>

                      {/* Application # */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(app)}
                          className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {appNumber}
                        </button>
                      </TableCell>

                      {/* Applicant */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {studentName}
                          </div>
                          {(lead?.contact_phone || lead?.contact_email) && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {lead.contact_phone || lead.contact_email}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Grade */}
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {gradeName}
                      </TableCell>

                      {/* Academic Year */}
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {academicYearName}
                      </TableCell>

                      {/* Fee Amount */}
                      <TableCell className="text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                        ₹{amount.toLocaleString('en-IN')}
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell className="text-center">
                        <PaymentStatusBadge status={pStatus} />
                      </TableCell>

                      {/* Payment Date */}
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {paymentDate}
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell>
                        {isPaid || payment?.payment_mode ? (
                          renderPaymentModeIcon(payment?.payment_mode)
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Transaction Ref */}
                      <TableCell>
                        {txnRef !== '—' ? (
                          <div className="flex items-center gap-1">
                            <span
                              className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[100px]"
                              title={txnRef}
                            >
                              {txnRef}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(txnRef, 'Transaction Reference')}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Receipt */}
                      <TableCell className="text-center">
                        {isPaid ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenReceipt(app)}
                            className="h-7 px-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                            title="View / Print Official Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pending</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenCollect(app)}
                              className="h-7 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Collect Fee</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetails(app)}
                              className="h-7 px-2.5 text-xs font-medium gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Details</span>
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

        {/* Server-side Pagination Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={(val) => updateFilter('pageSize', val)}>
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>
              Showing {meta.total === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, meta.total)} of {meta.total} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilter('page', String(page - 1))}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Button>

            <span className="font-semibold text-slate-700 dark:text-slate-300 px-2">
              Page {page} of {meta.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => updateFilter('page', String(page + 1))}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Collect Fee Modal */}
      <CollectAdmissionFeeDialog
        open={isCollectOpen}
        onOpenChange={setIsCollectOpen}
        application={selectedAppForPayment}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Admission Fee Receipt Modal */}
      <AdmissionFeeReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        application={selectedAppForReceipt}
      />

      {/* Application Details Sheet */}
      <ApplicationDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        application={selectedAppForDetails}
      />
    </div>
  );
};

export default FeeCollectionPage;
