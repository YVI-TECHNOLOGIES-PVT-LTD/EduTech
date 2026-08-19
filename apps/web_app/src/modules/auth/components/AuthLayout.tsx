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

export const AuthBrandPanel: React.FC = () => {
  return (
    <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] 2xl:w-[38%] bg-[#063F40] relative overflow-hidden flex-col justify-between p-6 sm:p-8 xl:p-10 text-white z-10 border-r border-[#042A2B] shadow-2xl shrink-0 select-none h-full">
      {/* Ambient Lighting Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-96 h-96 bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top / Main Hero Content & Value Proposition (Starts naturally below the public navbar) */}
      <div className="relative z-10 space-y-4 xl:space-y-6 max-w-lg text-left">
        <div className="space-y-2.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 text-[#E7B76A] text-[11px] font-bold border border-[#E7B76A]/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
            <span className="uppercase tracking-widest text-[9px] font-black">
              Academic Year 2026–2027
            </span>
          </div>
          <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Your child&apos;s admission journey,{' '}
            <span className="text-[#E7B76A]">all in one place.</span>
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed font-normal">
            Manage applications, documents, fees and admission progress from a single, secure
            parent portal designed for institutional excellence.
          </p>
        </div>

        {/* Feature Indicator Cards Grid (Compact, responsive 2x2 grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {BRAND_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#082F35]/90 border border-white/15 backdrop-blur-md hover:border-[#E7B76A]/40 transition-all duration-200 space-y-1 group"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-[#063F40] border border-[#E7B76A]/20 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-3 h-3 text-[#E7B76A]" />
                  </div>
                  <h2 className="text-[11px] font-extrabold text-white tracking-wide leading-tight">
                    {feature.title}
                  </h2>
                </div>
                <p className="text-[10px] text-emerald-100/80 leading-snug font-normal">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Security / Trust Footer */}
      <div className="relative z-10 pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-100/80 font-medium shrink-0">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E7B76A]" />
          <span>256-Bit SSL Encrypted & Protected</span>
        </div>
        <span className="text-emerald-200/60 font-bold">Education Made Simpler.</span>
      </div>
    </aside>
  );
};

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
    <div className="min-h-screen lg:h-screen w-full bg-background text-foreground flex flex-col font-sans selection:bg-[#E7B76A] selection:text-[#063F40] lg:overflow-hidden">
      {/* 1. TOP CANONICAL PUBLIC AUTH NAVBAR (Occupies its own row, never overlaps) */}
      <PublicNavbar sticky={false} className="shrink-0" />

      {/* 2. AUTHENTICATION MAIN CONTENT SHELL (Takes exact remaining height on desktop) */}
      <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row lg:overflow-hidden relative">
        {/* LEFT BRAND PANEL (Fixed stationary view on desktop, starts directly below navbar with no clipping) */}
        {showBrandPanel && <AuthBrandPanel />}

        {/* RIGHT / MAIN INTERACTIVE FORM AREA (Independently Scrollable with min-h-0) */}
        <main className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden flex flex-col justify-start items-center py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-12 relative bg-background">
          {/* Subtle Background Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#063F40]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E7B76A]/5 rounded-full blur-3xl pointer-events-none" />

          <div
            className={cn(
              'w-full mx-auto relative z-10 my-auto pb-8',
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
