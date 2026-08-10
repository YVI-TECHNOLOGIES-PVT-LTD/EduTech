import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, GraduationCap, Sparkles, HelpCircle, PhoneCall, Mail } from 'lucide-react';
import { SCHOOL_INFO } from '@/lib/public-constants';
import { cn } from '@/lib/utils';

export type StepId = 'enquiry' | 'register' | 'otp' | 'success' | 'login';

interface AdmissionShellProps {
  currentStep: StepId;
  title: string;
  subtitle: string;
  badgeText?: string;
  children: React.ReactNode;
  sidePanel?: React.ReactNode;
}

const steps = [
  { id: 'enquiry', label: '1. Enquiry' },
  { id: 'register', label: '2. Account' },
  { id: 'otp', label: '3. Verify OTP' },
  { id: 'success', label: '4. Complete' },
];

export const AdmissionShell: React.FC<AdmissionShellProps> = ({
  currentStep,
  title,
  subtitle,
  badgeText,
  children,
  sidePanel,
}) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Dark Navy Header Section */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-6 pb-12 sm:pt-8 sm:pb-14 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          {badgeText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/30 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{badgeText}</span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm lg:text-base text-slate-300 max-w-xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* Progress Tracker (Only for admission setup steps) */}
          {currentStepIndex >= 0 && (
            <div className="pt-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                {steps.map((step, idx) => (
                  <span
                    key={step.id}
                    className={cn(
                      idx <= currentStepIndex ? 'text-amber-300 font-extrabold' : 'text-slate-500'
                    )}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-500"
                  style={{
                    width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-8 sm:py-12 lg:py-16 bg-slate-50 flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Form & Main Card Area */}
            <div className={cn(sidePanel ? 'lg:col-span-7' : 'lg:col-span-8 lg:col-start-3')}>
              {children}
            </div>

            {/* Optional Admissions Support Side Panel */}
            {sidePanel && <div className="lg:col-span-5 space-y-6">{sidePanel}</div>}
          </div>
        </div>
      </section>
    </div>
  );
};
