import React, { useState } from 'react';
import { UserCheck, Users, Sparkles } from 'lucide-react';
import { StudentDirectoryTab } from './components/StudentDirectoryTab';
import { ParentsDirectoryTab } from './components/ParentsDirectoryTab';
import { Stage1EnrollmentTab } from './components/Stage1EnrollmentTab';
import { cn } from '@/lib/utils';

export const StudentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'parents' | 'enrollment'>('directory');

  const tabs = [
    { id: 'directory', label: 'Student Directory', icon: UserCheck },
    { id: 'parents', label: 'Parents & Guardians', icon: Users },
    { id: 'enrollment', label: 'Stage-1 Enrollment Execution', icon: Sparkles },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Student & Parent Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Enrolled student directory, parent relationship linkage, and final Stage-1 enrollment
          execution
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
        {activeTab === 'directory' && <StudentDirectoryTab />}
        {activeTab === 'parents' && <ParentsDirectoryTab />}
        {activeTab === 'enrollment' && <Stage1EnrollmentTab />}
      </div>
    </div>
  );
};

export default StudentsPage;
