import React from 'react';
import { Button } from '@/components/ui/button';
import { ButtonLoader } from '@/shared/loading/ButtonLoader';

interface FormFooterProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting = false,
}) => {
  return (
    <div className="flex items-center justify-end space-x-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs font-semibold"
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
      >
        {isSubmitting ? <ButtonLoader className="mr-2" /> : null}
        {submitLabel}
      </Button>
    </div>
  );
};
