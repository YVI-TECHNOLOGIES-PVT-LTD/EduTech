import React, { useState } from 'react';
import {
  FileText,
  CreditCard,
  Clock,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';

interface ParentInstructionsStepProps {
  onNext: () => void;
  accepted: boolean;
  setAccepted: (accepted: boolean) => void;
}

export const ParentInstructionsStep: React.FC<ParentInstructionsStepProps> = ({
  onNext,
  accepted,
  setAccepted,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    if (!accepted) {
      setError('Please accept the general guidelines before proceeding.');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Main Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
          <span>PORTAL</span>
          <span>&gt;</span>
          <span>INSTRUCTIONS</span>
        </div>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
          Welcome to the Admission Portal
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Follow the steps to complete your application for the Academic Year 2025-26.
        </p>
      </div>

      {/* 4 Feature Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Documents Required */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Documents Required</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Birth Certificate, Aadhaar Card, Passport Photo &amp; Previous Year Report Cards.
            </p>
          </div>
        </div>

        {/* Card 2: Application Fee */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Application Fee</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              A non-refundable fee of ₹500. Keep your payment mode ready.
            </p>
          </div>
        </div>

        {/* Card 3: Time to Complete */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Time to Complete</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Takes approx. 15-20 mins. Progress is saved automatically at every step.
            </p>
          </div>
        </div>

        {/* Card 4: Need Help? */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Need Help?</h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              Use the floating EduAI assistant for any questions during the process.
            </p>
          </div>
        </div>
      </div>

      {/* General Guidelines Card Panel */}
      <div className="bg-indigo-50/40 rounded-2xl p-6 border border-indigo-100/60 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>General Guidelines</span>
        </div>

        <ul className="space-y-2 text-xs text-indigo-900 font-medium">
          <li className="flex items-start space-x-2">
            <span className="text-indigo-500 font-bold">•</span>
            <span>Fill all mandatory fields marked with an asterisk (*).</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-indigo-500 font-bold">•</span>
            <span>Upload clear, scanned copies of original documents only.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-indigo-500 font-bold">•</span>
            <span>Do not use the &apos;Back&apos; button of your browser during payment.</span>
          </li>
        </ul>

        {/* Declaration Checkbox */}
        <div className="pt-2 border-t border-indigo-100/80">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                if (e.target.checked) setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-indigo-950">
              I have read and agree to all general guidelines and admission terms.
            </span>
          </label>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-xs font-medium bg-red-50 p-2.5 rounded-lg border border-red-100 mt-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          disabled
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 cursor-not-allowed border-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>

        <span className="text-xs font-bold text-gray-400">Draft Autosaved</span>

        <Button
          onClick={handleProceed}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 gap-2 px-6 py-3 rounded-xl"
        >
          <span>Next Step: Student Details</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
