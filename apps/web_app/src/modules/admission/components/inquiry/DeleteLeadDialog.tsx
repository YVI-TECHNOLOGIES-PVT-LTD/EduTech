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
import { useDeleteLeadMutation, LeadItem } from '@/shared/api/crm.api';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteLeadDialogProps {
  lead: LeadItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DeleteLeadDialog: React.FC<DeleteLeadDialogProps> = ({
  lead,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [deleteLead, { isLoading }] = useDeleteLeadMutation();

  const handleDelete = async () => {
    if (!lead) return;
    try {
      await deleteLead(lead.lead_id).unwrap();
      toast.success(`Lead ${lead.lead_number} deleted successfully`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.message ||
        'Cannot delete this lead. Ensure there are no linked applications or dependencies.';
      toast.error(msg);
    }
  };

  if (!lead) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <AlertDialogTitle className="text-lg font-black text-foreground">
            Delete Lead {lead.lead_number}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete the lead for{' '}
            <span className="font-bold text-foreground">{lead.student_name}</span>?
            <br />
            <br />
            This action cannot be undone. All activity logs and scheduled visits for this lead will
            be removed. If an admission application is already linked, deletion will be blocked by
            the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading} className="text-xs font-bold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md shadow-red-600/20"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            Delete Lead
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
