import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Briefcase, Plus } from 'lucide-react';
import { useGetDesignationsQuery, DesignationRecord } from '@/shared/api/staff.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { Button } from '@/components/ui/button';

export const DesignationsTab: React.FC = () => {
  const { data: designations, isLoading } = useGetDesignationsQuery();

  const dummyDesignations: DesignationRecord[] = [
    { id: 'desig-1', title: 'Principal / Head of Institution', code: 'PRIN' },
    { id: 'desig-2', title: 'Vice Principal', code: 'VPRIN' },
    { id: 'desig-3', title: 'Senior Admissions Officer', code: 'SR_ADM' },
    { id: 'desig-4', title: 'Academic Counsellor', code: 'COUNS' },
    { id: 'desig-5', title: 'Senior Accountant', code: 'ACCT' },
  ];

  const tableData = designations && designations.length > 0 ? designations : dummyDesignations;

  const columns: ColumnDef<DesignationRecord>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }: { row: { original: DesignationRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Designation Title',
      cell: ({ row }: { row: { original: DesignationRecord } }) => (
        <span className="font-bold text-slate-900 dark:text-white">{row.original.title}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Add Designation
        </Button>
      </div>

      <EnterpriseDataTable
        title="Job Designations"
        subtitle="Catalog of organizational job titles and roles"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
      />
    </div>
  );
};
