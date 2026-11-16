export interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  progress: number;
  iconName: string;
  description: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Initial & Draft
  draft: {
    label: 'Draft',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    progress: 10,
    iconName: 'edit-3',
    description: 'Application form is incomplete',
  },
  submitted: {
    label: 'Submitted',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    progress: 25,
    iconName: 'check-circle',
    description: 'Application received and registered',
  },

  // Document Verification
  documents_pending: {
    label: 'Documents Pending',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    progress: 35,
    iconName: 'file-text',
    description: 'Mandatory certificates pending verification',
  },
  docs_pending: {
    label: 'Documents Pending',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    progress: 35,
    iconName: 'file-text',
    description: 'Mandatory certificates pending verification',
  },
  document_verified: {
    label: 'Documents Verified',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    progress: 50,
    iconName: 'check-circle',
    description: 'All mandatory documents verified',
  },
  docs_verified: {
    label: 'Documents Verified',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    progress: 50,
    iconName: 'check-circle',
    description: 'All mandatory documents verified',
  },

  // Evaluation & Assessment
  assessment_pending: {
    label: 'Assessment Pending',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    progress: 55,
    iconName: 'clock',
    description: 'Academic evaluation scheduled',
  },
  under_review: {
    label: 'Under Review',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    progress: 60,
    iconName: 'clock',
    description: 'Application under academic review',
  },
  exam: {
    label: 'Entrance Exam',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    progress: 65,
    iconName: 'book-open',
    description: 'Entrance examination round',
  },
  interview: {
    label: 'Interview Panel',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    progress: 70,
    iconName: 'users',
    description: 'Student & parent interview interaction',
  },
  merit: {
    label: 'Merit List',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/50',
    badgeText: 'text-violet-700 dark:text-violet-300',
    badgeBorder: 'border-violet-200 dark:border-violet-800',
    progress: 75,
    iconName: 'award',
    description: 'Candidate qualified in merit selection',
  },
  recommended: {
    label: 'Recommended',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/50',
    badgeText: 'text-violet-700 dark:text-violet-300',
    badgeBorder: 'border-violet-200 dark:border-violet-800',
    progress: 75,
    iconName: 'award',
    description: 'Recommended for admission offer',
  },

  // Decision & Offer
  approved: {
    label: 'Offer Sent',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    progress: 85,
    iconName: 'check-circle',
    description: 'Admission offer granted. Proceed to fee payment.',
  },
  offered: {
    label: 'Offer Sent',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    progress: 85,
    iconName: 'check-circle',
    description: 'Admission offer granted. Proceed to fee payment.',
  },

  // Fees
  fee_pending: {
    label: 'Fee Pending',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/50',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-800',
    progress: 90,
    iconName: 'credit-card',
    description: 'Admission fee payment required',
  },
  fee_verified: {
    label: 'Fee Verified',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    progress: 95,
    iconName: 'check-circle',
    description: 'Fee payment confirmed and receipt issued',
  },

  // Final States
  enrolled: {
    label: 'Enrolled',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700',
    progress: 100,
    iconName: 'award',
    description: 'Student successfully enrolled',
  },
  waitlisted: {
    label: 'Waitlisted',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    progress: 70,
    iconName: 'alert-circle',
    description: 'Placed on admission waiting list',
  },
  rejected: {
    label: 'Rejected',
    badgeBg: 'bg-red-50 dark:bg-red-950/50',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-800',
    progress: 100,
    iconName: 'x-circle',
    description: 'Application was not approved',
  },
  withdrawn: {
    label: 'Withdrawn',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    progress: 100,
    iconName: 'slash',
    description: 'Application withdrawn by parent',
  },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Under Review',
  badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
  badgeText: 'text-indigo-700 dark:text-indigo-300',
  badgeBorder: 'border-indigo-200 dark:border-indigo-800',
  progress: 50,
  iconName: 'clock',
  description: 'Application in progress',
};

/**
 * Normalizes any backend or legacy application status string into a typed StatusConfig
 */
export function getApplicationStatusConfig(rawStatus?: string | null): StatusConfig {
  if (!rawStatus) return DEFAULT_STATUS_CONFIG;
  const key = rawStatus.toLowerCase().trim();
  return (
    STATUS_MAP[key] || {
      ...DEFAULT_STATUS_CONFIG,
      label: rawStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  );
}
