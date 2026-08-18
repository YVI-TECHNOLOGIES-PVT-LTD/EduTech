import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  FolderCheck,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  Lock,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

interface AuthLayoutProps {
  children: React.ReactNode;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  backTo?: {
    label: string;
    href: string;
  };
  wideCard?: boolean;
  showBrandPanel?: boolean;
}

const BRAND_FEATURES = [
  {
    icon: FileText,
    title: 'Online Applications',
    description: 'Track real-time submission stages and evaluation milestones',
  },
  {
    icon: FolderCheck,
    title: 'Document Center',
    description: 'Digital upload & verified records vault for student dossiers',
  },
  {
    icon: CreditCard,
    title: 'Fee & Payments',
    description: 'Transparent fee structures, online receipts & ledger history',
  },
  {
    icon: GraduationCap,
    title: 'Admission Status',
    description: 'Instant decision results, interview alerts & offer letters',
  },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  badgeText,
  title,
  subtitle,
  backTo,
  wideCard = false,
  showBrandPanel = true,
}) => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col font-sans selection:bg-[#E7B76A] selection:text-[#063F40]">
      {/* 1. TOP CANONICAL PUBLIC AUTH NAVBAR (Full Viewport Width) */}
      <PublicNavbar sticky={true} />

      {/* 2. AUTHENTICATION MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col lg:flex-row w-full relative overflow-x-hidden">
        {/* LEFT BRAND PANEL (Visible on lg screens) */}
        {showBrandPanel && (
          <aside className="hidden lg:flex lg:w-[46%] xl:w-[44%] 2xl:w-[40%] bg-[#063F40] relative overflow-hidden flex-col justify-between p-10 xl:p-14 text-white z-10 border-r border-[#042A2B] shadow-2xl">
            {/* Ambient Lighting Glows */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 left-10 w-96 h-96 bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Bar */}
            <div className="relative z-10">
              <Link
                to="/"
                className="inline-flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B76A] rounded-2xl"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#E7B76A] text-[#063F40] flex items-center justify-center font-black text-lg shadow-md group-hover:scale-105 transition-transform duration-200">
                  <Sparkles className="w-5 h-5 text-[#063F40]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight text-white leading-none group-hover:text-[#E7B76A] transition-colors">
                    EDUTRACK
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E7B76A] mt-1">
                    Parent Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Hero Content & Value Proposition */}
            <div className="relative z-10 my-auto py-8 space-y-8 max-w-xl text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-[#E7B76A] text-xs font-bold border border-[#E7B76A]/30 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
                  <span className="uppercase tracking-widest text-[10px] font-black">
                    Academic Year 2026–2027
                  </span>
                </div>
                <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
                  Your child&apos;s admission journey,{' '}
                  <span className="text-[#E7B76A]">all in one place.</span>
                </h1>
                <p className="text-emerald-100/90 text-sm xl:text-base leading-relaxed font-normal">
                  Manage applications, documents, fees and admission progress from a single, secure
                  parent portal designed for institutional excellence.
                </p>
              </div>

              {/* Feature Indicator Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {BRAND_FEATURES.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#082F35]/90 border border-white/15 backdrop-blur-md hover:border-[#E7B76A]/40 transition-all duration-200 space-y-2 group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#063F40] border border-[#E7B76A]/20 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                          <Icon className="w-4 h-4 text-[#E7B76A]" />
                        </div>
                        <h2 className="text-xs font-extrabold text-white tracking-wide">
                          {feature.title}
                        </h2>
                      </div>
                      <p className="text-[11px] text-emerald-100/80 leading-snug font-normal">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Security / Trust Footer */}
            <div className="relative z-10 pt-6 border-t border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-100/80 font-medium">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#E7B76A]" />
                <span>256-Bit SSL Encrypted & Protected</span>
              </div>
              <span className="text-emerald-200/60 font-bold">Education Made Simpler.</span>
            </div>
          </aside>
        )}

        {/* RIGHT / MAIN INTERACTIVE FORM AREA */}
        <main className="flex-1 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-12 relative overflow-y-auto min-h-[calc(100vh-4.5rem)] bg-background">
          {/* Subtle Background Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#063F40]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E7B76A]/5 rounded-full blur-3xl pointer-events-none" />

          <div
            className={cn(
              'w-full mx-auto relative z-10 my-auto',
              wideCard ? 'max-w-3xl' : 'max-w-md md:max-w-lg',
            )}
          >
            {/* Optional Back Navigation Link */}
            {backTo && (
              <div className="mb-4">
                <Link
                  to={backTo.href}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-[#063F40] dark:hover:text-[#E7B76A] transition-colors group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>{backTo.label}</span>
                </Link>
              </div>
            )}

            {/* AUTH CARD CONTAINER */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(4,42,43,0.08)] relative">
              {/* Header Area */}
              {(badgeText || title || subtitle) && (
                <div className="text-center mb-7 space-y-2">
                  {badgeText && (
                    <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-editorial-cream text-[#063F40] text-xs font-extrabold rounded-full border border-[#063F40]/20 shadow-xs mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#063F40]" />
                      <span>{badgeText}</span>
                    </span>
                  )}
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#042A2B] dark:text-white tracking-tight">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Injected Form / Interactive Body */}
              {children}
            </div>

            {/* Bottom Security / Copyright Tag */}
            <div className="mt-6 text-center text-[11px] text-muted-foreground flex items-center justify-center space-x-2">
              <Lock className="w-3 h-3 text-[#063F40] dark:text-[#E7B76A]" />
              <span>EduTrack Parent Portal &bull; Secure Institutional Access</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
