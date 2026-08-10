import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Check, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdmissionStatusCardProps {
  title: string;
  subtitle: string;
  referenceLabel: string;
  referenceValue: string;
  statusBadge?: string;
  nextSteps?: string[];
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export const AdmissionStatusCard: React.FC<AdmissionStatusCardProps> = ({
  title,
  subtitle,
  referenceLabel,
  referenceValue,
  statusBadge = 'Active',
  nextSteps = [
    'Our admissions team reviews your submission details.',
    'You can log in to track your account & registration status.',
    'Proceed with online portal access anytime.',
  ],
  primaryCtaText = 'Proceed to Login',
  primaryCtaLink = '/login',
  secondaryCtaText = 'Back to Home',
  secondaryCtaLink = '/',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!referenceValue) return;
    navigator.clipboard.writeText(referenceValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-950/5 space-y-6 text-center"
    >
      {/* Success Ring & Icon */}
      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 shrink-0">
        <CheckCircle2 className="w-9 h-9 sm:w-10 sm:h-10" />
      </div>

      {/* Headings */}
      <div className="space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Official Backend Reference Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
            {referenceLabel}
          </span>
          {statusBadge && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              ✓ {statusBadge}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-inner">
          <span className="font-mono font-black text-lg sm:text-xl text-indigo-950 tracking-wider select-all">
            {referenceValue}
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 text-xs font-bold text-indigo-900 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-500 text-left">
          Please save or quote this reference code for future communications.
        </p>
      </div>

      {/* Next Steps Card */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="text-left bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-4 sm:p-5 space-y-2.5 max-w-md mx-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 font-display flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-700" />
            <span>What happens next?</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
            {nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-200/60 text-indigo-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {secondaryCtaLink && (
          <Link to={secondaryCtaLink} className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm h-12 rounded-full px-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {secondaryCtaText}
            </Button>
          </Link>
        )}

        {primaryCtaLink && (
          <Link to={primaryCtaLink} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-xs sm:text-sm h-12 rounded-full px-7 shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              {primaryCtaText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};
