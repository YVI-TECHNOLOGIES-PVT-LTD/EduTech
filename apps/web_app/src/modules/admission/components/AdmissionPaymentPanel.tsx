import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    CheckCircle2,
    Clock,
    ArrowRight,
    Receipt,
    ShieldCheck,
    AlertCircle,
    Download,
    Landmark
} from 'lucide-react';
import { admissionApi } from '../admission.api';
import { supabase } from '../../../lib/supabase';
import { Admission, AdmissionFeeSnapshot } from '../admission.types';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { PaymentMethodIcons } from './PaymentMethodIcons';

const GLASS_BASE = "backdrop-blur-xl bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl";

const CATEGORY_PRIORITY: Record<string, number> = {
    'Admission': 1,
    'Tuition': 2,
    'General': 3,
    'Transport': 4
};

interface AdmissionPaymentPanelProps {
    app: Admission;
    onPaymentSubmit: (data: { mode: string, reference: string, proof_url?: string }) => Promise<void>;
    actionLoading: boolean;
}

export const AdmissionPaymentPanel: React.FC<AdmissionPaymentPanelProps> = ({
    app,
    onPaymentSubmit,
    actionLoading
}) => {
    const [fees, setFees] = useState<AdmissionFeeSnapshot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFees = async () => {
            try {
                const data = await admissionApi.getAdmissionFees(app.id);
                setFees(data);
            } catch (error) {
                console.error('Failed to fetch admission fees', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFees();
    }, [app.id]);

    if (loading) return (
        <div className="p-8 text-center bg-white/5 rounded-3xl animate-pulse">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Generating Invoice...</p>
        </div>
    );

    // 1️⃣ PAYMENT NOT ENABLED
    if (fees.length === 0) {
        return (
            <div className={`${GLASS_BASE} p-10 text-center space-y-4`}>
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Review in Progress</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Your application is under review. Payment will be enabled after document verification and financial assessment.
                </p>
            </div>
        );
    }

    const sortedFees = [...fees].sort((a, b) => {
        const pA = CATEGORY_PRIORITY[a.snapshot_category] || 99;
        const pB = CATEGORY_PRIORITY[b.snapshot_category] || 99;
        return pA - pB;
    });

    const isPaid = app.status === 'payment_verified' || app.status === 'enrolled';
    const isSubmitted = app.status === 'payment_submitted' && !!app.payment_reference;
    const isCorrection = app.status === 'payment_correction';
    const canPay = !isPaid && !isSubmitted;

    return (
        <div className="space-y-6">
            <div className={`${GLASS_BASE} overflow-hidden`}>
                {/* Header Section */}
                <div className="p-8 border-b border-white/10 flex justify-between items-center transition-colors">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            Fee Invoice
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Ref: {app.id.split('-')[0].toUpperCase()}
                        </p>
                    </div>
                    {isPaid ? (
                        <Badge className="bg-green-500 text-white border-0 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-2" />
                            Verified
                        </Badge>
                    ) : isSubmitted ? (
                        <Badge className="bg-amber-500 text-white border-0 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest animate-pulse">
                            <Clock className="w-3 h-3 mr-2" />
                            Pending Verification
                        </Badge>
                    ) : (
                        <Badge className="bg-blue-600 text-white border-0 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest">
                            Payment Due
                        </Badge>
                    )}
                </div>

                {/* Itemized Invoice Body */}
                <div className="p-8 space-y-4">
                    <div className="space-y-1">
                        {sortedFees.map((fee) => (
                            <InvoiceRow key={fee.id} label={fee.snapshot_name} amount={fee.snapshot_amount} category={fee.snapshot_category} isMandatory={fee.is_mandatory} />
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t-2 border-dashed border-white/10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grand Total</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                                    <span className="text-xl mr-1 opacity-50 font-mono">₹</span>
                                    {Number(app.payment_amount).toLocaleString()}
                                </p>
                            </div>
                            <ShieldCheck className="w-10 h-10 text-green-500/30" />
                        </div>
                    </div>
                </div>

                {/* Shared Message Area */}
                {(isSubmitted || isCorrection) && (
                    <div className="mx-8 mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        {isSubmitted && (
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                Payment submitted. Reference: {app.payment_reference}
                            </p>
                        )}
                        {isCorrection && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" />
                                    Payment Correction Required
                                </p>
                                <p className="text-xs text-gray-500 font-medium">{app.remark_by_finance}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CTA Section */}
                <div className="p-8 pt-0">
                    {canPay || isCorrection ? (
                        <PaymentForm app={app} onSubmit={onPaymentSubmit} loading={actionLoading} />
                    ) : isPaid ? (
                        <div className="flex gap-3">
                            <Button className="flex-1 bg-white hover:bg-gray-50 text-gray-900 rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border border-gray-200">
                                <Download className="w-4 h-4 mr-2" />
                                Download Receipt
                            </Button>
                            <div className="hidden md:flex flex-col justify-center px-4 text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Paid on</p>
                                <p className="text-[10px] font-bold text-gray-900">{app.payment_date ? new Date(app.payment_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Processing your payment details...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center px-10 leading-relaxed">
                This invoice is generated based on a secure snapshot taken by the admission office.
                Any changes to institutional fee structures will not affect this established application.
            </p>
        </div>
    );
};

const InvoiceRow = ({ label, amount, category, isMandatory }: { label: string, amount: number, category: string, isMandatory: boolean }) => (
    <div className="group flex items-center justify-between py-3 hover:bg-white/5 px-4 rounded-xl transition-colors">
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover:scale-150 transition-transform" />
            <div>
                <p className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{label}</p>
                <div className="flex gap-2">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{category}</p>
                    {isMandatory && <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest opacity-60">Mandatory</span>}
                </div>
            </div>
        </div>
        <p className="text-sm font-black text-gray-900 dark:text-white font-mono">
            <span className="text-[10px] mr-1 opacity-40">₹</span>
            {Number(amount).toLocaleString()}
        </p>
    </div>
);

const PaymentForm = ({ app, onSubmit, loading }: { app: Admission, onSubmit: any, loading: boolean }) => {
    const [selectedId, setSelectedId] = useState('');
    const [selectedLabel, setSelectedLabel] = useState('');
    const [mode, setMode] = useState('');
    const [reference, setReference] = useState('');
    const [proofType, setProofType] = useState<'link' | 'upload'>('link');
    const [proof, setProof] = useState<string | File>('');
    const [uploading, setUploading] = useState(false);

    const handleSelect = (id: string, category: string, label: string) => {
        setSelectedId(id);
        setMode(category);
        setSelectedLabel(label);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalProofUrl = '';

        if (proofType === 'link') {
            finalProofUrl = proof as string;
        } else if (proof instanceof File) {
            setUploading(true);
            try {
                const fileExt = proof.name.split('.').pop();
                const fileName = `${app.id}_${Date.now()}.${fileExt}`;
                const { error } = await supabase.storage
                    .from('admissions')
                    .upload(`payment_proofs/${fileName}`, proof);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('admissions')
                    .getPublicUrl(`payment_proofs/${fileName}`);

                finalProofUrl = publicUrl;
            } catch (error: any) {
                console.error('Upload failed:', error);
                alert('Failed to upload proof. Please try again or use a link.');
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        onSubmit({ mode, reference, proof_url: finalProofUrl });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentMethodIcons selectedId={selectedId} onSelect={handleSelect} />

            {selectedId && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* CONDITIONAL RENDER: If CARD or BANK_TRANSFER, show detailed form. Else show simple Reference Input. */}
                    {(mode === 'CARD' || mode === 'BANK_TRANSFER') ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                    Secure {selectedLabel} Gateway
                                </h4>
                                <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-[9px] font-black uppercase tracking-widest px-2 py-1">
                                    Gateway Verification
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">
                                        {mode === 'CARD' ? 'Cardholder Name' : 'Account Holder Name'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={mode === 'CARD' ? "Name on Card" : "Beneficiary Name"}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-11 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">
                                            {mode === 'CARD' ? 'Card Number (Last 4)' : 'Bank Name'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={mode === 'CARD' ? "tel" : "text"}
                                                maxLength={mode === 'CARD' ? 4 : 50}
                                                placeholder={mode === 'CARD' ? "XXXX" : "Bank Name"}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-11 px-4 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 dark:text-white font-mono"
                                            />
                                            {mode === 'CARD' ? (
                                                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                            ) : (
                                                <Landmark className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 block mb-1.5">
                                            {mode === 'CARD' ? 'Auth / Transaction Code' : 'UTR / Reference No'}
                                        </label>
                                        <input
                                            type="text"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="Required"
                                            className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl h-11 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-blue-700 dark:text-blue-400"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Standard View for UPI / CASH
                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1 flex-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Your <span className="text-blue-600">{selectedLabel}</span> Reference No
                                </label>
                                <input
                                    type="text"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder={
                                        mode === 'CASH' ? `Enter Receipt No / Remarks` :
                                            `Enter ${selectedLabel} Txn ID / UTR`
                                    }
                                    className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl h-14 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:opacity-30"
                                    required
                                />
                            </div>

                            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-white/50 dark:bg-black/20 rounded-xl border border-white/20 h-fit">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Verified Channel: {mode}</span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="md:w-1/3 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-500">Proof Type</label>
                                <select
                                    value={proofType}
                                    onChange={(e) => setProofType(e.target.value as any)}
                                    className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl h-14 px-4 text-xs font-black uppercase tracking-widest outline-none transition-all cursor-pointer text-blue-500 appearance-none"
                                >
                                    <option value="link" className="bg-slate-900 border-none">External Link</option>
                                    <option value="upload" className="bg-slate-900 border-none">Upload Screenshot</option>
                                </select>
                            </div>

                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    {proofType === 'link' ? 'Screenshot URL' : 'Select Proof File'}
                                </label>
                                {proofType === 'link' ? (
                                    <input
                                        type="url"
                                        value={typeof proof === 'string' ? proof : ''}
                                        onChange={(e) => setProof(e.target.value)}
                                        placeholder="https://link-to-screenshot.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:opacity-30"
                                    />
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="proof-upload"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setProof(file);
                                            }}
                                        />
                                        <label
                                            htmlFor="proof-upload"
                                            className="w-full bg-white/5 border border-white/10 border-dashed rounded-2xl h-14 px-4 text-sm font-bold flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-slate-400"
                                        >
                                            Click to Upload File
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <Button
                type="submit"
                disabled={loading || uploading || !selectedId}
                className={`w-full rounded-2xl h-16 font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-[0.98] transition-all ${!selectedId ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                    }`}
            >
                {loading || uploading ? (uploading ? 'Uploading Proof...' : 'Processing...') : `Submit ${selectedLabel || 'Payment'} Details`}
                {!loading && !uploading && selectedId && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
        </form>
    );
};
