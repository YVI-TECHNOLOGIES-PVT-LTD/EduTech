import React from 'react';
import { ShieldCheck, GraduationCap, Sparkles, PhoneCall, Mail } from 'lucide-react';
import { SCHOOL_INFO } from '@/lib/public-constants';
import { cn } from '@/lib/utils';

export type StepId = 'enquiry' | 'register' | 'otp' | 'success' | 'login';

interface AdmissionShellProps {
  currentStep: StepId;
  title: string;
  subtitle: string;
  badgeText?: string;
  showProgressTracker?: boolean;
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
  badgeText = 'Parent Portal',
  showProgressTracker = true,
  children,
  sidePanel,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full mb-3 border border-indigo-100 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{badgeText}</span>
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>

          {/* Progress Tracker */}
          {showProgressTracker && (
            <div className="mt-6 flex items-center justify-center space-x-2 sm:space-x-4">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                return (
                  <span
                    key={step.id}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                        : 'bg-white dark:bg-card text-slate-500 border border-slate-200 dark:border-border',
                    )}
                  >
                    {step.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100 dark:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdmissionShell;
