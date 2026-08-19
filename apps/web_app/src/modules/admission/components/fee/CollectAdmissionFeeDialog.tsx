import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Banknote,
  Building2,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  User,
  GraduationCap,
  Calendar,
  DollarSign,
  Copy,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  useGetApplicationFeeQuery,
  useRecordApplicationPaymentMutation,
  ApplicationItem,
} from '@/shared/api/admission.api';
import { cn } from '@/lib/utils';

interface CollectAdmissionFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationItem | null;
  onSuccess?: (paymentResult?: any) => void;
}

export const CollectAdmissionFeeDialog: React.FC<CollectAdmissionFeeDialogProps> = ({
  open,
  onOpenChange,
  application,
  onSuccess,
}) => {
  const applicationId = application?.application_id || application?.id || '';

  const {
    data: feeData,
    isLoading: isFeeLoading,
    isFetching: isFeeFetching,
    error: feeError,
    refetch: refetchFee,
  } = useGetApplicationFeeQuery(applicationId, {
    skip: !open || !applicationId,
  });

  const [recordPayment, { isLoading: isSubmitting }] = useRecordApplicationPaymentMutation();

  // Form State
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank_transfer' | 'card' | 'upi'>('cash');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [cardLastFour, setCardLastFour] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'pending' | 'waived'>(
    'paid',
  );

  // Sync amount when feeData loads
  useEffect(() => {
    if (feeData) {
      const defaultTotal =
        feeData.total_fee || feeData.application_fee + feeData.processing_fee || 1200;
      setAmount(defaultTotal);
    }
  }, [feeData]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPaymentMode('cash');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setTransactionReference('');
      setCardName('');
      setCardLastFour('');
      setRemarks('');
      setPaymentStatus('paid');
    }
  }, [open]);

  if (!application) return null;

  const lead = application.lead;
  const studentName =
    application.student_name ||
    lead?.student_name ||
    [lead?.student_first_name, lead?.student_last_name].filter(Boolean).join(' ') ||
    'Applicant';
  const applicationNumber = application.application_number || 'APP-PENDING';
  const gradeName = application.grade_name || lead?.grade_name || '—';
  const academicYearName = application.academic_year?.academic_year_name || 'Current Academic Year';

  const bankDetails = feeData?.bank_details;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Fee amount must be greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMode === 'bank_transfer' && !transactionReference.trim()) {
      toast({
        title: 'Transaction Reference Required',
        description: 'Please enter the bank transfer UTR or transaction reference number.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await recordPayment({
        applicationId,
        amount: Number(amount),
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        transaction_reference: transactionReference.trim() || undefined,
        card_name: cardName.trim() || undefined,
        card_last_four: cardLastFour.trim() || undefined,
        remarks: remarks.trim() || undefined,
      }).unwrap();

      toast({
        title: 'Payment Recorded Successfully',
        description: `Admission fee of ₹${Number(amount).toLocaleString('en-IN')} collected for ${studentName}.`,
      });

      onSuccess?.(result);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Payment Recording Failed',
        description:
          err?.data?.error || err?.message || 'Unable to record payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/30 backdrop-blur-xs duration-100"
        className="w-[calc(100vw-32px)] sm:w-[680px] max-w-[680px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Collect Admission Fee
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Front Office fee desk collection and receipt generation.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 custom-scrollbar"
        >
          {/* Applicant & Fee Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  APPLICANT DETAILS
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {studentName}
                </h4>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    {applicationNumber}
                  </span>
                  <span>•</span>
                  <span>{gradeName}</span>
                  <span>•</span>
                  <span>{academicYearName}</span>
                </div>
              </div>

              {/* Authoritative Fee Display */}
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  TOTAL FEE DUE
                </span>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {isFeeLoading ? (
                    <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading fee...
                    </span>
                  ) : (
                    `₹${(feeData?.total_fee || amount).toLocaleString('en-IN')}`
                  )}
                </div>
                {feeData && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    App: ₹{feeData.application_fee} + Proc: ₹{feeData.processing_fee}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Payment Method *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2',
                  paymentMode === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  {paymentMode === 'cash' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Cash</div>
                  <div className="text-[10px] text-slate-500">Over-the-counter</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('bank_transfer')}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2',
                  paymentMode === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {paymentMode === 'bank_transfer' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Bank Transfer</div>
                  <div className="text-[10px] text-slate-500">NEFT / RTGS / IMPS</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('card')}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2',
                  paymentMode === 'card'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  {paymentMode === 'card' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Debit / Credit Card</div>
                  <div className="text-[10px] text-slate-500">POS Machine</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2',
                  paymentMode === 'upi'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <QrCode className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  {paymentMode === 'upi' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">UPI / QR</div>
                  <div className="text-[10px] text-slate-500">Instant Transfer</div>
                </div>
              </button>
            </div>
          </div>

          {/* Bank Transfer Static Institutional Details */}
          {paymentMode === 'bank_transfer' && bankDetails && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Institution Bank Account Details
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">
                  Official Remittance
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Bank Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {bankDetails.bankName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Account Name</span>
                  <span
                    className="font-semibold text-slate-900 dark:text-white truncate block"
                    title={bankDetails.accountName}
                  >
                    {bankDetails.accountName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Account Number</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {bankDetails.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankDetails.accountNumber, 'Account Number')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block">IFSC Code</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {bankDetails.ifscCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankDetails.ifscCode, 'IFSC Code')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label
                htmlFor="amount"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Amount Collected (₹) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="pl-8 text-sm font-bold font-mono h-10"
                />
              </div>
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <Label
                htmlFor="paymentDate"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Payment Date *
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="text-sm h-10"
              />
            </div>

            {/* Transaction Reference Number */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="txnRef"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {paymentMode === 'cash'
                  ? 'Cash Receipt / Voucher Ref (Optional)'
                  : paymentMode === 'bank_transfer'
                    ? 'Bank UTR / Transaction Reference *'
                    : paymentMode === 'upi'
                      ? 'UPI Transaction ID / Ref *'
                      : 'Card Transaction Reference / Slip ID *'}
              </Label>
              <Input
                id="txnRef"
                type="text"
                placeholder={
                  paymentMode === 'cash'
                    ? 'e.g., REC-CASH-001'
                    : paymentMode === 'bank_transfer'
                      ? 'e.g., UTR982018472910'
                      : 'e.g., TXN-9482019482'
                }
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                required={paymentMode !== 'cash'}
                className="text-sm font-mono h-10"
              />
            </div>

            {/* Card Details if mode === card */}
            {paymentMode === 'card' && (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="cardName"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Cardholder Name (Optional)
                  </Label>
                  <Input
                    id="cardName"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="text-sm h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="cardLastFour"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Card Last 4 Digits (Optional)
                  </Label>
                  <Input
                    id="cardLastFour"
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 4242"
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value.slice(0, 4))}
                    className="text-sm font-mono h-10"
                  />
                </div>
              </>
            )}

            {/* Settlement Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Status
              </Label>
              <Select value={paymentStatus} onValueChange={(val: any) => setPaymentStatus(val)}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid / Settled in Full</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="pending">Mark as Pending</SelectItem>
                  <SelectItem value="waived">Waived by Authority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="remarks"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Staff Remarks / Notes (Optional)
              </Label>
              <Textarea
                id="remarks"
                placeholder="Add any front desk collection notes or receipt remarks..."
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || amount <= 0}
            className="text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-5 shadow-sm min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Record Payment (₹{Number(amount).toLocaleString('en-IN')})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
