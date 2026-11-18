import React from 'react';
import { Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

interface FullScreenLoaderProps {
  message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Initializing EduLyfe ERP Admin Portal...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="flex items-center space-x-3">
        <img
          src="/brand/edulyfe-symbol-reversed.png"
          alt="EduLyfe ERP"
          className="h-10 w-10 object-contain drop-shadow-md"
        />
        <span className="text-xl font-bold tracking-tight">{APP_CONFIG.name}</span>
      </div>
      <div className="mt-8 flex items-center space-x-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};
