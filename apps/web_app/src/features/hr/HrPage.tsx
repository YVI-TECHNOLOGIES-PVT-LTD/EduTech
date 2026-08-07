import React, { useState } from 'react';
import { Briefcase, Building2, ShieldCheck } from 'lucide-react';
import { StaffDirectoryTab } from './components/StaffDirectoryTab';
import { DepartmentsTab } from './components/DepartmentsTab';
import { DesignationsTab } from './components/DesignationsTab';
import { cn } from '@/lib/utils';

export const HrPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'departments' | 'designations'>('staff');

  const tabs = [
    { id: 'staff', label: 'Staff Directory', icon: Briefcase },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'designations', label: 'Designations', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          HR & Staff Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage staff directory, department hierarchy, and job designations
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 border-b-2 px-1 pb-3 text-xs font-bold transition-all',
                isActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'staff' && <StaffDirectoryTab />}
        {activeTab === 'departments' && <DepartmentsTab />}
        {activeTab === 'designations' && <DesignationsTab />}
      </div>
    </div>
  );
};

export default HrPage;
