/**
 * EduTrack ERP — School Operations Workspace
 * Unified internal application for all staff members in Stage-1.
 * Capability-based visibility determines accessible views (Dashboard, Admissions, People, School, Settings).
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import {
  CapabilityEngine,
  UserCapabilityContext,
  TASK_DRIVEN_WORKSPACE_WIDGETS,
  SYSTEM_QUICK_ACTIONS,
  DashboardWidget,
  QuickActionItem,
} from '@edutrack/types';
import {
  LayoutDashboard,
  Users,
  Building,
  Settings,
  GraduationCap,
  FileText,
  ShieldCheck,
  Coins,
  Clock,
  MessageSquare,
  BookOpen,
  UserPlus,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Activity,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import { ICON_MAP } from '../config/menu_registry';

export function SchoolOperationsWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'admissions' | 'people' | 'school' | 'settings'
  >('dashboard');

  const capabilityContext: UserCapabilityContext = {
    permissions: user?.permissions || [],
    roles: user?.roles || [],
    isSuperAdmin: user?.roles?.includes('SUPER_ADMIN'),
  };

  // Live operational inbox metrics query
  const {
    data: adminOverview,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['adminDashboardOverview'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/admin/overview');
      return res.data;
    },
    staleTime: 30000,
    retry: 2,
  });

  // Dynamic live metric mapping for operational inbox widgets
  const visibleWidgets = TASK_DRIVEN_WORKSPACE_WIDGETS.filter((w) =>
    CapabilityEngine.canRenderWidget(w, capabilityContext),
  ).map((w) => {
    let count = w.defaultMetric?.count || 0;
    if (adminOverview) {
      if (w.category === 'applications') count = adminOverview.pendingAdmissions || 0;
      else if (w.category === 'enrollment') count = adminOverview.students || 0;
      else if (w.category === 'payments')
        count = adminOverview.feeCollection ? Math.round(adminOverview.feeCollection / 1000) : 15;
    }
    return {
      ...w,
      defaultMetric: {
        ...w.defaultMetric,
        count,
      },
    };
  });

  // Filter quick actions deterministically via CapabilityEngine
  const visibleQuickActions = SYSTEM_QUICK_ACTIONS.filter((qa) =>
    CapabilityEngine.canRenderQuickAction(qa, capabilityContext),
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Stage-1 Unified Foundation
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">School Operations Workspace</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Consolidated operational desk for staff. Capabilities dictate granular access to
              Admissions, People Directory, School Structure, and Settings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right">
              <p className="text-xs text-slate-400 font-medium">Persona</p>
              <p className="text-sm font-bold text-emerald-400">
                {user?.roles?.includes('SUPER_ADMIN') ? 'Super Admin' : 'Front Office'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Module Tabs */}
        <div className="flex items-center gap-2 mt-8 border-t border-white/10 pt-4 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            {
              id: 'admissions',
              label: 'Admissions',
              icon: FileText,
              permission: 'admission.review',
            },
            { id: 'people', label: 'People', icon: Users, permission: 'STUDENT_VIEW' },
            { id: 'school', label: 'School', icon: Building, permission: 'ACADEMIC_SETUP' },
            {
              id: 'settings',
              label: 'Settings',
              icon: Settings,
              permission: 'admin.dashboard.view',
            },
          ].map((tab) => {
            if (
              tab.permission &&
              !CapabilityEngine.hasPermission(capabilityContext.permissions, tab.permission) &&
              !capabilityContext.isSuperAdmin
            ) {
              return null;
            }
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Quick Actions Panel */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Quick Actions
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Permission-Driven
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {visibleQuickActions.map((action) => {
                const IconComponent = ICON_MAP[action.icon] || LayoutDashboard;
                return (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.targetRoute)}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {action.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task-Driven Work Queues (Zero Dead Widgets) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Task-Driven Work Queues</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every card opens an actionable queue. Zero statistics-only widgets.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleWidgets.map((widget) => {
                const IconComponent = ICON_MAP[widget.icon || 'FileText'] || FileText;
                return (
                  <div
                    key={widget.id}
                    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        {widget.defaultMetric?.urgentCount && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {widget.defaultMetric.urgentCount} Urgent
                          </span>
                        )}
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
                      onClick={() => navigate(widget.actionRoute)}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs transition-colors group"
                    >
                      {widget.actionLabel}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admissions Module Tab */}
      {activeTab === 'admissions' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Admissions Desk</h2>
              <p className="text-xs text-slate-500">
                Manage inquiries, application processing, documents, entrance exams, fees, and
                enrollment.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/admissions/wizard')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              + New Application Form
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Inquiries & Leads',
                route: '/app/admissions/inquiries',
                icon: MessageSquare,
                desc: 'Manage incoming walk-ins and web inquiries.',
              },
              {
                title: 'Application Review',
                route: '/app/admissions/dashboard',
                icon: FileText,
                desc: 'Audit submitted forms and candidate files.',
              },
              {
                title: 'Document Verification',
                route: '/app/admissions/verification',
                icon: ShieldCheck,
                desc: 'Verify certificates and compliance documents.',
              },
              {
                title: 'Entrance Exams',
                route: '/app/admissions/exams',
                icon: BookOpen,
                desc: 'Schedule and record test scores.',
              },
              {
                title: 'Fee Collection',
                route: '/app/admissions/fees',
                icon: Coins,
                desc: 'Process deposit payments and print receipts.',
              },
              {
                title: 'Enrollment Desk',
                route: '/app/admissions/enrollment',
                icon: GraduationCap,
                desc: 'Complete SIS registration & sectioning.',
              },
            ].map((card, idx) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-50/50 transition-colors"
                >
                  <CardIcon className="w-8 h-8 text-indigo-600 mb-3" />
                  <h3 className="font-bold text-slate-900 text-base">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">{card.desc}</p>
                  <button
                    onClick={() => navigate(card.route)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Open Desk <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* People Directory Tab */}
      {activeTab === 'people' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">People Directory</h2>
            <p className="text-xs text-slate-500">
              Access student profiles, parent/guardian records, and staff directory.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <GraduationCap className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-slate-900">Student Directory</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                View enrolled students, section assignments, and academic status.
              </p>
              <button
                onClick={() => navigate('/app/people/students')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                View Students <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <Users className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-slate-900">Parent Directory</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Manage guardian profiles, contact details, and linked wards.
              </p>
              <button
                onClick={() => navigate('/app/people/parents')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                View Parents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <Briefcase className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-slate-900">Staff Directory</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                View operational staff members, departments, and roles.
              </p>
              <button
                onClick={() => navigate('/app/people/staff')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                View Staff <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Administration Tab */}
      {activeTab === 'school' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">School Administration</h2>
            <p className="text-xs text-slate-500">
              Configure academic structures, bulk operations, and import utility logs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <Building className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-slate-900">Academic Structure</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Setup academic sessions, classes, and section capacity.
              </p>
              <button
                onClick={() => navigate('/app/school/academics')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                Manage Academics <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <CheckSquare className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-slate-900">Bulk Operations</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Perform batch updates on candidate and student records.
              </p>
              <button
                onClick={() => navigate('/app/admin/bulk')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                Open Bulk Tools <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <Activity className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-slate-900">Import History</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Audit history of CSV data imports and migration logs.
              </p>
              <button
                onClick={() => navigate('/app/import/history')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                View Import Logs <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">System & Operational Settings</h2>
            <p className="text-xs text-slate-500">
              Categorized system administration: Organization, Security & System Templates, and
              Customization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Organization Settings */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <Building className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-bold text-slate-900 text-base">Organization</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Branding, school profile information, address details, and academic session
                  calendar.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/settings?cat=organization')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                Manage Organization <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Security & System Templates */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-bold text-slate-900 text-base">Security & Role Templates</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Operational users, active system roles, Role Templates (Receptionist, Counsellor,
                  Finance, Registrar, Principal), and feature package toggles.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/settings?cat=security')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                Security & Role Templates <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Customization */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <Settings className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="font-bold text-slate-900 text-base">Customization</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Auto-number sequences (applications, roll numbers), system preferences, and
                  notification channels.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/settings?cat=customization')}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1"
              >
                Manage Customization <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
