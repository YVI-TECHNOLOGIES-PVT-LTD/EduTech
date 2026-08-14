import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdmissionShell } from '../../components/AdmissionShell';

export const EnquirySuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const refNo = searchParams.get('ref') || 'ENQ-2026-REG';

  return (
    <AdmissionShell
      title="Thank you for your enquiry!"
      subtitle="Your enquiry has been submitted successfully."
    >
      <div className="text-center py-4 space-y-6 max-w-md mx-auto">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200/80 dark:border-emerald-800 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Our admissions team will review your details and contact you shortly to guide you further.
        </p>

        {/* Enquiry Reference Card */}
        <div className="bg-editorial-cream border border-border/80 rounded-xl p-4 text-center space-y-1">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            Enquiry Reference
          </span>
          <div className="text-base font-extrabold text-[#063F40] tracking-wide font-mono">
            {refNo}
          </div>
        </div>

        {/* Expected Response Time */}
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5 text-[#063F40]" />
          <span>Expected Response time: <strong className="text-foreground">24–48 hours</strong></span>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            render={<Link to="/" />}
            className="w-full sm:w-auto h-11 px-6 bg-[#063F40] hover:bg-[#082F35] text-white rounded-xl text-xs font-bold shadow-md"
          >
            <span className="text-[#E7B76A]">Back to Home</span>
          </Button>
        </div>
      </div>
    </AdmissionShell>
  );
};

export default EnquirySuccessPage;

