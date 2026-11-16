import React from 'react';

interface ApplicationStatusBadgeProps {
  status?: string;
  className?: string;
}

export function getApplicationStatusConfig(status?: string) {
  const s = (status || 'submitted').toLowerCase();
  switch (s) {
    case 'submitted':
      return {
        label: 'Submitted',
        badgeClass:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        dotClass: 'bg-blue-500',
      };
    case 'documents_pending':
      return {
        label: 'Documents Pending',
        badgeClass:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
      };
    case 'assessment_pending':
      return {
        label: 'Assessment Pending',
        badgeClass:
          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
        dotClass: 'bg-indigo-500',
      };
    case 'under_review':
      return {
        label: 'Under Review',
        badgeClass:
          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
        dotClass: 'bg-purple-500',
      };
    case 'approved':
      return {
        label: 'Approved',
        badgeClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
      };
    case 'waitlisted':
      return {
        label: 'Waitlisted',
        badgeClass:
          'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
        dotClass: 'bg-cyan-500',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        badgeClass:
          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500',
      };
    case 'withdrawn':
      return {
        label: 'Withdrawn',
        badgeClass:
          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        dotClass: 'bg-slate-400',
      };
    default:
      return {
        label: (status || 'Unknown').replace(/_/g, ' '),
        badgeClass:
          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        dotClass: 'bg-slate-400',
      };
  }
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const config = getApplicationStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
};
