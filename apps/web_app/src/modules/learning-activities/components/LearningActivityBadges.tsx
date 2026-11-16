import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  LearningActivityStatus,
  LearningActivitySubtype,
  LearningActivityType,
  LearningSubmissionStatus,
} from '@/shared/api/learningActivities.api';
import {
  BookOpen,
  Code,
  FileCode,
  Headphones,
  HelpCircle,
  Mic,
  Share2,
  Users,
  Video,
} from 'lucide-react';

export const ActivitySubtypeBadge: React.FC<{
  subtype?: LearningActivitySubtype | null;
  type?: LearningActivityType;
}> = ({ subtype, type }) => {
  const actual = subtype || type || 'project';

  switch (actual) {
    case 'coding_lab':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-purple-300 bg-purple-50 text-purple-700 font-medium"
        >
          <Code className="h-3 w-3" />
          Coding Lab
        </Badge>
      );
    case 'video_submission':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-rose-300 bg-rose-50 text-rose-700 font-medium"
        >
          <Video className="h-3 w-3" />
          Video Submission
        </Badge>
      );
    case 'audio_submission':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-cyan-300 bg-cyan-50 text-cyan-800 font-medium"
        >
          <Mic className="h-3 w-3" />
          Audio Submission
        </Badge>
      );
    case 'quiz':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800 font-medium"
        >
          <HelpCircle className="h-3 w-3" />
          Gamified Quiz
        </Badge>
      );
    case 'peer_learning':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-300 bg-amber-50 text-amber-800 font-medium"
        >
          <Users className="h-3 w-3" />
          Peer Learning
        </Badge>
      );
    case 'collaborative':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-teal-300 bg-teal-50 text-teal-800 font-medium"
        >
          <Share2 className="h-3 w-3" />
          Collaborative Task
        </Badge>
      );
    case 'homework':
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-300 bg-amber-50 text-amber-800 font-medium"
        >
          <BookOpen className="h-3 w-3" />
          Homework (Offline)
        </Badge>
      );
    case 'project':
    default:
      return (
        <Badge
          variant="outline"
          className="gap-1 border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
        >
          <FileCode className="h-3 w-3" />
          Digital Project
        </Badge>
      );
  }
};

export const ActivityTypeBadge: React.FC<{ type: LearningActivityType }> = ({ type }) => {
  if (type === 'project') {
    return (
      <Badge
        variant="outline"
        className="border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
      >
        Digital Project
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 font-medium">
      Homework (Offline)
    </Badge>
  );
};

export const ActivityStatusBadge: React.FC<{ status: LearningActivityStatus }> = ({ status }) => {
  const styles: Record<LearningActivityStatus, string> = {
    draft: 'border-slate-300 bg-slate-100 text-slate-700',
    published: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    closed: 'border-rose-300 bg-rose-50 text-rose-700',
  };
  const labels: Record<LearningActivityStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    closed: 'Closed',
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
};

export const SubmissionStatusBadge: React.FC<{
  status?: LearningSubmissionStatus | null;
  activityType?: LearningActivityType;
}> = ({ status, activityType }) => {
  if (!status) {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        {activityType === 'homework' ? 'Offline Task' : 'Not Submitted'}
      </Badge>
    );
  }
  const styles: Record<LearningSubmissionStatus, string> = {
    submitted: 'border-sky-300 bg-sky-50 text-sky-700',
    under_review: 'border-violet-300 bg-violet-50 text-violet-700',
    resubmission_requested: 'border-amber-300 bg-amber-50 text-amber-800',
    reviewed: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  };
  const labels: Record<LearningSubmissionStatus, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    resubmission_requested: 'Resubmission Requested',
    reviewed: 'Reviewed',
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateTimeShort(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
