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
  Calendar,
} from 'lucide-react';
import { ICON_MAP } from '../config/menu_registry';
import { FrontOfficeExecutiveDashboard } from '../modules/admission/components/dashboard/FrontOfficeExecutiveDashboard';

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

  const moduleTabs = (
    <nav aria-label="Workspace Modules" className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
              isActive
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );

  // If on Executive Dashboard tab, render the full-stack Command Center
  if (activeTab === 'dashboard') {
    return <FrontOfficeExecutiveDashboard customTabs={moduleTabs} />;
  }

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

        <div className="mt-8 border-t border-slate-800/80 pt-4">
          {moduleTabs}
        </div>
      </div>

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
                title: 'Campus Visits & Sessions',
                route: '/app/admissions/interviews',
                icon: Calendar,
                desc: 'Manage campus tours, counselling sessions, and appointment outcomes.',
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
