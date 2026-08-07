/**
 * EduTrack ERP — Isolated Parent Portal
 * Dedicated parent self-service portal displaying strictly the 6 allowed sections:
 * Dashboard, Applications, Documents, My Child, Notifications, Profile.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import {
  CapabilityEngine,
  UserCapabilityContext,
  TASK_DRIVEN_PARENT_WIDGETS,
} from '@edutrack/types';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  GraduationCap,
  Bell,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Download,
} from 'lucide-react';
import { ICON_MAP } from '../config/menu_registry';

export function ParentPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'applications' | 'documents' | 'my-child' | 'notifications' | 'profile'
  >('dashboard');

  const capabilityContext: UserCapabilityContext = {
    permissions: user?.permissions || [],
    roles: user?.roles || [],
    isSuperAdmin: user?.roles?.includes('SUPER_ADMIN'),
  };

  // Live parent overview query
  const { data: parentData, isLoading: isParentDataLoading } = useQuery({
    queryKey: ['parentOverview'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/parent/overview');
      return res.data;
    },
    staleTime: 30000,
    retry: 1,
  });

  const visibleWidgets = TASK_DRIVEN_PARENT_WIDGETS.filter((w) =>
    CapabilityEngine.canRenderWidget(w, capabilityContext),
  ).map((w) => {
    let count = w.defaultMetric?.count || 0;
    if (parentData) {
      if (w.id.includes('app')) count = parentData.admissions?.length || 0;
      else if (w.id.includes('child')) count = parentData.children?.length || 0;
    }
    return {
      ...w,
      defaultMetric: {
        ...w.defaultMetric,
        count,
      },
    };
  });

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Parent Portal Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Parent Self-Service Portal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Parent Portal</h1>
            <p className="text-indigo-200 text-sm mt-1 max-w-2xl">
              Track admission application status, submit required verification documents, view your
              child's profile, and receive real-time updates.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right">
            <p className="text-xs text-indigo-300 font-medium">Logged in as</p>
            <p className="text-sm font-bold text-white">{user?.full_name || user?.email}</p>
          </div>
        </div>

        {/* 6 Isolated Parent Portal Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 border-t border-white/10 pt-4 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'applications', label: 'Applications', icon: FileText },
            { id: 'documents', label: 'Documents', icon: ShieldCheck },
            { id: 'my-child', label: 'My Child', icon: GraduationCap },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'profile', label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-indigo-950 shadow-lg'
                    : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleWidgets.map((widget) => {
              const IconComponent = ICON_MAP[widget.icon || 'FileText'] || FileText;
              return (
                <div
                  key={widget.id}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{widget.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{widget.description}</p>
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        {widget.defaultMetric?.label}
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {widget.defaultMetric?.count}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (widget.category === 'parent') {
                        if (widget.id.includes('app')) setActiveTab('applications');
                        else if (widget.id.includes('doc')) setActiveTab('documents');
                        else if (widget.id.includes('child')) setActiveTab('my-child');
                      } else {
                        navigate(widget.actionRoute);
                      }
                    }}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
                  >
                    {widget.actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Submitted Applications</h2>
              <p className="text-xs text-slate-500">
                View evaluation stage, document audit status, and fee clearance.
              </p>
            </div>
            <button
              onClick={() => navigate('/admissions/apply')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              + Submit New Application
            </button>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Application #APP-2026-0891</h4>
                <p className="text-xs text-slate-500">Grade 1 • Academic Year 2026-2027</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Under Document Review
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">Document Upload Center</h2>
            <p className="text-xs text-slate-500">
              Upload birth certificates, immunization records, and prior school transcripts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Birth Certificate', status: 'Verified', color: 'emerald' },
              { name: 'Prior School Marksheet', status: 'Pending Verification', color: 'amber' },
              { name: 'Immunization Record', status: 'Not Uploaded', color: 'slate' },
              { name: 'Passport Size Photo', status: 'Verified', color: 'emerald' },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.status}</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs transition-colors">
                  Upload File
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'my-child' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">My Child Overview</h2>
            <p className="text-xs text-slate-500">
              View enrolled student profiles linked to your guardian account.
            </p>
          </div>
          <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl">
              C
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Candidate Profile</h3>
              <p className="text-xs text-slate-600 mt-1">
                Application ID: APP-2026-0891 • Assigned Counselor: Front Office Desk
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  Grade 1
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  Eligible
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">Portal Notifications</h2>
            <p className="text-xs text-slate-500">
              Official updates regarding admission schedules and document verifications.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <Bell className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 text-sm">Application Received</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Your application APP-2026-0891 has been successfully logged into the desk.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">Guardian Profile</h2>
            <p className="text-xs text-slate-500">Your account details and contact preferences.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 font-medium">Name</p>
              <p className="text-sm font-bold text-slate-900">{user?.full_name || 'Parent User'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 font-medium">Email</p>
              <p className="text-sm font-bold text-slate-900">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
