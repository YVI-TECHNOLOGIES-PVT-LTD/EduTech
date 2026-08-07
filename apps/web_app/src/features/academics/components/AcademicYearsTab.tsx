import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useGetAcademicYearsQuery, AcademicYearRecord } from '@/shared/api/academic.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/shared/components/status-chip/StatusChip';

export const AcademicYearsTab: React.FC = () => {
  const { data: years, isLoading } = useGetAcademicYearsQuery();

  const dummyYears: AcademicYearRecord[] = [
    {
      id: 'ay-2026',
      name: '2026-2027 Academic Session',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      isCurrent: true,
      status: 'ACTIVE',
    },
    {
      id: 'ay-2025',
      name: '2025-2026 Academic Session',
      startDate: '2025-04-01',
      endDate: '2026-03-31',
      isCurrent: false,
      status: 'CLOSED',
    },
  ];

  const tableData = years && years.length > 0 ? years : dummyYears;

  const columns: ColumnDef<AcademicYearRecord>[] = [
    {
      accessorKey: 'name',
      header: 'Academic Session Name',
      cell: ({ row }: { row: { original: AcademicYearRecord } }) => (
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
          {row.original.isCurrent && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 size={10} className="mr-1" />
              Active Session
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }: { row: { original: AcademicYearRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.startDate}</span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }: { row: { original: AcademicYearRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.endDate}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Session Status',
      cell: ({ row }: { row: { original: AcademicYearRecord } }) => (
        <StatusChip status={row.original.status} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Create Academic Session
        </Button>
      </div>

      <EnterpriseDataTable
        title="Academic Years / Sessions"
        subtitle="Configure institutional academic calendars and session years"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
      />
    </div>
  );
};
