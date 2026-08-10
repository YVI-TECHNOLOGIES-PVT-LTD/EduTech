import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

export interface ApplicationFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'success' | 'error' | 'warning' | 'validation';
    title: string;
    message: string;
    details?: string;
    applicationNumber?: string;
    invalidCount?: number;
    actionLabel?: string;
    onAction?: () => void;
}

export const ApplicationFeedbackModal: React.FC<ApplicationFeedbackModalProps> = ({
    isOpen,
    onClose,
    type,
    title,
    message,
    details,
    applicationNumber,
    invalidCount,
    actionLabel = 'OK',
    onAction,
}) => {
    const handleClose = () => {
        onClose();
        if (onAction) onAction();
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                );
            case 'error':
                return (
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-inner">
                        <XCircle className="w-10 h-10" />
                    </div>
                );
            case 'warning':
            case 'validation':
                return (
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-inner">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                );
            default:
                return (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                );
        }
    };

    const getBannerStyle = () => {
        switch (type) {
            case 'success':
                return 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-900';
            case 'error':
                return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-900';
            case 'warning':
            case 'validation':
                return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900';
            default:
                return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-md p-6 rounded-3xl border border-gray-100 shadow-2xl bg-white overflow-hidden">
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    {getIcon()}

                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                            {title}
                        </DialogTitle>
                    </DialogHeader>

                    {invalidCount && invalidCount > 0 ? (
                        <div className="px-4 py-1.5 bg-amber-100 text-amber-800 font-bold rounded-full text-xs uppercase tracking-wide">
                            {invalidCount} {invalidCount === 1 ? 'Required Field Needs Attention' : 'Required Fields Need Attention'}
                        </div>
                    ) : null}

                    <div className={`w-full p-4 rounded-2xl border ${getBannerStyle()} text-sm font-medium leading-relaxed text-left space-y-2`}>
                        <p className="font-semibold text-gray-800">{message}</p>
                        {details && (
                            <p className="text-xs text-gray-600 pt-1 border-t border-gray-200/60">{details}</p>
                        )}
                    </div>

                    {type === 'success' && applicationNumber && (
                        <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100 flex justify-between items-center text-left">
                            <div>
                                <span className="text-xs font-bold uppercase text-gray-500 block">Application Number</span>
                                <span className="text-lg font-black text-blue-700 tracking-wide">{applicationNumber}</span>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 flex sm:flex-row gap-2 justify-center w-full">
                    <Button
                        type="button"
                        onClick={handleClose}
                        className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                            type === 'success'
                                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-green-200'
                                : type === 'error'
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-200'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200'
                        }`}
                    >
                        {actionLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
