import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SessionExpiredPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Session Expired
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
          Your session has timed out due to inactivity. Please sign in again to continue.
        </p>

        <div className="mt-8">
          <Button
            render={<Link to="/login" />}
            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center space-x-2"
          >
            <span>Sign In Again</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredPage;
