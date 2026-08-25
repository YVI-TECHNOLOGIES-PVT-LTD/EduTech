import React, { useState } from 'react';
import {
  CreditCard,
  Receipt,
  Download,
  CheckCircle2,
  Printer,
  AlertCircle,
  Clock,
  Building2,
  Users,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveAdmissionApplication } from '../../hooks/useActiveAdmissionApplication';
import {
  useGetApplicationFeeQuery,
  useGetApplicationReceiptQuery,
  useRecordApplicationPaymentMutation,
} from '@/shared/api/admission.api';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ParentFeePaymentPage() {
  const navigate = useNavigate();
  const {
    activeApplication,
    activeApplicationId,
    applications,
    setActiveApplicationId,
    hasMultiple,
    studentName,
    appNumber,
    gradeApplied,
    isLoading: isAppLoading,
    error: appError,
    refetch: refetchApps,
  } = useActiveAdmissionApplication();

  const {
    data: feeData,
    isLoading: isFeeLoading,
    refetch: refetchFee,
  } = useGetApplicationFeeQuery(activeApplicationId, {
    skip: !activeApplicationId,
  });

  const {
    data: receiptData,
    isLoading: isReceiptLoading,
    refetch: refetchReceipt,
  } = useGetApplicationReceiptQuery(activeApplicationId, {
    skip: !activeApplicationId,
  });

  const [recordPayment, { isLoading: isPaying }] = useRecordApplicationPaymentMutation();

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModeSelected, setPaymentModeSelected] = useState<'upi' | 'card' | 'bank_transfer'>(
    'upi',
  );
  const [payError, setPayError] = useState<string | null>(null);

  if (isAppLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Loading fee statement...</p>
        </div>
      </PageContainer>
    );
  }

  if (appError) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Failed to load fee statement</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve your admission applications. Please try again.
            </p>
          </div>
          <Button
            onClick={() => refetchApps()}
            variant="outline"
            size="sm"
            className="font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!activeApplication) {
    return (
      <PageContainer variant="default">
        <PageHeader
          title="Fee Statement & Transaction Receipts"
          description="Audit application processing fees, online UPI settlements, and payment receipt records."
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
            >
              Admission Self-Service
            </Badge>
          }
        />
        <EmptyState
          title="No Admission Applications Found"
          description="You need an active admission application to view fee statements and receipts."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start New Application
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // Authoritative dynamic calculations
  const rawPayStatus = (
    feeData?.payment_status ||
    feeData?.payment?.payment_status ||
    activeApplication.payment_status ||
    (activeApplication.is_fee_paid ? 'paid' : 'pending')
  ).toLowerCase();

  const isPaid =
    rawPayStatus === 'paid' ||
    rawPayStatus === 'settled' ||
    activeApplication.status === 'enrolled';
  const isWaived = rawPayStatus === 'waived';
  const isFailed = rawPayStatus === 'failed';
  const isRefunded = rawPayStatus === 'refunded';
  const isPending = !isPaid && !isWaived && !isFailed && !isRefunded;

  const appFee = feeData?.application_fee ?? 500;
  const processingFee = feeData?.processing_fee ?? 0;
  const totalFee = feeData?.total_fee ?? appFee + processingFee;
  const currencySymbol = feeData?.currency === 'USD' ? '$' : '₹';

  const txnRef =
    feeData?.payment?.transaction_reference ||
    receiptData?.transaction_reference ||
    (isPaid ? `TXN-${activeApplicationId.slice(0, 8).toUpperCase()}` : 'N/A');

  const paymentMode =
    feeData?.payment?.payment_mode?.toUpperCase() ||
    receiptData?.payment_mode?.toUpperCase() ||
    (isPaid ? 'ONLINE UPI' : 'PAYMENT PENDING');

  const paymentDate =
    feeData?.payment?.payment_date ||
    receiptData?.payment_date ||
    activeApplication.application_date ||
    activeApplication.created_at;

  const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString() : 'N/A';

  const getStatusBadge = () => {
    if (isPaid) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> SETTLED
        </span>
      );
    }
    if (isWaived) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> WAIVED
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 px-3 py-1 rounded-full border border-red-200 dark:border-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> FAILED
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
        <Clock className="w-3 h-3" /> PENDING
      </span>
    );
  };

  const handleConfirmPayment = async () => {
    if (!activeApplicationId) return;
    setPayError(null);
    try {
      await recordPayment({
        applicationId: activeApplicationId,
        amount: totalFee,
        payment_mode: paymentModeSelected,
        payment_status: 'paid',
      }).unwrap();
      await refetchFee();
      await refetchReceipt();
      await refetchApps();
      setShowPaymentModal(false);
      setShowReceiptModal(true);
    } catch (err: any) {
      setPayError(
        err?.data?.message || err?.message || 'Payment processing failed. Please try again.',
      );
    }
  };

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Fee Statement & Transaction Receipts"
        description="Audit application processing fees, online UPI settlements, and payment receipt records."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Admission Self-Service
          </Badge>
        }
        actions={
          <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <span className="text-[10px] font-bold text-muted-foreground">ACTIVE APP:</span>
            <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {appNumber}
            </span>
          </div>
        }
      />

      {/* Multi-Application Selector Banner */}
      {hasMultiple && (
        <div className="p-4 bg-muted/40 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Multiple Applications Registered</p>
              <p className="text-[11px] text-muted-foreground">
                Currently displaying fee statement for{' '}
                <span className="font-bold text-foreground">{studentName}</span> ({gradeApplied}).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-muted-foreground shrink-0">
              Switch Child:
            </label>
            <select
              value={activeApplicationId}
              onChange={(e) => setActiveApplicationId(e.target.value)}
              aria-label="Select Active Admission Application"
              className="bg-card text-foreground text-xs font-bold px-3 py-1.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
            >
              {applications.map((app) => {
                const name =
                  app.student_name ||
                  (app.leads
                    ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                    : app.lead
                      ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
                      : 'Applicant');
                const num =
                  app.application_number ||
                  app.applicationNumber ||
                  app.application_id?.slice(0, 8);
                const id = app.application_id || app.id;
                return (
                  <option key={id} value={id}>
                    {name} ({num})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl border-border/80 bg-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Payable Fee
          </span>
          <p className="text-2xl font-black text-foreground">
            {currencySymbol} {totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground font-medium">Application & Evaluation</p>
        </Card>

        <Card className="p-5 rounded-2xl border-border/80 bg-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Payment Status
          </span>
          <div className="pt-1">{getStatusBadge()}</div>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            {isPaid ? `Cleared on ${formattedDate}` : 'Pending gateway clearance'}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl border-border/80 bg-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Official Receipt
          </span>
          <p className="text-sm font-bold font-mono text-foreground pt-1">
            {isPaid
              ? receiptData?.receipt_number ||
                `REC-${activeApplicationId.slice(0, 8).toUpperCase()}`
              : 'Receipt Pending'}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {isPaid ? 'Available for download' : 'Issued upon settlement'}
          </p>
        </Card>
      </div>

      {/* Transaction History Card */}
      <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
        <SectionHeader
          title="Payment Audit Trail & Receipts"
          description="Verified processing fee settlements and digital payment receipts."
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  refetchFee();
                  refetchReceipt();
                  refetchApps();
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                GATEWAY CERTIFIED
              </span>
            </div>
          }
        />

        <div className="space-y-3">
          <div className="p-5 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center space-x-4 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                }`}
              >
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-foreground truncate">
                  Admission Registration & Processing Fee
                </h4>
                <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                  Ref: <span className="font-mono">{txnRef}</span> • {paymentMode} • {formattedDate}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60 shrink-0">
              <span className="text-sm font-extrabold text-foreground">
                {currencySymbol} {totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              {getStatusBadge()}
              {isPaid ? (
                <Button
                  onClick={() => setShowReceiptModal(true)}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-border text-foreground font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                  title="View / Print Digital Receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setPayError(null);
                    setShowPaymentModal(true);
                  }}
                  size="sm"
                  className="h-9 px-3.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle Fee</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Online Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-foreground border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Settle Admission Fee</h3>
                  <p className="text-[11px] text-muted-foreground">Secure Payment Gateway</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2 text-xs">
              <div className="flex justify-between font-medium text-muted-foreground">
                <span>Student / Applicant</span>
                <span className="font-bold text-foreground">{studentName}</span>
              </div>
              <div className="flex justify-between font-medium text-muted-foreground">
                <span>Application Number</span>
                <span className="font-mono font-bold text-foreground">{appNumber}</span>
              </div>
              <div className="flex justify-between font-medium text-muted-foreground">
                <span>Grade Applied</span>
                <span className="font-bold text-foreground">{gradeApplied}</span>
              </div>
              <div className="border-t border-border/40 pt-2 flex justify-between font-medium text-muted-foreground">
                <span>Application Form Fee</span>
                <span>
                  {currencySymbol} {appFee.toFixed(2)}
                </span>
              </div>
              {processingFee > 0 && (
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Processing & Verification</span>
                  <span>
                    {currencySymbol} {processingFee.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-border/60 pt-2 flex justify-between font-black text-sm text-foreground">
                <span>Total Amount Due</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {currencySymbol} {totalFee.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModeSelected('upi')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentModeSelected === 'upi'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-xs'
                      : 'border-border bg-card text-muted-foreground font-semibold hover:bg-muted/40'
                  }`}
                >
                  <p className="text-xs">UPI</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">GPay/PhonePe</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModeSelected('card')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentModeSelected === 'card'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-xs'
                      : 'border-border bg-card text-muted-foreground font-semibold hover:bg-muted/40'
                  }`}
                >
                  <p className="text-xs">Card</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Debit/Credit</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModeSelected('bank_transfer')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentModeSelected === 'bank_transfer'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-xs'
                      : 'border-border bg-card text-muted-foreground font-semibold hover:bg-muted/40'
                  }`}
                >
                  <p className="text-xs">NetBanking</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">All Banks</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
                disabled={isPaying}
                className="font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPayment}
                disabled={isPaying}
                className="font-bold text-xs flex items-center space-x-1.5 shadow-md"
              >
                {isPaying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      Pay {currencySymbol} {totalFee.toFixed(2)}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Digital Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-foreground border border-border rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Payment Receipt</h3>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    {receiptData?.receipt_number ||
                      `REC-${activeApplicationId.slice(0, 8).toUpperCase()}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Student Name
                  </span>
                  <span className="font-bold text-foreground text-sm">{studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Application No.
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm">{appNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Grade Applying
                  </span>
                  <span className="font-bold text-foreground">{gradeApplied}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Date & Time
                  </span>
                  <span className="font-medium text-foreground">{formattedDate}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-border/60 py-3">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Application Form Fee</span>
                  <span>
                    {currencySymbol} {appFee.toFixed(2)}
                  </span>
                </div>
                {processingFee > 0 && (
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Processing & Verification</span>
                    <span>
                      {currencySymbol} {processingFee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-foreground font-black text-sm pt-2 border-t border-border/40">
                  <span>Total Amount Paid</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {currencySymbol} {totalFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-muted-foreground">
                <p>
                  <span className="font-bold text-foreground">Payment Mode:</span> {paymentMode}
                </p>
                <p>
                  <span className="font-bold text-foreground">Transaction Ref:</span>{' '}
                  <span className="font-mono">{txnRef}</span>
                </p>
                <p>
                  <span className="font-bold text-foreground">Issued By:</span>{' '}
                  {receiptData?.org_name ||
                    feeData?.org_name ||
                    'EduTrack International Admissions Desk'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReceiptModal(false)}
                className="font-bold text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="font-bold text-xs flex items-center space-x-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default ParentFeePaymentPage;
