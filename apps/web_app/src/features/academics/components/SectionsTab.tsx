import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Users, Plus } from 'lucide-react';
import { useGetSectionsQuery, SectionRecord } from '@/shared/api/academic.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { Button } from '@/components/ui/button';

export const SectionsTab: React.FC = () => {
  const { data: sections, isLoading } = useGetSectionsQuery();

  const dummySections: SectionRecord[] = [
    { id: 'sec-1', name: 'Section A (Science Stream)', gradeId: 'GR-11', capacity: 40 },
    { id: 'sec-2', name: 'Section B (Commerce Stream)', gradeId: 'GR-11', capacity: 40 },
    { id: 'sec-3', name: 'Section A (General)', gradeId: 'GR-10', capacity: 35 },
  ];

  const tableData = sections && sections.length > 0 ? sections : dummySections;

  const columns: ColumnDef<SectionRecord>[] = [
    {
      accessorKey: 'gradeId',
      header: 'Grade',
      cell: ({ row }: { row: { original: SectionRecord } }) => (
        <span className="font-mono text-xs font-bold text-blue-600">{row.original.gradeId}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Section Name',
      cell: ({ row }: { row: { original: SectionRecord } }) => (
        <span className="font-bold text-slate-900 dark:text-white">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Student Capacity',
      cell: ({ row }: { row: { original: SectionRecord } }) => (
        <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Users size={14} className="text-slate-400" />
          <span>Max {row.original.capacity} Students</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Plus size={14} className="mr-1.5" />
          Add Section Allocation
        </Button>
      </div>

      <EnterpriseDataTable
        title="Class Sections Allocation"
        subtitle="Configure section divisions and classroom capacities"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
      />
    </div>
  );
};
