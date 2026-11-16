import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { apiClient } from '../lib/api-client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export type CheckoutPaymentStatus =
  | 'ready'
  | 'creating_order'
  | 'checkout_open'
  | 'payment_submitted'
  | 'verifying'
  | 'committed'
  | 'demo_verified'
  | 'pending_verification'
  | 'failed'
  | 'verification_unavailable';

export interface RazorpayCheckoutProps {
  amountInRupees?: number; // amount in INR (e.g. 500 for ₹500)
  amountInPaise?: number; // amount in paise (e.g. 50000 for ₹500)
  studentId?: string; // Optional: Link to production student
  studentChargeDueId?: string; // Optional: Link to production obligation due
  name?: string;
  description?: string;
  receipt?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  buttonText?: string;
  className?: string;
  themeColor?: string;
  onSuccess?: (verificationResult: any) => void;
  onError?: (error: any) => void;
  onDismiss?: () => void;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  amountInRupees = 500,
  amountInPaise,
  studentId,
  studentChargeDueId,
  name = 'EduTrack ERP',
  description = 'Fee Payment Checkout',
  receipt,
  notes,
  prefill = {
    name: 'Student Parent',
    email: 'parent@edutrack.edu',
    contact: '+91 9876543210',
  },
  buttonText,
  className,
  themeColor = '#6366f1',
  onSuccess,
  onError,
  onDismiss,
}) => {
  const [status, setStatus] = useState<CheckoutPaymentStatus>('ready');
  const [paymentResult, setPaymentResult] = useState<{
    orderId: string;
    paymentId: string;
    receiptNumber?: string;
    message?: string;
    isDemo?: boolean;
    transactionId?: string;
  } | null>(null);

  // Compute final paise amount (minimum 100 paise)
  const finalPaise = amountInPaise !== undefined ? amountInPaise : Math.round(amountInRupees * 100);

  const handleCheckout = async () => {
    // 1. Verify Razorpay SDK is loaded
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Razorpay SDK failed to load. Please verify your internet connection.');
      return;
    }

    setStatus('creating_order');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api';
      const baseApi = apiUrl.replace(/\/+$/, '');

      // STEP 1: Call Backend to Create Order (Server determines authoritative payable amount)
      const orderPayload: any = {
        amount: finalPaise,
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      };

      if (studentId && studentChargeDueId) {
        orderPayload.studentId = studentId;
        orderPayload.studentChargeDueId = studentChargeDueId;
      }

      let createOrderRes: any;
      try {
        createOrderRes = await apiClient.post('/create-order', orderPayload);
      } catch {
        createOrderRes = await axios.post(`${baseApi}/create-order`, orderPayload);
      }
      const orderData = createOrderRes.data;

      if (!orderData || !orderData.order_id) {
        throw new Error('Server failed to return a valid Razorpay order_id.');
      }

      const keyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || '';

      if (!keyId) {
        throw new Error('Razorpay Key ID is not configured on client or server.');
      }

      // STEP 2: Configure & Open Razorpay Standard Checkout Modal
      setStatus('checkout_open');

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        theme: {
          color: themeColor,
        },
        // Callback on successful payment in modal
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setStatus('verifying');
          try {
            // STEP 3: Call Backend to Authoritatively Verify Signature & Status
            let verifyRes: any;
            try {
              verifyRes = await apiClient.post('/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_order_id: orderData.payment_order_id,
              });
            } catch {
              verifyRes = await axios.post(`${baseApi}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_order_id: orderData.payment_order_id,
              });
            }

            const data = verifyRes.data;

            if (data?.success) {
              if (data.status === 'committed' && data.ledger_updated) {
                // Production ERP committed payment
                setStatus('committed');
                toast.success('Payment committed to EduTrack ledger!');
                setPaymentResult({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  receiptNumber: data.receipt_number || data.receipt?.receipt_no,
                  transactionId: data.transaction_id,
                  message: 'Payment committed to EduTrack ledger',
                  isDemo: false,
                });
              } else {
                // Standalone Sandbox Demo payment
                setStatus('demo_verified');
                toast.info('Gateway payment verified — demo only; EduTrack ledger not updated.');
                setPaymentResult({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  message: 'Gateway payment verified — demo only; EduTrack ledger not updated.',
                  isDemo: true,
                });
              }

              if (onSuccess) onSuccess(data);
            } else {
              setStatus('failed');
              toast.error(data?.message || 'Payment signature verification failed.');
              if (onError) onError(data);
            }
          } catch (verifyErr: any) {
            console.error('Signature verification error:', verifyErr);
            const errStatus = verifyErr.response?.status;
            const errMsg =
              verifyErr.response?.data?.message ||
              verifyErr.response?.data?.error ||
              'Payment verification failed.';

            if (errStatus === 503 || verifyErr.response?.data?.status === 'pending') {
              setStatus('verification_unavailable');
              toast.warning('Gateway verification unavailable. Payment is pending reconciliation.');
            } else {
              setStatus('failed');
              toast.error(errMsg);
            }

            if (onError) onError(verifyErr);
          }
        },
        modal: {
          ondismiss: () => {
            if (status !== 'committed' && status !== 'demo_verified') {
              setStatus('ready');
              toast.info('Payment checkout closed without completion.');
              if (onDismiss) onDismiss();
            }
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event from gateway
      rzpInstance.on('payment.failed', (failedResponse: any) => {
        setStatus('failed');
        const desc =
          failedResponse.error?.description ||
          failedResponse.error?.reason ||
          'Payment declined by gateway.';
        toast.error(`Payment Failed: ${desc}`);
        if (onError) onError(failedResponse);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Razorpay Checkout initialization error:', err);
      setStatus('ready');
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to initialize Razorpay checkout.';
      toast.error(errMsg);
      if (onError) onError(err);
    }
  };

  // State A: Committed to EduTrack Ledger
  if (status === 'committed' && paymentResult) {
    return (
      <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60 text-xs shadow-sm">
        <div className="flex items-center gap-1.5 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Payment committed to EduTrack</span>
        </div>
        <div className="text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
          Ref: {paymentResult.paymentId}
        </div>
        {paymentResult.receiptNumber && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 font-mono text-emerald-800 dark:text-emerald-200 font-semibold">
            <FileText className="w-3 h-3" />
            {paymentResult.receiptNumber}
          </span>
        )}
      </div>
    );
  }

  // State B: Sandbox Demo Verified (Truthful Badge)
  if (status === 'demo_verified' && paymentResult) {
    return (
      <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800/60 text-xs shadow-sm">
        <div className="flex items-center gap-1.5 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Gateway payment verified</span>
        </div>
        <span className="text-indigo-600 dark:text-indigo-300 italic text-[11px]">
          (Demo only; EduTrack ledger not updated)
        </span>
        <div className="text-indigo-700 dark:text-indigo-300 font-mono text-[11px]">
          Payment ID: {paymentResult.paymentId}
        </div>
      </div>
    );
  }

  // State C: Verification Unavailable / Pending Reconciliation
  if (status === 'verification_unavailable') {
    return (
      <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold block">Payment Pending Reconciliation</span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300">
            Gateway verification is temporarily unavailable. Please do not re-pay. Status will
            settle automatically.
          </span>
        </div>
        <button
          onClick={handleCheckout}
          className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-medium text-xs hover:bg-amber-300 transition"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    );
  }

  const isLoading = status === 'creating_order' || status === 'verifying';

  return (
    <button
      id="razorpay-pay-btn"
      type="button"
      onClick={handleCheckout}
      disabled={isLoading}
      className={
        className ||
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm hover:shadow active:scale-[0.98]'
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{status === 'creating_order' ? 'Creating order...' : 'Verifying payment...'}</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span>{buttonText || `Pay ₹${(finalPaise / 100).toLocaleString('en-IN')}`}</span>
        </>
      )}
    </button>
  );
};
