import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-slate-50 dark:bg-background text-slate-900 dark:text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold border border-indigo-200 dark:border-indigo-800">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>EduTrack ERP Next-Gen Academic System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-none">
          Empowering Excellence in Education Management
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Streamlined parent portals, real-time admission tracking, fee payments, and complete
          digital academic workspaces.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => navigate('/admission/register')}
            className="w-full sm:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center space-x-2"
          >
            <span>Apply for Admission</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            className="w-full sm:w-auto h-12 px-8 font-bold rounded-2xl border-slate-300 text-slate-700 dark:text-slate-200"
          >
            <span>Parent Portal Login</span>
          </Button>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-white dark:bg-card border-t border-slate-200 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold">Online Admissions</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Step-by-step horizontal application wizard, document uploads, and instant status
              updates.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold">Secure Parent Portal</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Native JWT authentication with multi-child application tracking and digital fee
              payments.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold">Staff Operations</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Centralized front-office workspace for application review, document verification, and
              CRM queues.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
