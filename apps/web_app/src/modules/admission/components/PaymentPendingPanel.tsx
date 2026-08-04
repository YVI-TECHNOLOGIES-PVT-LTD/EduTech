import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, ShieldCheck } from 'lucide-react';
import { admissionApi } from '../admission.api';
import { Admission } from '../admission.types';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Switch } from '../../../components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '../../../components/ui/dialog';
import { toast } from 'sonner';

// Glassmorphism Utility (Keeping it consistent with the module's theme)
const GLASS_BASE = "backdrop-blur-xl bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl";

export const PaymentPendingPanel = ({ app, handleAction }: { app: Admission; handleAction: (action: string) => void }) => {
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [legacyStructureId, setLegacyStructureId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);

    useEffect(() => {
        const fetchFees = async () => {
            try {
                const { data } = await admissionApi.getFeePreview(app.id);
                setFeeStructures(data.components || []);
                setLegacyStructureId(data.legacyStructureId);
                setErrorStatus(null);

                // Pre-select mandatory components
                const mandatoryIds = (data.components || [])
                    .filter((f: any) => f.isMandatory)
                    .map((f: any) => f.id);
                setSelectedIds(mandatoryIds);

                if (!data.components || data.components.length === 0) {
                    setErrorStatus(404);
                }
            } catch (error: any) {
                const status = error.response?.status;
                setErrorStatus(status || 500);
            } finally {
                setLoading(false);
            }
        };
        fetchFees();
    }, [app]);

    const toggleFee = (id: string, isMandatory: boolean) => {
        if (isMandatory) return; // Cannot toggle mandatory
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const totalAmount = feeStructures
        .filter(f => selectedIds.includes(f.id))
        .reduce((sum, f) => sum + Number(f.amount), 0);

    const handleFinalize = async () => {
        setProcessing(true);
        try {
            await admissionApi.billing(app.id, legacyStructureId || '');
            toast.success("Billing finalized and parent gateway activated");
            handleAction('fetch'); // Refresh app state
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Snapshot generation failed");
        } finally {
            setProcessing(processing => false);
            setIsConfirming(false);
        }
    };

    if (loading) return (
        <div className={`${GLASS_BASE} p-8 space-y-4`}>
            <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
        </div>
    );

    const isLocked = app.payment_enabled && !!app.payment_reference;

    return (
        <div className={`${GLASS_BASE} p-8 space-y-8 relative overflow-hidden`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Financial Initialization</h3>
                    <p className="text-sm font-medium text-gray-500">Enable fee components for {app.grade_applied_for} • {app.academic_years?.year_label}</p>
                </div>
                <div className="bg-orange-500/10 p-4 rounded-2xl">
                    <CreditCard className="w-8 h-8 text-orange-600" />
                </div>
            </div>

            {isLocked && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-widest">Billing is locked because a payment has been initiated.</p>
                </div>
            )}

            {/* Fee List */}
            <ScrollArea className={`${isLocked ? 'h-auto' : 'h-[400px]'} pr-4`}>
                <div className="grid gap-4">
                    {errorStatus === 401 && (
                        <div className="text-center py-12 text-red-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-500 animate-bounce" />
                            <p className="text-xs font-bold uppercase tracking-widest">Session expired. Please log in again.</p>
                        </div>
                    )}

                    {errorStatus === 403 && (
                        <div className="text-center py-12 text-amber-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-amber-500" />
                            <p className="text-xs font-bold uppercase tracking-widest">You do not have permission to view fee structures.</p>
                        </div>
                    )}

                    {errorStatus === 404 && (
                        <div className="text-center py-12 opacity-50">
                            <ShieldCheck className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">No fee structure configured for this class.</p>
                        </div>
                    )}

                    {errorStatus === 422 && (
                        <div className="text-center py-12 text-orange-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-orange-500" />
                            <p className="text-xs font-bold uppercase tracking-widest">Admissions must be approved before billing.</p>
                        </div>
                    )}

                    {errorStatus && ![401, 403, 404, 422].includes(errorStatus) && (
                        <div className="text-center py-12 text-red-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                            <p className="text-xs font-bold uppercase tracking-widest">Unable to load fee structures.</p>
                        </div>
                    )}

                    {!errorStatus && feeStructures.map((fee) => (
                        <FeeComponentCard
                            key={fee.id}
                            fee={fee}
                            isSelected={selectedIds.includes(fee.id)}
                            onToggle={() => toggleFee(fee.id, fee.is_mandatory)}
                            disabled={isLocked || processing}
                        />
                    ))}
                </div>
            </ScrollArea>

            {/* Sticky Footer Logic Inside Panel */}
            <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable Amount</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">₹</span>
                        <motion.span
                            key={totalAmount}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-4xl font-black text-orange-600 tracking-tighter"
                        >
                            {totalAmount.toLocaleString()}
                        </motion.span>
                    </div>
                </div>

                {!isLocked && (
                    <Button
                        onClick={() => setIsConfirming(true)}
                        disabled={processing || selectedIds.length === 0}
                        className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-12 h-14 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-orange-500/30"
                    >
                        {processing ? 'Snapshoting...' : 'Finalize billing & activate gateway'}
                    </Button>
                )}
            </div>

            {/* Confirmation Modal */}
            <Dialog open={isConfirming} onOpenChange={() => setIsConfirming(false)}>
                <DialogContent className="max-w-md bg-white/95 backdrop-blur-2xl border-white/20">
                    <DialogHeader>
                        <DialogTitle className="uppercase tracking-tight font-black">Final Review</DialogTitle>
                        <DialogDescription>
                            Review the itemized bill before enabling the parent portal.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-4">
                        <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                            {feeStructures.filter(f => selectedIds.includes(f.id)).map(f => (
                                <div key={f.id} className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-500">{f.name}</span>
                                    <span className="text-gray-900">₹{Number(f.amount).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="border-t border-black/10 pt-2 flex justify-between font-black text-sm">
                                <span>TOTAL</span>
                                <span className="text-orange-600">₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-[10px] font-black uppercase leading-tight">
                                Important: Snapshot generation is permanent. Prices won't update even if master fees change.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsConfirming(false)}>Back</Button>
                        <Button
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={handleFinalize}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Confirm & Enable'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export const FeeComponentCard = ({ fee, isSelected, onToggle, disabled }: any) => {
    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={`p-5 rounded-2xl border transition-all ${isSelected
                    ? 'bg-orange-500/5 border-orange-500/20'
                    : 'bg-white/5 border-white/10 opacity-70'
                }`}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <Switch
                        checked={isSelected}
                        onCheckedChange={onToggle}
                        disabled={disabled || fee.isMandatory}
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate max-w-[150px] md:max-w-none">
                                {fee.name}
                            </h4>
                            {fee.isMandatory && (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-0 text-[8px] font-black">MANDATORY</Badge>
                            )}
                        </div>
                        <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest py-0 border-white/20">
                                {fee.category || 'General'}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black font-mono text-gray-900 dark:text-white">₹{Number(fee.amount).toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{fee.payment_schedule || 'One-time'}</p>
                </div>
            </div>
        </motion.div>
    );
};
