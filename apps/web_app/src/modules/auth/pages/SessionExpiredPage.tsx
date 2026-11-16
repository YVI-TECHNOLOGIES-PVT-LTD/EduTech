import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '../components/AuthLayout';

export const SessionExpiredPage: React.FC = () => {
  return (
    <AuthLayout
      badgeText="Security Timeout"
      title="Session Expired"
      subtitle="Your active session timed out due to inactivity"
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 flex items-center justify-center mx-auto shadow-sm">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-foreground">Please Sign In Again</h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            To protect your child&apos;s records and sensitive admission data, sessions
            automatically expire after periods of inactivity.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/login" className="block w-full">
            <Button className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2">
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SessionExpiredPage;
