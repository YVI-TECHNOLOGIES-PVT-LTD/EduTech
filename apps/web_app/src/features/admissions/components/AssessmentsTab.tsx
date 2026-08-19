import React from 'react';
import { ClipboardCheck, Award, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const AssessmentsTab: React.FC = () => {
  const handleScoreSubmit = () => {
    toast.success('Assessment score recorded successfully');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-card-foreground space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Entrance Assessment & Interview Scoring
          </h3>
          <p className="text-xs text-muted-foreground">
            Record evaluation scores and evaluator remarks for admission decisions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Application #</label>
            <Input
              defaultValue="APP-2026-042 (Aarav Sharma)"
              readOnly
              className="text-xs h-9 bg-muted"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Entrance Score (Out of 100)
            </label>
            <Input type="number" defaultValue="85" className="text-xs h-9" />
          </div>
        </div>

        <Button
          onClick={handleScoreSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <Save size={14} className="mr-1.5" />
          Record Assessment Score
        </Button>
      </div>
    </div>
  );
};
