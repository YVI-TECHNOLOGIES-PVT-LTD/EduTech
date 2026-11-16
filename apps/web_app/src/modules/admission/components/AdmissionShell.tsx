import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Navbar } from '@/features/landing/components/Navbar';
import { Footer } from '@/features/landing/components/Footer';

export type StepId = 'enquiry' | 'register' | 'otp' | 'success' | 'login';

interface AdmissionShellProps {
  currentStep?: StepId;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  showProgressTracker?: boolean;
  cardContainer?: boolean;
  children: React.ReactNode;
}

const steps = [
  { id: 'register', label: '1. Account' },
  { id: 'otp', label: '2. Verify OTP' },
  { id: 'success', label: '3. Complete' },
];

export const AdmissionShell: React.FC<AdmissionShellProps> = ({
  currentStep,
  title,
  subtitle,
  badgeText,
  showProgressTracker = false,
  cardContainer = true,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
      {/* Universal Navbar Shell */}
      <div className="bg-[#042A2B] text-white relative z-40">
        <Navbar onEnquireClick={() => navigate('/enquiry')} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Section Header */}
          {(title || subtitle || badgeText) && (
            <div className="text-center mb-8">
              {badgeText && (
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-[#063F40] text-[#E7B76A] text-xs font-bold rounded-full mb-3 border border-[#E7B76A]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{badgeText}</span>
                </span>
              )}
              {title && (
                <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">{subtitle}</p>
              )}

              {/* Optional Progress Tracker for Multi-Step Wizards */}
              {showProgressTracker && currentStep && (
                <div className="mt-6 flex items-center justify-center space-x-2 sm:space-x-4">
                  {steps.map((step) => {
                    const isActive = step.id === currentStep;
                    return (
                      <span
                        key={step.id}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                          isActive
                            ? 'bg-[#063F40] text-[#E7B76A] shadow-sm'
                            : 'bg-card text-muted-foreground border border-border/80',
                        )}
                      >
                        {step.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Children View Container */}
          {cardContainer ? (
            <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-10 shadow-sm max-w-xl mx-auto">
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Universal Footer */}
      <Footer />
    </div>
  );
};

export default AdmissionShell;


