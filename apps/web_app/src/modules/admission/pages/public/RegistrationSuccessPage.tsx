import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdmissionShell } from '../../components/AdmissionShell';

export const RegistrationSuccessPage: React.FC = () => {
  return (
    <AdmissionShell
      currentStep="success"
      title="Account Created Successfully!"
      subtitle="Your parent guardian portal account is verified and ready"
    >
      <div className="text-center py-6 space-y-6 max-w-md mx-auto">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to EduTrack</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You can now sign in to fill out your child's admission application, upload required
          documents, and track status.
        </p>

        <div className="pt-4">
          <Button
            render={<Link to="/login" />}
            className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center space-x-2"
          >
            <span>Sign In to Apply</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AdmissionShell>
  );
};

export default RegistrationSuccessPage;
