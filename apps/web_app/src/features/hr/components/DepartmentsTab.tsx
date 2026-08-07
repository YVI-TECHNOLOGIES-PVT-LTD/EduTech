import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Building2, Plus, Users } from 'lucide-react';
import { useGetDepartmentsQuery, DepartmentRecord } from '@/shared/api/staff.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { Button } from '@/components/ui/button';

export const DepartmentsTab: React.FC = () => {
  const { data: departments, isLoading } = useGetDepartmentsQuery();

  const dummyDepts: DepartmentRecord[] = [
    {
      id: 'dept-1',
      name: 'Academic Affairs',
      code: 'ACAD',
      description: 'Faculty and academic course management',
      staffCount: 24,
    },
    {
      id: 'dept-2',
      name: 'Admissions & Outreach',
      code: 'ADM',
      description: 'Student lead intake and counselling',
      staffCount: 8,
    },
    {
      id: 'dept-3',
      name: 'Finance & Accounts',
      code: 'FIN',
      description: 'Fee receipts and payroll processing',
      staffCount: 5,
    },
    {
      id: 'dept-4',
      name: 'Administration',
      code: 'ADMIN',
      description: 'General operations & facility management',
      staffCount: 12,
    },
  ];

  const tableData = departments && departments.length > 0 ? departments : dummyDepts;

  const columns: ColumnDef<DepartmentRecord>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }: { row: { original: DepartmentRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Department Name',
      cell: ({ row }: { row: { original: DepartmentRecord } }) => (
        <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: { row: { original: DepartmentRecord } }) => (
        <span className="text-xs text-slate-500">{row.original.description || '-'}</span>
      ),
    },
    {
      accessorKey: 'staffCount',
      header: 'Staff Count',
      cell: ({ row }: { row: { original: DepartmentRecord } }) => (
        <div className="flex items-center space-x-1 font-semibold text-slate-700 dark:text-slate-300">
          <Users size={14} className="text-slate-400" />
          <span>{row.original.staffCount}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Create Department
        </Button>
      </div>

      <EnterpriseDataTable
        title="Departments Hierarchy"
        subtitle="List of institutional departments and personnel counts"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
      />
    </div>
  );
};
