/**
 * EduTrack ERP — School Operations Workspace
 * Unified internal application for all staff members in Stage-1.
 * Capability-based visibility determines accessible views (Dashboard, Admissions, People, School, Settings).
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetDashboardSummaryQuery } from '../shared/api/dashboard.api';
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

  // Live operational inbox metrics query via RTK Query
  const {
    data: adminOverview,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useGetDashboardSummaryQuery();

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

  const rawStaffName =
    user?.full_name ||
    (user as any)?.name ||
    ((user as any)?.firstName
      ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
      : '');
  const staffName =
    rawStaffName ||
    (user?.email
      ? user.email
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Front Office Desk');

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Workspace Header Banner */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-700/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Front Office Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Good day, {staffName}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Operational admissions desk for inquiries, candidate file review, campus visit
              schedules, and enrollment workflows.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => refetchMetrics()}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-white transition-colors"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isMetricsLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Persona
              </p>
              <p className="text-xs font-black text-emerald-400">
                {user?.roles?.includes('SUPER_ADMIN') ? 'Super Admin' : 'Front Office Desk'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Module Tabs */}
        <div className="flex items-center gap-2 mt-8 border-t border-slate-800/80 pt-4 overflow-x-auto scrollbar-hide">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
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
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Quick Actions
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60">
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
                    className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-indigo-100 dark:border-indigo-900">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {action.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
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
                <h2 className="text-lg font-extrabold text-foreground">Task-Driven Work Queues</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
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
                    className="bg-card rounded-2xl p-6 border border-border/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        {widget.defaultMetric?.urgentCount && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {widget.defaultMetric.urgentCount} Urgent
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground text-base">{widget.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>

                      <div className="mt-4 p-3 bg-muted/40 rounded-xl flex items-center justify-between border border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {widget.defaultMetric?.label}
                        </span>
                        <span className="text-base font-black text-foreground">
                          {widget.defaultMetric?.count}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(widget.actionRoute)}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs transition-colors group shadow-sm"
                    >
                      {widget.actionLabel}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Admissions Desk</h2>
              <p className="text-xs text-muted-foreground">
                Manage inquiries, application processing, documents, entrance exams, fees, and
                enrollment.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/admissions/wizard')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
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
                route: '/app/admissions/applications',
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
                  className="p-5 bg-muted/20 rounded-2xl border border-border/80 hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <CardIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                    <h3 className="font-bold text-foreground text-sm">{card.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">{card.desc}</p>
                  </div>
                  <button
                    onClick={() => navigate(card.route)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <h2 className="text-lg font-extrabold text-foreground">People Directory</h2>
            <p className="text-xs text-muted-foreground">
              Access student profiles, parent/guardian records, and staff directory.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Student Directory</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  View enrolled students, section assignments, and academic status.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/people/students')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View Students <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Parent Directory</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Manage guardian profiles, contact details, and linked wards.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/people/parents')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View Parents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <Briefcase className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Staff Directory</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  View operational staff members, departments, and roles.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/people/staff')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View Staff <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Administration Tab */}
      {activeTab === 'school' && (
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <h2 className="text-lg font-extrabold text-foreground">School Administration</h2>
            <p className="text-xs text-muted-foreground">
              Configure academic structures, bulk operations, and import utility logs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <Building className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Academic Structure</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Setup academic sessions, classes, and section capacity.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/school/academics')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Manage Academics <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <CheckSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Bulk Operations</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Perform batch updates on candidate and student records.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/admin/bulk')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Open Bulk Tools <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Import History</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Audit history of CSV data imports and migration logs.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/import/history')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View Import Logs <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-4">
            <h2 className="text-lg font-extrabold text-foreground">
              System & Operational Settings
            </h2>
            <p className="text-xs text-muted-foreground">
              Categorized system administration: Organization, Security & System Templates, and
              Customization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Organization Settings */}
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <Building className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Organization</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Branding, school profile information, address details, and academic session
                  calendar.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/settings?cat=organization')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Manage Organization <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Security & System Templates */}
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Security & Role Templates</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Operational users, active system roles, Role Templates (Receptionist, Counsellor,
                  Finance, Registrar, Principal), and feature package toggles.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/settings?cat=security')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Security & Role Templates <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Customization */}
            <div className="p-5 bg-muted/20 rounded-2xl border border-border/80 flex flex-col justify-between">
              <div>
                <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h3 className="font-bold text-foreground text-sm">Customization</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Auto-number sequences (applications, roll numbers), system preferences, and
                  notification channels.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/settings?cat=customization')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
