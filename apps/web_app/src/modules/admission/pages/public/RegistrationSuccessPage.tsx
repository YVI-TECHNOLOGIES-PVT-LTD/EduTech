import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/modules/auth/components/AuthLayout';

export const RegistrationSuccessPage: React.FC = () => {
  return (
    <AuthLayout
      badgeText="Registration Completed"
      title="Welcome to EduTrack"
      subtitle="Your admission portal account is verified and ready."
    >
      <div className="text-center space-y-6">
        {/* Glowing Emerald Success Mark */}
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-900 shadow-sm animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Headline details */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Account Ready for Use
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You can now sign in to your EduTrack Admission Portal to start new admission
            applications, upload student documents, and track admission approvals.
          </p>
        </div>

        {/* What You Can Do Next Card */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
            What&apos;s Next:
          </span>
          <div className="space-y-2 text-xs text-foreground">
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center text-[10px] font-extrabold shrink-0">
                1
              </div>
              <span className="font-medium">Sign in with your verified email & password</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center text-[10px] font-extrabold shrink-0">
                2
              </div>
              <span className="font-medium">Fill out the multi-step online admission form</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center text-[10px] font-extrabold shrink-0">
                3
              </div>
              <span className="font-medium">Track your application stage & fee details</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link to="/login" className="block w-full">
            <Button className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2">
              <span>Sign In to Admission Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegistrationSuccessPage;
