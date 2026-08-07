import React, { useState } from 'react';
import { ShieldCheck, Save, Check, X } from 'lucide-react';
import { PERMISSION_GROUPS } from '@/shared/registry/permissions';
import { ROLES } from '@/shared/constants/roles';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const RolesPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.ADMISSION_OFFICER);
  const [isSaving, setIsSaving] = useState(false);

  const rolesList = [
    {
      code: ROLES.SUPER_ADMIN,
      label: 'Super Administrator',
      desc: 'Full unrestricted system access',
    },
    {
      code: ROLES.ORG_ADMIN,
      label: 'Organization Admin',
      desc: 'Full access within tenant campus',
    },
    {
      code: ROLES.ADMISSION_OFFICER,
      label: 'Admission Officer',
      desc: 'Manages lead pipeline & applications',
    },
    { code: ROLES.COUNSELLOR, label: 'Counsellor', desc: 'Manages inquiries and campus visits' },
    {
      code: ROLES.FINANCE_OFFICER,
      label: 'Finance Officer',
      desc: 'Processes fee collections and payments',
    },
  ];

  const handleSaveMatrix = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(`Permissions matrix updated for ${selectedRole}`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Role & Permission Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure granular RBAC permissions across system role profiles
          </p>
        </div>

        <Button
          onClick={handleSaveMatrix}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <Save size={14} className="mr-1.5" />
          Save Matrix Changes
        </Button>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {rolesList.map((r) => (
          <button
            key={r.code}
            onClick={() => setSelectedRole(r.code)}
            className={`flex flex-col items-start rounded-lg border px-4 py-2 text-left transition-all ${
              selectedRole === r.code
                ? 'border-blue-600 bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <span className="text-xs font-bold">{r.label}</span>
            <span className="text-[10px] text-slate-400">{r.desc}</span>
          </button>
        ))}
      </div>

      {/* Permission Groups Matrix */}
      <div className="space-y-6">
        {PERMISSION_GROUPS.map((group) => (
          <div
            key={group.groupName}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
              {group.groupName}
            </h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.permissions.map((perm) => (
                <label
                  key={perm.code}
                  className="flex items-start space-x-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {perm.label}
                    </span>
                    <p className="text-[11px] text-slate-400">{perm.description}</p>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
                      {perm.code}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesPage;
