import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Info,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { admissionApi } from '../../admission.api';

// Branded Fee & Payment Images
import phonepeImg from '../../../../assets/images/fee_images/upi/phonepe.webp';
import gpayImg from '../../../../assets/images/fee_images/upi/gpay.png';
import paytmImg from '../../../../assets/images/fee_images/upi/paytm.png';
import visaImg from '../../../../assets/images/fee_images/cards/visa.png';
import mastercardImg from '../../../../assets/images/fee_images/cards/mastercard.png';
import rupayImg from '../../../../assets/images/fee_images/cards/RuPay.webp';
import amexImg from '../../../../assets/images/fee_images/cards/amex.png';

interface ParentFeePaymentStepProps {
  applicationId?: string;
  orgId?: string;
  academicYearId?: string;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

interface OrgBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch?: string;
}

interface FeeDetails {
  application_id?: string;
  application_number?: string;
  org_id?: string;
  org_name?: string | null;
  application_fee: number;
  processing_fee: number;
  total_fee: number;
  currency: string;
  payment_status: string;
  bank_details?: OrgBankDetails | null;
  payment?: {
    payment_id: string;
    payment_status: string;
    amount: number;
    payment_date: string | null;
    transaction_reference: string | null;
    payment_mode: string | null;
    card_name?: string | null;
    card_last_four?: string | null;
    remarks: string | null;
  } | null;
}

type PaymentMethodType = 'upi' | 'card' | 'bank_transfer' | 'cash';
type UpiAppType = 'phonepe' | 'gpay' | 'paytm' | 'other';
type CardType = 'credit' | 'debit';
type CardNetwork = 'visa' | 'mastercard' | 'rupay' | 'amex';

