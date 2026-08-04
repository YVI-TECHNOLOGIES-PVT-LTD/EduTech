import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../components/ui/alert-dialog';

interface BulkConfirmationProps {
    open: boolean;
    title: string;
    description: string;
    selectedCount: number;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function BulkConfirmation({
    open,
    title,
    description,
    selectedCount,
    onConfirm,
    onCancel,
    loading,
}: BulkConfirmationProps) {
    return (
        <AlertDialog open={open} onOpenChange={v => !v && onCancel()}>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description} This will affect {selectedCount} record
                        {selectedCount !== 1 ? 's' : ''}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={loading}>
                        {loading ? 'Processing...' : 'Confirm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
