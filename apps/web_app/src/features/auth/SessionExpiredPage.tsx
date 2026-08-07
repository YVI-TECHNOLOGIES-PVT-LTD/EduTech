import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/components/ui/button';

export const SessionExpiredPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Clock size={28} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Session Expired</h2>
          <p className="text-xs text-slate-400">
            For security reasons, your active session has timed out due to inactivity or invalid
            authorization tokens.
          </p>
        </div>

        <Button
          onClick={() => navigate(ROUTES.AUTH.LOGIN, { replace: true })}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-10 shadow-lg shadow-blue-600/30"
        >
          <span>Sign In Again</span>
          <ArrowRight size={14} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SessionExpiredPage;
