import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, FileSearch, CreditCard, UserCheck, PlusCircle } from 'lucide-react';
import { usePermission } from '@/shared/auth/usePermission';
import { PERMISSIONS } from '@/shared/constants/permissions';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/components/ui/button';

export const QuickActionsBar: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const actions = [
    {
      title: 'Add New Lead',
      description: 'Capture inbound lead inquiry',
      icon: UserPlus,
      permission: PERMISSIONS.LEAD_WRITE,
      path: ROUTES.APP.CRM.LEADS,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      title: 'Review Applications',
      description: 'Process admission decisions',
      icon: FileSearch,
      permission: PERMISSIONS.APPLICATION_READ,
      path: ROUTES.APP.ADMISSIONS.APPLICATIONS,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      title: 'Collect Fee Payment',
      description: 'Process admission fee receipt',
      icon: CreditCard,
      permission: PERMISSIONS.FEE_PAYMENT_COLLECT,
      path: ROUTES.APP.ADMISSIONS.FEES,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      title: 'Execute Enrollment',
      description: 'Finalize Stage-1 student creation',
      icon: UserCheck,
      permission: PERMISSIONS.STUDENT_ENROLL,
      path: ROUTES.APP.STUDENTS.ENROLLMENT,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Actions</h3>
      <p className="text-xs text-slate-500 mb-4">Shortcuts for core Stage-1 operations</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          if (!hasPermission(action.permission)) return null;
          const Icon = action.icon;

          return (
            <Button
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`flex h-auto flex-col items-start p-4 text-left shadow-sm transition-all hover:scale-[1.02] ${action.color}`}
            >
              <div className="flex items-center space-x-2">
                <Icon size={18} />
                <span className="text-xs font-bold">{action.title}</span>
              </div>
              <span className="mt-1 text-[11px] opacity-90 font-normal">{action.description}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
