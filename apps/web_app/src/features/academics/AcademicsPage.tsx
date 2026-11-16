import React, { useState } from 'react';
import { Calendar, GraduationCap, Users } from 'lucide-react';
import { AcademicYearsTab } from './components/AcademicYearsTab';
import { GradesTab } from './components/GradesTab';
import { SectionsTab } from './components/SectionsTab';
import { cn } from '@/lib/utils';

export const AcademicsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'years' | 'grades' | 'sections'>('years');

  const tabs = [
    { id: 'years', label: 'Academic Years', icon: Calendar },
    { id: 'grades', label: 'Grades / Classes', icon: GraduationCap },
    { id: 'sections', label: 'Sections Allocation', icon: Users },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Academic Structure Setup
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure academic calendars, session years, grades, and section allocations
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
        {activeTab === 'years' && <AcademicYearsTab />}
        {activeTab === 'grades' && <GradesTab />}
        {activeTab === 'sections' && <SectionsTab />}
      </div>
    </div>
  );
};

export default AcademicsPage;
