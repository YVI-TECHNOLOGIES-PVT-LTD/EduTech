import React from 'react';
import { AlertCircle, Info, RefreshCw, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const ParentLoadingSkeleton: React.FC<{ cards?: number }> = ({ cards = 3 }) => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-24 w-full rounded-3xl" />
    <Skeleton className="h-16 w-full rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, idx) => (
        <Skeleton key={idx} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-64 w-full rounded-2xl" />
  </div>
);

export const ParentErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Unable to load academic data',
  message = 'Something went wrong while fetching school records. Please try again.',
  onRetry,
}) => (
  <Card className="p-8 rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-center space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
      <AlertCircle className="w-6 h-6" />
    </div>
    <div className="space-y-1 max-w-md mx-auto">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry</span>
      </Button>
    )}
  </Card>
);

export const ParentNoChildrenState: React.FC<{ action?: React.ReactNode }> = ({ action }) => (
  <Card className="p-10 rounded-3xl border-dashed border-2 border-border bg-card text-center space-y-4">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
      <Users className="w-7 h-7" />
    </div>
    <div className="space-y-1.5 max-w-lg mx-auto">
      <h3 className="text-lg font-extrabold text-foreground">No Linked Students Found</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        No enrolled student profiles are currently linked to your parent account in this school. If
        you recently completed an admission, the school office may still be finalizing student
        enrollment linking.
      </p>
    </div>
    {action && <div className="pt-2">{action}</div>}
  </Card>
);

export const ParentUnsupportedNotice: React.FC<{
  title: string;
  description: string;
  details?: string[];
}> = ({ title, description, details }) => (
  <Card className="p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
        <Info className="w-4 h-4" />
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="font-bold text-foreground">{title}</div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        {details && details.length > 0 && (
          <ul className="list-disc pl-4 text-muted-foreground space-y-0.5 pt-1">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </Card>
);
