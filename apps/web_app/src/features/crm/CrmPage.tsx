import React, { useState } from 'react';
import { Target, Calendar } from 'lucide-react';
import { LeadsListTab } from './components/LeadsListTab';
import { CampusVisitsTab } from './components/CampusVisitsTab';
import { cn } from '@/lib/utils';

export const CrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'visits'>('leads');

  const tabs = [
    { id: 'leads', label: 'Leads Pipeline', icon: Target },
    { id: 'visits', label: 'Campus Visits Schedule', icon: Calendar },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          CRM & Lead Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Capture prospective student inquiries, log counselling activities, and schedule campus
          visits
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
        {activeTab === 'leads' && <LeadsListTab />}
        {activeTab === 'visits' && <CampusVisitsTab />}
      </div>
    </div>
  );
};

export default CrmPage;
