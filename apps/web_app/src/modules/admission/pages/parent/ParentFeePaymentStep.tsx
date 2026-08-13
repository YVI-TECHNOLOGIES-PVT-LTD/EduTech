import React from 'react';
import { CreditCard, ShieldCheck, ArrowRight, ArrowLeft, Receipt, Check } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';

interface ParentFeePaymentStepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

export const ParentFeePaymentStep: React.FC<ParentFeePaymentStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  isReadOnly = false,
}) => {
  const handleProceed = () => {
    onNext();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Main Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
          <span>PORTAL</span>
          <span>&gt;</span>
          <span>STEP 06</span>
          <span>&gt;</span>
          <span>FEE PAYMENT</span>
        </div>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
          Application Fee Settlement
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Processing fee covers document verification, entrance screening, and portal registration.
        </p>
      </div>

      {/* Main Fee Card */}
      <Card className="p-6 border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Application Fee Details</h3>
          </div>
          <Badge variant="warning">SETTLEMENT PENDING</Badge>
        </div>

        {/* Fee Breakup */}
        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
            <span>Admission Processing Fee</span>
            <span>₹1,200.00</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
            <span>Digital Document Verification Fee</span>
            <span>₹300.00</span>
          </div>
          <div className="border-t border-gray-200/60 pt-3 flex justify-between items-center text-sm font-black text-indigo-950">
            <span>TOTAL AMOUNT PAYABLE</span>
            <span className="text-base text-indigo-600 font-black">₹1,500.00</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
            SELECT PAYMENT METHOD
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['UPI / QR CODE', 'CREDIT / DEBIT CARD', 'NET BANKING'].map((method, idx) => (
              <div
                key={method}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  idx === 0
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                    : 'border-gray-200 bg-white text-gray-600 font-semibold hover:border-gray-300'
                }`}
              >
                <span className="text-xs">{method}</span>
                {idx === 0 && <Check className="w-4 h-4 text-indigo-600" />}
              </div>
            ))}
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Payments are securely processed via EduTrack Certified Payment Gateway. Official digital
            receipt will be issued instantly upon submission.
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
          onClick={handleProceed}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 gap-2 px-6 py-3 rounded-xl"
        >
          <span>Next Step: Review &amp; Submit</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
