import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useGetGradesQuery, GradeRecord } from '@/shared/api/academic.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { Button } from '@/components/ui/button';

export const GradesTab: React.FC = () => {
  const { data: grades, isLoading } = useGetGradesQuery();

  const dummyGrades: GradeRecord[] = [
    { id: 'grd-1', name: 'Grade 9 (Freshman)', code: 'GR-9', displayOrder: 1 },
    { id: 'grd-2', name: 'Grade 10 (Sophomore)', code: 'GR-10', displayOrder: 2 },
    { id: 'grd-3', name: 'Grade 11 (Junior)', code: 'GR-11', displayOrder: 3 },
    { id: 'grd-4', name: 'Grade 12 (Senior)', code: 'GR-12', displayOrder: 4 },
  ];

  const tableData = grades && grades.length > 0 ? grades : dummyGrades;

  const columns: ColumnDef<GradeRecord>[] = [
    {
      accessorKey: 'code',
      header: 'Grade Code',
      cell: ({ row }: { row: { original: GradeRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Grade / Class Name',
      cell: ({ row }: { row: { original: GradeRecord } }) => (
        <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'displayOrder',
      header: 'Display Sequence',
      cell: ({ row }: { row: { original: GradeRecord } }) => (
        <span className="text-xs text-slate-500 font-semibold">
          Sequence #{row.original.displayOrder}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Add Grade / Class
        </Button>
      </div>

      <EnterpriseDataTable
        title="Grades & Classes Catalog"
        subtitle="List of academic grades and educational levels"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
      />
    </div>
  );
};
