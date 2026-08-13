import React from 'react';
import {
  FileText,
  User,
  Users,
  GraduationCap,
  UploadCloud,
  CreditCard,
  CheckSquare,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Progress } from '../../../../components/ui/progress';
import { Badge } from '../../../../components/ui/badge';

export interface WizardStepDef {
  id: number;
  title: string;
  shortTitle: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  {
    id: 1,
    title: 'Instructions',
    shortTitle: 'Instructions',
    desc: 'Getting Started',
    icon: FileText,
  },
  { id: 2, title: 'Student Details', shortTitle: 'Student', desc: 'Information Form', icon: User },
  { id: 3, title: 'Parent Details', shortTitle: 'Parents', desc: 'Guardian Info', icon: Users },
  {
    id: 4,
    title: 'Academics',
    shortTitle: 'Academics',
    desc: 'Grade & School',
    icon: GraduationCap,
  },
  { id: 5, title: 'Documents', shortTitle: 'Documents', desc: 'Required Files', icon: UploadCloud },
  { id: 6, title: 'Fee Payment', shortTitle: 'App Fee', desc: 'Fee Settlement', icon: CreditCard },
  {
    id: 7,
    title: 'Review & Submit',
    shortTitle: 'Review',
    desc: 'Final Verification',
    icon: CheckSquare,
  },
];

interface ParentWizardSidebarProps {
  currentStep: number;
  onStepClick: (stepId: number) => void;
  isReadOnly?: boolean;
  appNumber?: string;
}

export const ParentWizardSidebar: React.FC<ParentWizardSidebarProps> = ({
  currentStep,
  onStepClick,
  isReadOnly = false,
  appNumber = 'APP-2026-00368',
}) => {
  const currentStepDef =
    WIZARD_STEPS.find((s) => s.id === Math.min(currentStep, 7)) || WIZARD_STEPS[0];
  const percentComplete = Math.min(100, Math.round(((Math.min(currentStep, 7) - 1) / 6) * 85 + 15));

  return (
    <Card className="w-full font-sans mb-6 border-gray-100 shadow-sm p-6 space-y-6">
      {/* Top Progress Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
            APPLICATION PROGRESS
          </span>
          <h2 className="text-sm font-extrabold text-indigo-950 mt-0.5">
            Step {Math.min(currentStep, 7)} of 7 — {currentStepDef.title} ({currentStepDef.desc})
          </h2>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <div className="flex flex-col items-end">
            <Badge variant="info">{percentComplete}% COMPLETE</Badge>
            <span className="text-[10px] text-gray-400 font-semibold mt-1">
              App ID: {appNumber}
            </span>
          </div>

          <div className="w-24">
            <Progress value={percentComplete} className="h-2 bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Horizontal Steps Stepper */}
      <div className="relative px-2">
        {/* Connector Line Background */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 z-0 hidden md:block" />

        {/* Progress Line Active */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-emerald-500 z-0 transition-all duration-500 hidden md:block"
          style={{
            width: `${((Math.min(currentStep, 7) - 1) / 6) * 100}%`,
            maxWidth: 'calc(100% - 3rem)',
          }}
        />

        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 relative z-10">
          {WIZARD_STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = !isReadOnly && (step.id <= currentStep || isCompleted);

            return (
              <div
                key={step.id}
                onClick={() => isClickable && onStepClick(step.id)}
                className={`flex flex-col items-center text-center group ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                }`}
              >
                {/* Step Circle Pill */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all duration-200 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                      : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-200 scale-105'
                        : 'bg-white text-gray-400 border-2 border-gray-200 group-hover:border-indigo-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <span>0{step.id}</span>}
                </div>

                {/* Step Title & Subtitle */}
                <div className="mt-2 flex flex-col items-center">
                  <span
                    className={`text-xs tracking-tight ${
                      isCompleted
                        ? 'font-bold text-emerald-800'
                        : isCurrent
                          ? 'font-black text-indigo-950'
                          : 'font-semibold text-gray-400 group-hover:text-gray-600'
                    }`}
                  >
                    {step.shortTitle}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium hidden lg:block truncate max-w-[90px]">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
