import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserMinus,
  Briefcase,
  Building,
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  Layers,
  ArrowRight,
  PlusCircle,
  FileText,
} from 'lucide-react';
import {
  useGetStaffListQuery,
  useGetDepartmentsQuery,
  useGetDesignationsQuery,
  StaffRecord,
} from '@/shared/api/staff.api';
import {
  DashboardPageHeader,
  DashboardKpiCard,
  DashboardSection,
  DashboardChartCard,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardQuickActions,
  QuickActionItem,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from 'recharts';

export interface StaffHrDashboardProps {
  customTabs?: React.ReactNode;
}

export const StaffHrDashboard: React.FC<StaffHrDashboardProps> = ({ customTabs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');

  const {
    data: staffList = [],
    isLoading: isStaffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useGetStaffListQuery();

  const {
    data: departments = [],
    isLoading: isDeptLoading,
    refetch: refetchDepts,
  } = useGetDepartmentsQuery();

  const {
    data: designations = [],
    isLoading: isDesigLoading,
    refetch: refetchDesigs,
  } = useGetDesignationsQuery();

  const handleRefresh = () => {
    refetchStaff();
    refetchDepts();
    refetchDesigs();
  };

  const isLoading = isStaffLoading || isDeptLoading || isDesigLoading;

  // Filtered staff records
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const name = (s.name || `${s.firstName} ${s.lastName}`).toLowerCase();
      const email = (s.email || '').toLowerCase();
      const code = (s.employeeId || s.employee_code || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();

      const matchesSearch =
        !searchTerm ||
        name.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        code.includes(searchTerm.toLowerCase());

      const matchesDept =
        selectedDepartment === 'ALL' ||
        dept === selectedDepartment.toLowerCase() ||
        s.department === selectedDepartment;

      return matchesSearch && matchesDept;
    });
  }, [staffList, searchTerm, selectedDepartment]);

  // Aggregate Department Breakdown
  const deptChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    staffList.forEach((s) => {
      const dept = s.department || 'General Administration';
      counts[dept] = (counts[dept] || 0) + 1;
    });

    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      color: colors[idx % colors.length],
    }));
  }, [staffList]);

  // Status metrics
  const activeCount = useMemo(
    () => staffList.filter((s) => s.status === 'ACTIVE' || s.is_active !== false).length,
    [staffList],
  );
  const onLeaveCount = useMemo(
    () => staffList.filter((s) => s.status === 'ON_LEAVE').length,
    [staffList],
  );
  const offboardedCount = useMemo(
    () => staffList.filter((s) => s.status === 'OFFBOARDED' || s.is_active === false).length,
    [staffList],
  );

  const quickActions: QuickActionItem[] = [
    {
      title: 'Academic Faculty Directory',
      description: 'View teaching staff, subject specializations, and class assignments.',
      icon: GraduationCap,
      to: '/app/academic/faculty',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Faculty Workload Matrix',
      description: 'Audit instructional hours and period allocation per teacher.',
      icon: Briefcase,
      to: '/app/academic/faculty',
      iconBg: 'bg-sky-50 dark:bg-sky-950/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      title: 'School Operations Desk',
      description: 'Manage front office, admissions team, and attendance schedules.',
      icon: Building,
      to: '/app/front-office/dashboard',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title="HR & Staff Operations Dashboard"
        description="Comprehensive employee directories, department distributions, designation hierarchies, and operational workforce status."
        badge={{
          text: 'Human Resources & Workforce',
          variant: 'info',
          icon: Users,
        }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Staff
            </Button>
          </div>
        }
      />

      {customTabs && <div className="border-b border-border/60 pb-2">{customTabs}</div>}

      {/* Error State */}
      {staffError && (
        <DashboardErrorState
          title="Unable to Load Staff Directory"
          message="Could not retrieve workforce records. Please verify permissions or network connection."
          onRetry={handleRefresh}
        />
      )}

      {/* 2. KPI Metrics Grid */}
      <DashboardSection
        title="Workforce Overview"
        description="Live personnel metrics across all school departments and designations."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Total Employees"
            value={staffList.length}
            subtitle="Registered staff accounts"
            icon={Users}
            variant="primary"
            loading={isLoading}
          />
          <DashboardKpiCard
            title="Active Workforce"
            value={activeCount}
            subtitle="On duty and operational"
            icon={UserCheck}
            variant="success"
            loading={isLoading}
          />
          <DashboardKpiCard
            title="On Leave / Away"
            value={onLeaveCount}
            subtitle="Scheduled absence / leave"
            icon={UserMinus}
            variant="warning"
            loading={isLoading}
          />
          <DashboardKpiCard
            title="Departments"
            value={departments.length || deptChartData.length}
            subtitle="Organizational units"
            icon={Building}
            variant="purple"
            loading={isLoading}
          />
        </div>
      </DashboardSection>

      {/* 3. Analytics: Department and Designation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardChartCard
            title="Staff Allocation by Department"
            subtitle="Employee headcount distribution across academic and operational units"
            icon={Building}
            loading={isLoading}
            isEmpty={!deptChartData.length}
            minHeight={260}
          >
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      color: 'hsl(var(--card-foreground))',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {deptChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardChartCard>
        </div>

        <div>
          <DashboardChartCard
            title="Department Roster"
            subtitle="Operational divisions"
            icon={Layers}
            loading={isLoading}
            isEmpty={!deptChartData.length}
            minHeight={260}
          >
            <div className="space-y-3 py-1">
              {deptChartData.slice(0, 6).map((dept, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="font-semibold text-foreground truncate">{dept.name}</span>
                  </div>
                  <span className="font-bold text-muted-foreground shrink-0">
                    {dept.count} staff
                  </span>
                </div>
              ))}
            </div>
          </DashboardChartCard>
        </div>
      </div>

      {/* 4. Staff Directory & Search */}
      <DashboardSection
        title="Personnel Directory"
        description="Browse, search, and verify staff members, contact coordinates, and role assignments."
        action={
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
            </div>
          </div>
        }
      >
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          {filteredStaff.length === 0 ? (
            <DashboardEmptyState
              title="No Staff Records Found"
              message={
                searchTerm
                  ? `No employees match the search filter "${searchTerm}".`
                  : 'No staff profiles recorded in the organization directory.'
              }
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredStaff.slice(0, 10).map((staff, idx) => {
                    const fullName =
                      staff.name ||
                      staff.staff_name ||
                      `${staff.firstName || staff.first_name || ''} ${staff.lastName || staff.last_name || ''}`.trim() ||
                      'Staff Member';
                    const isStaffActive = staff.status === 'ACTIVE' || staff.is_active !== false;

                    return (
                      <tr key={staff.id || idx} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground text-xs">{fullName}</div>
                          <div className="text-[11px] text-muted-foreground">{staff.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {staff.employeeId || staff.employee_code || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] rounded-md font-semibold">
                            {staff.department || 'General'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-medium">
                          {staff.designation || 'Staff'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              staff.status === 'ON_LEAVE'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200'
                                : isStaffActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {staff.status || (isStaffActive ? 'ACTIVE' : 'INACTIVE')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {staff.phone ? (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {staff.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardSection>

      {/* 5. Strategic Quick Actions */}
      <DashboardSection
        title="Personnel & Academic Management"
        description="Quick shortcuts for faculty assignments, scheduling, and front office workflows."
      >
        <DashboardQuickActions actions={quickActions} columns={3} />
      </DashboardSection>
    </div>
  );
};

export default StaffHrDashboard;
