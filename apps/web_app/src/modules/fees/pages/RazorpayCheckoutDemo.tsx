import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Code2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { RazorpayCheckout } from '../../../components/RazorpayCheckout';

const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm transition-all';
const GLASS_PANEL =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 sm:p-5';

export const RazorpayCheckoutDemo: React.FC = () => {
  const [amountRupees, setAmountRupees] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('500');
  const [payerName, setPayerName] = useState<string>('Aarav Sharma');
  const [payerEmail, setPayerEmail] = useState<string>('aarav.sharma@edutrack.edu');
  const [payerPhone, setPayerPhone] = useState<string>('+91 9876543210');
  const [feeCategory, setFeeCategory] = useState<string>('Tuition Fee - Term 1');

  const [verifiedPayment, setVerifiedPayment] = useState<{
    order_id: string;
    payment_id: string;
    signature: string;
    verifiedAt: string;
  } | null>(null);

  const presetAmounts = [1, 100, 500, 1500, 5000];

  const handlePresetSelect = (amt: number) => {
    setAmountRupees(amt);
    setCustomAmount(amt.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 1) {
      setAmountRupees(num);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Razorpay Standard Web Checkout
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Test Key Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Razorpay Payment Gateway Integration
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Complete Standard Checkout workflow: Order Creation &rarr; Checkout Modal &rarr; HMAC-SHA256 Signature Verification.
            </p>
          </div>

          <div className="text-xs text-right hidden sm:block">
            <span className="text-slate-400 font-mono">Key ID:</span>
            <div className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
              {import.meta.env.VITE_RAZORPAY_KEY_ID || 'Configured via .env'}
            </div>
          </div>
        </div>

        {/* Integration Architecture Card */}
        <div className={`${GLASS_PANEL} grid grid-cols-1 md:grid-cols-3 gap-4 text-xs`}>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Backend Order Creation</p>
              <p className="text-slate-500 mt-0.5 font-mono">POST /api/create-order</p>
              <p className="text-slate-400 text-[11px] mt-1">Generates official gateway order in paise (min 100 paise)</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Standard Web Checkout</p>
              <p className="text-slate-500 mt-0.5 font-mono">checkout.razorpay.com</p>
              <p className="text-slate-400 text-[11px] mt-1">Interactive modal with UPI, Card, Net Banking & Wallets</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">HMAC-SHA256 Verification</p>
              <p className="text-slate-500 mt-0.5 font-mono">POST /api/verify-payment</p>
              <p className="text-slate-400 text-[11px] mt-1">Timing-safe signature validation protects ledger integrity</p>
            </div>
          </div>
        </div>

        {/* Main Interactive Checkout Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Payment Parameters */}
          <div className={`lg:col-span-7 ${GLASS_CARD} space-y-6`}>
            <div>
              <h2 className="text-lg font-bold">Payment Configuration</h2>
              <p className="text-xs text-slate-500">Configure amount and customer attributes for this test transaction.</p>
            </div>

            {/* Quick Amount Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Select Amount</label>
              <div className="flex flex-wrap gap-2">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetSelect(amt)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      amountRupees === amt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Field */}
            <div className="space-y-1.5">
              <label htmlFor="custom-amount" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Amount in Rupees (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  ₹
                </span>
                <input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Calculated paise for gateway order:{' '}
                <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                  {Math.round((amountRupees || 0) * 100)} paise
                </span>{' '}
                (minimum 100 paise)
              </p>
            </div>

            {/* Payer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-white/5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Student / Payer Name</label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fee Purpose</label>
                <input
                  type="text"
                  value={feeCategory}
                  onChange={(e) => setFeeCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Trigger Checkout Button Component */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Payable:</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  ₹{(amountRupees || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <RazorpayCheckout
                amountInRupees={amountRupees}
                name="EduTrack ERP"
                description={feeCategory}
                receipt={`rcpt_${Date.now()}`}
                prefill={{
                  name: payerName,
                  email: payerEmail,
                  contact: payerPhone,
                }}
                buttonText={`Pay ₹${(amountRupees || 0).toLocaleString('en-IN')} via Razorpay`}
                onSuccess={(res) => {
                  setVerifiedPayment({
                    order_id: res.order_id,
                    payment_id: res.payment_id,
                    signature: res.signature,
                    verifiedAt: new Date().toLocaleTimeString(),
                  });
                }}
              />
            </div>
          </div>

          {/* Right Column: Live Verification Status & Transaction Receipt */}
          <div className="lg:col-span-5 space-y-6">
            {verifiedPayment ? (
              <div className={`${GLASS_CARD} border-indigo-500/30 bg-indigo-500/5 space-y-4`}>
                <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>Gateway payment verified — demo only; EduTrack ledger not updated.</span>
                </div>

                <p className="text-xs text-slate-500">
                  The payment signature was cryptographically validated using HMAC-SHA256 and authoritatively verified with the Razorpay API. As this is a sandbox demo transaction, no production student fee balances were altered.
                </p>

                <div className="space-y-2.5 text-xs font-mono bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                  <div>
                    <span className="text-slate-400">Payment ID:</span>
                    <p className="text-slate-900 dark:text-white font-semibold truncate">{verifiedPayment.payment_id}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Order ID:</span>
                    <p className="text-slate-900 dark:text-white font-semibold truncate">{verifiedPayment.order_id}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">HMAC Signature:</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[10px] break-all">{verifiedPayment.signature}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Verified Timestamp:</span>
                    <p className="text-slate-600 dark:text-slate-300">{verifiedPayment.verifiedAt}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVerifiedPayment(null)}
                  className="w-full py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-400"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Start New Test Payment
                </button>
              </div>
            ) : (
              <div className={`${GLASS_CARD} space-y-4`}>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200">
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  <span>SDK & Environment Specs</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-400 block mb-1">Razorpay Key ID:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {import.meta.env.VITE_RAZORPAY_KEY_ID || 'Configured via .env'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-400 block mb-1">Key Secret:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      Stored exclusively in backend .env (Never exposed to browser)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-400 block mb-1">Supported Payment Methods:</span>
                    <p className="text-slate-600 dark:text-slate-300">
                      UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking, and Mobile Wallets.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span>In test mode, enter any standard test card or UPI ID to test the flow.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
