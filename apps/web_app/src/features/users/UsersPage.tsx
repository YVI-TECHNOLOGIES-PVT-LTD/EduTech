import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { UserPlus, Shield } from 'lucide-react';
import { useGetUsersQuery, UserRecord } from '@/shared/api/user.api';
import { EnterpriseDataTable } from '@/shared/components/data-table/EnterpriseDataTable';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/shared/components/status-chip/StatusChip';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { PERMISSIONS } from '@/shared/constants/permissions';

export const UsersPage: React.FC = () => {
  const { data: users, isLoading } = useGetUsersQuery();

  const dummyUsers: UserRecord[] = [
    {
      id: 'usr-1',
      email: 'admin@apexacademy.edu',
      firstName: 'Vikram',
      lastName: 'Aditya',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-01-15',
    },
    {
      id: 'usr-2',
      email: 'admissions@apexacademy.edu',
      firstName: 'Ananya',
      lastName: 'Roy',
      role: 'ADMISSION_OFFICER',
      status: 'ACTIVE',
      createdAt: '2026-02-01',
    },
    {
      id: 'usr-3',
      email: 'finance@apexacademy.edu',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'FINANCE_OFFICER',
      status: 'ACTIVE',
      createdAt: '2026-02-10',
    },
  ];

  const tableData = users && users.length > 0 ? users : dummyUsers;

  const columns: ColumnDef<UserRecord>[] = [
    {
      accessorKey: 'name',
      header: 'User Name',
      cell: ({ row }: { row: { original: UserRecord } }) => (
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
            {row.original.firstName[0]}
            {row.original.lastName[0]}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              {row.original.firstName} {row.original.lastName}
            </span>
            <p className="text-[11px] text-slate-400">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Assigned Role',
      cell: ({ row }: { row: { original: UserRecord } }) => (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          <Shield size={12} className="mr-1" />
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Account Status',
      cell: ({ row }: { row: { original: UserRecord } }) => (
        <StatusChip status={row.original.status} />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created On',
      cell: ({ row }: { row: { original: UserRecord } }) => (
        <span className="text-xs text-slate-500 font-medium">{row.original.createdAt}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Directory & Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative user accounts, roles, and access credentials
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.USER_WRITE}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
            <UserPlus size={14} className="mr-1.5" />
            Add New User
          </Button>
        </PermissionGuard>
      </div>

      <EnterpriseDataTable
        title="Active System Users"
        subtitle="Full list of platform users and administrative roles"
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        searchPlaceholder="Search users by name or email..."
      />
    </div>
  );
};

export default UsersPage;
