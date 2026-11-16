import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export const NotificationErrorState: React.FC<NotificationErrorStateProps> = ({
  onRetry,
  message = 'Unable to load notifications. Please check your connection.',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-2.5">
        <AlertCircle className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mb-3">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="h-7 text-xs font-semibold px-3 rounded-lg flex items-center gap-1.5"
        >
          <RotateCw className="w-3 h-3" /> Retry
        </Button>
      )}
    </div>
  );
};
