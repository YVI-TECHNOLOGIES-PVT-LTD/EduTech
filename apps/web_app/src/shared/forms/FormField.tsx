import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  required = false,
  helpText,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </Label>
      {children}
      {helpText && !error && <p className="text-[11px] text-slate-400">{helpText}</p>}
      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
};
