import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdmissionShell } from '../../components/AdmissionShell';

export const RegistrationSuccessPage: React.FC = () => {
  return (
    <AdmissionShell
      title="Account Created Successfully!"
      subtitle="Your parent guardian portal account is verified and ready"
    >
      <div className="text-center py-4 space-y-6 max-w-md mx-auto">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200/80 dark:border-emerald-800 shadow-md">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Welcome to EduTrack</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          You can now sign in to fill out your child's admission application, upload required
          documents, and track status.
        </p>

        <div className="pt-2 flex justify-center">
          <Link to="/login" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-12 px-8 bg-[#E7B76A] hover:bg-[#d8a658] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98]">
              <span>Sign In to Parent Portal</span>
              <ArrowRight className="w-4 h-4 text-[#042A2B]" />
            </Button>
          </Link>
        </div>
      </div>
    </AdmissionShell>
  );
};

export default RegistrationSuccessPage;
