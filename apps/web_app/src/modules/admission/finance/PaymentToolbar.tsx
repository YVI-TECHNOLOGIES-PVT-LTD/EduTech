import { useState } from 'react';
import type { PaymentRecord } from '../utils/finance.mapper';
import type { FinanceAction } from '../utils/finance.workflow';
import { Button } from '../../../components/ui/button';
import { CheckCircle2, XCircle, CreditCard, Receipt, RotateCcw, Clock } from 'lucide-react';

interface PaymentToolbarProps {
    record: PaymentRecord | null;
    canCollect?: boolean;
    canVerify?: boolean;
    canApprove?: boolean;
    canReject?: boolean;
    canReceipt?: boolean;
    isSubmitting?: boolean;
    onAction: (action: FinanceAction, payload?: Record<string, unknown>) => void;
}

export function PaymentToolbar({
    record,
    canCollect,
    canVerify,
    canApprove,
    canReject,
    canReceipt,
    isSubmitting,
    onAction,
}: PaymentToolbarProps) {
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('Cash');
    const [reference, setReference] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [remark, setRemark] = useState('');

    if (!record) {
        return (
            <div className="border border-dashed rounded-2xl p-6 text-center text-sm text-gray-400">
                Select a candidate to manage payments.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400">Payment Actions</h3>

            {canCollect && (
                <div className="space-y-2 pb-3 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="px-3 py-2 border rounded-xl text-xs" />
                        <select value={mode} onChange={e => setMode(e.target.value)} className="px-3 py-2 border rounded-xl text-xs">
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Bank_Transfer">Bank Transfer</option>
                            <option value="Online_Gateway">Online</option>
                        </select>
                    </div>
                    <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Transaction / cheque reference" className="w-full px-3 py-2 border rounded-xl text-xs" />
                    <Button size="sm" className="h-8 text-[10px] gap-1 bg-emerald-600 text-white" disabled={isSubmitting || !amount} onClick={() => onAction('collect_payment', { amount: Number(amount), paymentMode: mode, transactionNumber: reference, remark })}>
                        <CreditCard className="w-3.5 h-3.5" /> Collect Payment
                    </Button>
                </div>
            )}

            <input type="text" value={paymentId || record.paymentId || ''} onChange={e => setPaymentId(e.target.value)} placeholder="Payment ID (UUID) for verify/receipt" className="w-full px-3 py-2 border rounded-xl text-xs" />
            <textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="Finance remarks…" className="w-full px-3 py-2 border rounded-xl text-xs min-h-[50px]" />

            <div className="flex flex-wrap gap-2">
                {canVerify && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('verify_payment', { paymentId: paymentId || record.paymentId, remark })}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                    </Button>
                )}
                {canApprove && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('approve_payment', { remark })}>
                        Approve
                    </Button>
                )}
                {canReject && (
                    <>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 border-rose-200 text-rose-600" disabled={isSubmitting} onClick={() => onAction('reject_payment', { paymentId: paymentId || record.paymentId, remark })}>
                            <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('reverse_verification', { remark })}>
                            <RotateCcw className="w-3.5 h-3.5" /> Reverse
                        </Button>
                    </>
                )}
                {canReceipt && (
                    <>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting || !(paymentId || record.paymentId)} onClick={() => onAction('generate_receipt', { paymentId: paymentId || record.paymentId, remark })}>
                            <Receipt className="w-3.5 h-3.5" /> Receipt
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('mark_pending', { remark })}>
                            <Clock className="w-3.5 h-3.5" /> Mark Pending
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export default PaymentToolbar;
