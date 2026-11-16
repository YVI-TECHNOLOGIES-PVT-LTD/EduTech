import React, { useState } from 'react';
import { Building2, Palette, Settings, ShieldCheck } from 'lucide-react';
import { useGetOrganizationProfileQuery } from '@/shared/api/organization.api';
import { OrganizationProfileTab } from './components/OrganizationProfileTab';
import { OrganizationBrandingTab } from './components/OrganizationBrandingTab';
import { OrganizationSettingsTab } from './components/OrganizationSettingsTab';
import { PageLoader } from '@/shared/loading/PageLoader';
import { cn } from '@/lib/utils';

export const OrganizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'settings'>('profile');
  const { data: profile, isLoading } = useGetOrganizationProfileQuery();

  if (isLoading) {
    return <PageLoader message="Loading Organization Profile..." />;
  }

  const tabs = [
    { id: 'profile', label: 'Organization Profile', icon: Building2 },
    { id: 'branding', label: 'Branding & Themes', icon: Palette },
    { id: 'settings', label: 'System Preferences', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Organization Settings & Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage tenant institution metadata, branding guidelines, and default preferences
        </p>
      </div>

      {/* Tabs Navigation */}
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

      {/* Tab Panels */}
      <div>
        {activeTab === 'profile' && <OrganizationProfileTab profile={profile} />}
        {activeTab === 'branding' && <OrganizationBrandingTab />}
        {activeTab === 'settings' && <OrganizationSettingsTab />}
      </div>
    </div>
  );
};

export default OrganizationPage;
