import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdmissionShell } from '../../components/AdmissionShell';

export const EnquirySuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const refNo = searchParams.get('ref') || 'ENQ-2026-REG';

  return (
    <AdmissionShell
      currentStep="enquiry"
      title="Enquiry Submitted Successfully!"
      subtitle={`Reference Number: ${refNo}`}
    >
      <div className="text-center py-6 space-y-6 max-w-md mx-auto">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Thank you for your interest!
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Our admission counselor will reach out to you shortly. You can also register a parent
          account to proceed directly with application submission.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            render={<Link to="/" />}
            variant="outline"
            className="w-full sm:w-auto h-11 rounded-xl"
          >
            Back to Home
          </Button>
          <Button
            render={<Link to="/admission/register" />}
            className="w-full sm:w-auto h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center space-x-2"
          >
            <span>Proceed to Account Registration</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AdmissionShell>
  );
};

export default EnquirySuccessPage;