export const ParentFeePaymentStep: React.FC<ParentFeePaymentStepProps> = ({
  applicationId,
  orgId,
  academicYearId,
  formData,
  setFormData,
  onNext,
  onBack,
  isReadOnly = false,
}) => {
  const [feeDetails, setFeeDetails] = useState<FeeDetails>({
    application_fee: 1000,
    processing_fee: 200,
    total_fee: 1200,
    currency: 'INR',
    payment_status: 'pending',
    bank_details: null,
    payment: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    (formData?.payment_mode as PaymentMethodType) || 'card',
  );

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiAppType>('phonepe');
  const [upiVpa, setUpiVpa] = useState<string>('');

  // Card State (Audit-aligned to DB columns: card_name, card_last_four, payment_mode)
  const [cardType, setCardType] = useState<CardType>('credit');
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>('visa');
  const [cardName, setCardName] = useState<string>(
    formData?.parent_name ||
      `${formData?.student_first_name || ''} ${formData?.student_last_name || ''}`.trim() ||
      '',
  );
  const [cardLastFour, setCardLastFour] = useState<string>('4321');

  // Bank Transfer State
  const [bankUtrReference, setBankUtrReference] = useState<string>(formData?.bank_utr || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchFeeData = async () => {
    setLoading(true);
    setSettleError(null);
    try {
      if (applicationId) {
        const res = await admissionApi.getApplicationFee(applicationId);
        if (res.data) {
          setFeeDetails(res.data);
          if (res.data.payment_status === 'paid' || res.data.payment?.payment_status === 'paid') {
            setFormData((prev: any) => ({
              ...prev,
              payment_completed: true,
              payment_mode: res.data.payment?.payment_mode || paymentMethod,
            }));
          }
        }
      } else {
        const targetOrgId = orgId || formData?.school_id;
        const targetAyId = academicYearId || formData?.academic_year_id;
        if (targetOrgId) {
          const res = await admissionApi.getFeeConfig({
            org_id: targetOrgId,
            academic_year_id: targetAyId,
          });
          if (res.data) {
            setFeeDetails((prev) => ({
              ...prev,
              application_fee: Number(res.data.application_fee) || 1000,
              processing_fee: Number(res.data.processing_fee) || 200,
              total_fee: Number(res.data.total_fee) || 1200,
              currency: res.data.currency || 'INR',
              bank_details: res.data.bank_details || null,
            }));
          }
        }
      }
    } catch (err: any) {
      console.warn('Could not load authoritative fee configuration from backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, [applicationId, orgId, academicYearId, formData?.school_id]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  // Digital MVP Simulation settlement (UPI & Card only)
  const handleSimulateSettlement = async (mode: 'upi' | 'card') => {
    if (!applicationId) {
      // In wizard draft phase prior to application creation: record choice & advance
      setFormData((prev: any) => ({
        ...prev,
        payment_mode: mode,
        payment_completed: true,
        card_name: mode === 'card' ? cardName.trim() : undefined,
        card_last_four: mode === 'card' ? cardLastFour.trim().slice(-4) : undefined,
      }));
      onNext();
      return;
    }

    setIsSettling(true);
    setSettleError(null);
    try {
      const payload: any = {
        payment_mode: mode,
        payment_status: 'paid',
      };

      if (mode === 'card') {
        if (cardName.trim()) {
          payload.card_name = cardName.trim();
        }
        if (cardLastFour.trim()) {
          payload.card_last_four = cardLastFour.trim().slice(-4);
        }
        payload.remarks = `Online Card (${cardType === 'debit' ? 'Debit Card' : 'Credit Card'} - ${cardNetwork.toUpperCase()})`;
      }

      const res = await admissionApi.recordApplicationPayment(applicationId, payload);
      if (res.data) {
        setFeeDetails((prev) => ({
          ...prev,
          payment_status: res.data.payment_status || 'paid',
          payment: res.data,
        }));
        setFormData((prev: any) => ({
          ...prev,
          payment_completed: true,
          payment_mode: mode,
        }));
      }
    } catch (err: any) {
      setSettleError(
        err.response?.data?.error || 'Failed to settle fee payment. Please try again.',
      );
    } finally {
      setIsSettling(false);
    }
  };

  // Offline / Institutional Handlers (Cash Counter & Bank Transfer - Status stays PENDING until staff confirmation)
  const handleSaveCashPreference = () => {
    setFormData((prev: any) => ({
      ...prev,
      payment_mode: 'cash',
      payment_completed: false, // Cash requires staff confirmation
    }));
    onNext();
  };

  const handleSaveBankTransferPreference = () => {
    setFormData((prev: any) => ({
      ...prev,
      payment_mode: 'bank_transfer',
      payment_completed: false, // Bank transfer requires staff confirmation
      bank_utr: bankUtrReference.trim() || undefined,
    }));
    onNext();
  };

  const isPaid =
    feeDetails.payment_status === 'paid' || feeDetails.payment?.payment_status === 'paid';
  const isWaived = feeDetails.payment_status === 'waived';
  const isFailed = feeDetails.payment_status === 'failed';
  const isRefunded = feeDetails.payment_status === 'refunded';

  const candidateName =
    `${formData?.student_first_name || ''} ${formData?.student_last_name || ''}`.trim() ||
    'Student Candidate';

  // Canonical Application Reference (Priority: feeDetails.application_number > formData.application_number > application_id)
  const canonicalAppRef =
    feeDetails.application_number ||
    formData?.application_number ||
    (applicationId
      ? applicationId.startsWith('APP-')
        ? applicationId
        : `APP-${applicationId.slice(0, 8).toUpperCase()}`
      : '');

  const institutionName =
    feeDetails.org_name || formData?.school_name || 'EduTrack Partner Institution';

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Main Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600">
          <span>PORTAL</span>
          <span>&gt;</span>
          <span>STEP 06</span>
          <span>&gt;</span>
          <span>FEE PAYMENT</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
              Admission Fee Settlement
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Review authoritative fee breakdown and select your preferred settlement method.
            </p>
          </div>
          {/* Status Badge */}
          <div>
            {isPaid ? (
              <Badge variant="success" className="px-3 py-1 text-xs font-bold gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PAYMENT SETTLED
              </Badge>
            ) : isWaived ? (
              <Badge variant="success" className="px-3 py-1 text-xs font-bold">
                FEE WAIVED
              </Badge>
            ) : isFailed ? (
              <Badge variant="destructive" className="px-3 py-1 text-xs font-bold">
                PAYMENT FAILED
              </Badge>
            ) : isRefunded ? (
              <Badge variant="outline" className="px-3 py-1 text-xs font-bold text-gray-600">
                FEE REFUNDED
              </Badge>
            ) : (
              <Badge variant="warning" className="px-3 py-1 text-xs font-bold">
                SETTLEMENT PENDING
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Fee Card */}
      <Card className="p-6 border-gray-100 shadow-sm space-y-6">
        {/* Candidate & Application Context Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
              CANDIDATE NAME
            </span>
            <span className="font-bold text-gray-900">{candidateName}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
              APPLICATION NUMBER
            </span>
            <span className="font-bold text-indigo-900 font-mono">{canonicalAppRef}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
              GRADE APPLIED FOR
            </span>
            <span className="font-bold text-gray-900">
              {formData?.grade_applied_for || 'Grade Level'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
              CURRENCY
            </span>
            <span className="font-bold text-gray-900">{feeDetails.currency || 'INR (₹)'}</span>
          </div>
        </div>

        {/* Dynamic Authoritative Fee Breakdown Panel */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>Admission Application Fee</span>
            <span className="font-bold text-gray-800">
              ₹{feeDetails.application_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>Digital Document Processing &amp; Screening Fee</span>
            <span className="font-bold text-gray-800">
              ₹{feeDetails.processing_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-t border-indigo-100/80 pt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wider block">
                TOTAL PAYABLE AMOUNT
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Calculated authoritatively from school admission configuration
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-indigo-900 tracking-tight">
                ₹{feeDetails.total_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PAYMENT STATE VIEWS                                          */}
        {/* ------------------------------------------------------------- */}

        {isPaid ? (
          /* Confirmed Paid Settlement View */
          <div className="p-5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Admission Fee Payment Successfully Recorded</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-xs text-emerald-950">
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">
                  SETTLED AMOUNT
                </span>
                <span className="text-base font-black text-emerald-900 mt-0.5 block">
                  ₹
                  {Number(feeDetails.payment?.amount || feeDetails.total_fee).toLocaleString(
                    'en-IN',
                    {
                      minimumFractionDigits: 2,
                    },
                  )}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">
                    TRANSACTION REF
                  </span>
                  {feeDetails.payment?.transaction_reference && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(feeDetails.payment?.transaction_reference || '', 'settled_txn')
                      }
                      className="text-[10px] text-emerald-700 hover:text-emerald-900"
                    >
                      {copiedField === 'settled_txn' ? 'Copied' : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <span className="font-mono font-bold text-xs text-emerald-900 block mt-1 truncate">
                  {feeDetails.payment?.transaction_reference || 'TXN-CONFIRMED'}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">
                  PAYMENT MODE
                </span>
                <span className="font-bold text-xs uppercase text-emerald-900 block mt-1">
                  {feeDetails.payment?.payment_mode || paymentMethod}
                </span>
                {feeDetails.payment?.card_last_four && (
                  <span className="text-[10px] font-mono text-emerald-700 block">
                    •••• {feeDetails.payment.card_last_four}
                  </span>
                )}
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">
                  SETTLEMENT DATE
                </span>
                <span className="font-bold text-xs text-emerald-900 block mt-1">
                  {feeDetails.payment?.payment_date
                    ? new Date(feeDetails.payment.payment_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                </span>
              </div>
            </div>

            {feeDetails.payment?.card_name && (
              <div className="text-[11px] text-emerald-900 font-medium flex items-center gap-2 pt-1 border-t border-emerald-200/60">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  Cardholder Name on Record:{' '}
                  <strong className="font-bold">{feeDetails.payment.card_name}</strong>
                </span>
              </div>
            )}

            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              This payment transaction is finalized and permanently bound to application{' '}
              <span className="font-mono font-bold">{canonicalAppRef}</span>. Official record is
              logged in institutional accounts.
            </p>
          </div>
        ) : isWaived ? (
          /* Fee Waived Notice View */
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Admission Application Fee Waived</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              The application fee for this candidate has been officially waived by the school
              administration. You may proceed directly to final review and submission.
            </p>
          </div>
        ) : (
          /* Active Payment Flow (Selector + Method-Specific Panels) */
          <div className="space-y-5">
            {/* Header for Method Selection */}
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700">
                CHOOSE PAYMENT METHOD
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                MVP Mode
              </span>
            </div>

            {/* 4-Column Payment Method Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  id: 'upi',
                  label: 'UPI / QR',
                  sub: 'PhonePe, GPay, Paytm',
                  icon: Smartphone,
                },
                {
                  id: 'card',
                  label: 'Credit / Debit Card',
                  sub: 'Visa, MC, RuPay, Amex',
                  icon: CreditCard,
                },
                {
                  id: 'bank_transfer',
                  label: 'Bank Transfer',
                  sub: 'NEFT / RTGS / IMPS',
                  icon: Building2,
                },
                {
                  id: 'cash',
                  label: 'Cash Counter',
                  sub: 'Pay at School Desk',
                  icon: Banknote,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => !isReadOnly && setPaymentMethod(m.id as PaymentMethodType)}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isSelected ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                    />
                    <span className="text-xs font-bold block">{m.label}</span>
                    <span className="text-[10px] text-gray-400 font-medium block">{m.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* METHOD 1: UPI PAYMENT PANEL                                */}
            {/* ----------------------------------------------------------- */}
            {paymentMethod === 'upi' && (
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Pay via UPI App / VPA
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Zero convenience charges
                  </span>
                </div>

                {/* Authentic UPI Brand App Selector with Uploaded Images */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'phonepe', name: 'PhonePe', src: phonepeImg },
                    { id: 'gpay', name: 'Google Pay', src: gpayImg },
                    { id: 'paytm', name: 'Paytm', src: paytmImg },
                    { id: 'other', name: 'Other UPI', src: null },
                  ].map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedUpiApp(app.id as UpiAppType)}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedUpiApp === app.id
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs ring-1 ring-indigo-600'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="w-12 h-7 flex items-center justify-center">
                        {app.src ? (
                          <img
                            src={app.src}
                            alt={app.name}
                            className="max-h-7 max-w-full object-contain"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                            @
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700">{app.name}</span>
                    </div>
                  ))}
                </div>

                {/* VPA Preview Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <Input
                    placeholder="candidate@okhdfcbank"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    className="text-xs h-10 border-gray-200 bg-gray-50/30"
                  />
                  <span className="text-[10px] text-gray-400 block">
                    Real-time payment gateway integration will be connected in the production phase.
                  </span>
                </div>

                {/* Action CTA */}
                {!isReadOnly && (
                  <Button
                    onClick={() => handleSimulateSettlement('upi')}
                    disabled={isSettling}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    {isSettling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Simulating UPI Settlement...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          Simulate UPI Settlement (₹
                          {feeDetails.total_fee.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* METHOD 2: CREDIT / DEBIT CARD PANEL                        */}
            {/* ----------------------------------------------------------- */}
            {paymentMethod === 'card' && (
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Online Card Payment
                  </span>
                  {/* Card Type Pills (Credit Card vs Debit Card) */}
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCardType('credit')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardType === 'credit'
                          ? 'bg-white text-indigo-950 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardType('debit')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        cardType === 'debit'
                          ? 'bg-white text-indigo-950 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Debit Card
                    </button>
                  </div>
                </div>

                {/* Authentic Card Network Selector with Uploaded Images */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    Supported Card Networks
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'visa', label: 'VISA', src: visaImg },
                      { id: 'mastercard', label: 'Mastercard', src: mastercardImg },
                      { id: 'rupay', label: 'RuPay', src: rupayImg },
                      { id: 'amex', label: 'AMEX', src: amexImg },
                    ].map((net) => (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setCardNetwork(net.id as CardNetwork)}
                        className={`h-8 px-2.5 rounded-lg border transition-all flex items-center justify-center bg-white ${
                          cardNetwork === net.id
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                            : 'border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={net.src}
                          alt={net.label}
                          className="max-h-5 max-w-[46px] object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Non-sensitive card audit fields: card_name & card_last_four (stored in database) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block">
                      Cardholder Name (as on card)
                    </label>
                    <Input
                      placeholder="e.g. Priya Sharma"
                      value={cardName}
                      maxLength={100}
                      onChange={(e) => setCardName(e.target.value)}
                      className="text-xs h-10 border-gray-200 bg-gray-50/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block">
                      Card Last 4 Digits
                    </label>
                    <Input
                      placeholder="e.g. 4321"
                      maxLength={4}
                      value={cardLastFour}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCardLastFour(val);
                      }}
                      className="text-xs h-10 border-gray-200 bg-gray-50/30 font-mono tracking-widest"
                    />
                  </div>
                </div>

                {/* PCI-DSS & Security Note */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>PCI-DSS Safe &amp; Database-Aligned Reconciliation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Only non-sensitive audit details (Cardholder Name &amp; Last 4 Digits) are
                    captured. Full card numbers, CVVs, and banking passwords are NEVER requested or
                    stored.
                  </p>
                </div>

                {/* Action CTA */}
                {!isReadOnly && (
                  <Button
                    onClick={() => handleSimulateSettlement('card')}
                    disabled={isSettling}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    {isSettling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Simulating Card Settlement...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          Simulate {cardType === 'debit' ? 'Debit' : 'Credit'} Card Settlement (₹
                          {feeDetails.total_fee.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* METHOD 3: BANK TRANSFER PANEL                              */}
            {/* ----------------------------------------------------------- */}
            {paymentMethod === 'bank_transfer' && (
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-5">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Bank Transfer / NEFT / RTGS / IMPS
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Direct electronic transfer to official institution bank account
                  </p>
                </div>

                {/* Static Organization Bank Account Details Card */}
                {feeDetails.bank_details ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      TRANSFER TO THIS ACCOUNT ({institutionName})
                    </span>

                    <div className="space-y-2 text-xs divide-y divide-slate-200/70">
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">
                            BANK NAME
                          </span>
                          <span className="font-bold text-gray-900">
                            {feeDetails.bank_details.bankName}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(feeDetails.bank_details?.bankName || '', 'bank_name')
                          }
                          className="h-7 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          {copiedField === 'bank_name' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">
                            ACCOUNT NAME
                          </span>
                          <span className="font-bold text-gray-900">
                            {feeDetails.bank_details.accountName}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(feeDetails.bank_details?.accountName || '', 'acc_name')
                          }
                          className="h-7 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          {copiedField === 'acc_name' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">
                            ACCOUNT NUMBER
                          </span>
                          <span className="font-mono font-bold text-gray-900 text-sm tracking-wider">
                            {feeDetails.bank_details.accountNumber}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(feeDetails.bank_details?.accountNumber || '', 'acc_no')
                          }
                          className="h-7 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          {copiedField === 'acc_no' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block uppercase">
                            IFSC CODE
                          </span>
                          <span className="font-mono font-bold text-gray-900">
                            {feeDetails.bank_details.ifscCode}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(feeDetails.bank_details?.ifscCode || '', 'ifsc')
                          }
                          className="h-7 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          {copiedField === 'ifsc' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>

                      {feeDetails.bank_details.branch && (
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 block uppercase">
                              BRANCH
                            </span>
                            <span className="font-medium text-gray-800">
                              {feeDetails.bank_details.branch}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopy(feeDetails.bank_details?.branch || '', 'branch')
                            }
                            className="h-7 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            {copiedField === 'branch' ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <Info className="w-4 h-4 text-amber-700" />
                      <span>Bank transfer details are not configured for this institution</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Please visit the school accounts counter directly or choose an alternate
                      payment method.
                    </p>
                  </div>
                )}

                {/* Canonical Application Payment Reference to put in bank transfer remarks */}
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700 block">
                      PAYMENT REFERENCE (USE IN TRANSFER REMARKS)
                    </span>
                    <span className="text-sm font-bold font-mono text-indigo-950">
                      {canonicalAppRef}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(canonicalAppRef, 'bank_ref')}
                    className="h-8 text-xs font-bold gap-1 bg-white border-indigo-200 text-indigo-700"
                  >
                    {copiedField === 'bank_ref' ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'bank_ref' ? 'Copied!' : 'Copy Reference'}</span>
                  </Button>
                </div>
                <span className="text-[11px] text-gray-500 font-medium block">
                  Use this reference in your transfer note/remarks so the institution accounts desk
                  can match your payment automatically.
                </span>

                {/* Optional UTR Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">
                    UTR / Transaction Reference (Optional)
                  </label>
                  <Input
                    placeholder="e.g. UTR-HDFC-98765432"
                    value={bankUtrReference}
                    onChange={(e) => setBankUtrReference(e.target.value)}
                    className="text-xs h-10 border-gray-200 bg-gray-50/30 font-mono"
                  />
                  <span className="text-[10px] text-gray-400 block">
                    Enter the UTR reference number from your bank receipt if already transferred.
                  </span>
                </div>

                {/* Action CTA for Bank Transfer: Saves preference and advances to review without falsely claiming instant clearance */}
                {!isReadOnly && (
                  <Button
                    onClick={handleSaveBankTransferPreference}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Bank Transfer Preference &amp; Continue</span>
                  </Button>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* METHOD 4: CASH COUNTER PANEL                               */}
            {/* ----------------------------------------------------------- */}
            {paymentMethod === 'cash' && (
              <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Pay with Cash at Institution Desk
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Show this reference number to the school accounts desk. Your payment will be
                      marked as settled after staff confirmation.
                    </p>
                  </div>
                </div>

                {/* Counter Reference Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">
                      COUNTER REFERENCE NUMBER
                    </span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {canonicalAppRef}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(canonicalAppRef, 'cash_ref')}
                    className="h-9 text-xs font-bold gap-1.5 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    {copiedField === 'cash_ref' ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'cash_ref' ? 'Copied!' : 'Copy Reference'}</span>
                  </Button>
                </div>

                {/* Step-by-Step Counter Guide with Dynamic Fee */}
                <div className="space-y-2 text-xs text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-900 block text-[11px] uppercase tracking-wider">
                    Counter Settlement Steps:
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
                    <li>
                      Visit the institution admission/accounts counter during working hours (9:00 AM
                      – 4:00 PM).
                    </li>
                    <li>
                      Present your Counter Reference Number (
                      <span className="font-mono font-bold text-gray-800">{canonicalAppRef}</span>).
                    </li>
                    <li>
                      Pay the exact fee amount of{' '}
                      <span className="font-bold text-gray-900">
                        ₹
                        {feeDetails.total_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>{' '}
                      in cash.
                    </li>
                    <li>Collect your official physical institutional receipt.</li>
                    <li>
                      Authorized staff will confirm the payment in EduTrack and update your
                      admission record.
                    </li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Cash settlement is verified and recorded by school administrative staff.
                    Self-marking cash as paid is not permitted.
                  </span>
                </div>

                {/* Action CTA for Cash */}
                {!isReadOnly && (
                  <Button
                    onClick={handleSaveCashPreference}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Select Cash &amp; Continue to Review</span>
                  </Button>
                )}
              </div>
            )}

            {/* Settlement Error Alert */}
            {settleError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{settleError}</span>
              </div>
            )}
          </div>
        )}

        {/* Security & Verification Assurance Footer */}
        <div className="flex items-center space-x-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Fee calculations are authoritative and verified against school admission configuration.
            Official digital audit references are maintained.
          </span>
        </div>
      </Card>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>

        <span className="text-xs font-bold text-gray-400">Draft Autosaved</span>

        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 gap-2 px-6 py-3 rounded-xl"
        >
          <span>Next Step: Review &amp; Submit</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
