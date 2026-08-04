import React from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';

export const notify = {
    success: (msg: string) => toast.success(msg, { icon: React.createElement(CheckCircle2, { className: 'text-green-500 w-5 h-5' }) }),
    error: (msg: string) => toast.error(msg, { icon: React.createElement(XCircle, { className: 'text-red-500 w-5 h-5' }) }),
    info: (msg: string) => toast.info(msg, { icon: React.createElement(Info, { className: 'text-blue-500 w-5 h-5' }) }),
    warning: (msg: string) => toast.warning(msg, { icon: React.createElement(AlertCircle, { className: 'text-amber-500 w-5 h-5' }) }),
};

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'primary' | 'destructive';
}

export const ConfirmDialog = ({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Proceed',
    cancelLabel = 'Cancel',
    variant = 'primary'
}: ConfirmDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) onCancel(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-black text-gray-900">{title}</DialogTitle>
                </DialogHeader>
                <div className="py-3 text-sm text-gray-500 leading-relaxed">
                    {message}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={onCancel} className="text-sm rounded-xl">
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        className="text-sm rounded-xl px-5"
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
