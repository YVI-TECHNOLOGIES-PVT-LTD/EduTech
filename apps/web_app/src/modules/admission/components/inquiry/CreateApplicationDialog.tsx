import React from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useConvertLeadToApplicationMutation, LeadItem } from '@/shared/api/crm.api';
import { FileText, Loader2, Sparkles } from 'lucide-react';

interface CreateApplicationDialogProps {
  lead: LeadItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (applicationNumber?: string) => void;
}

export const CreateApplicationDialog: React.FC<CreateApplicationDialogProps> = ({
  lead,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [convertLead, { isLoading }] = useConvertLeadToApplicationMutation();

  const handleConvert = async () => {
    if (!lead) return;
    try {
      const result = await convertLead(lead.lead_id).unwrap();
      const appNum = result?.application?.application_number || result?.application_number || '';
      toast.success(
        `Application created successfully! ${appNum ? `Application #: ${appNum}` : ''}`,
      );
      onOpenChange(false);
      onSuccess?.(appNum);
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to convert lead to application';
      toast.error(msg);
    }
  };

  if (!lead) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl">
        <AlertDialogHeader>
          <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <AlertDialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            Convert Lead to Application
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            You are about to initiate an official Admission Application for{' '}
            <span className="font-semibold text-foreground">{lead.student_name}</span> ({lead.lead_number}).
            <br />
            <br />
            This will:
            <ul className="list-disc pl-4 mt-1.5 space-y-1 font-normal">
              <li>Create a unique formal Application Number in the system.</li>
              <li>Advance lead stage to <span className="font-semibold text-foreground">Application Submitted</span>.</li>
              <li>Enable document verification, assessment scheduling, and fee payment.</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex gap-2">
          <AlertDialogCancel disabled={isLoading} className="text-xs font-semibold rounded-xl h-10 px-4">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConvert();
            }}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm rounded-xl h-10 px-4"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            Generate Application
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
