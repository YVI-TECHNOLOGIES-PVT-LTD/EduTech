import React from 'react';
import { HelpCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../../../store/auth.store';
import { useNavigate } from 'react-router-dom';

interface ParentWizardHeaderProps {
  appNumber?: string;
  isReadOnly?: boolean;
}

export const ParentWizardHeader: React.FC<ParentWizardHeaderProps> = ({
  appNumber = 'APP-2026-00368',
  isReadOnly = false,
}) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Left: EduTrack Logo & Subheading */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigate('/app/admissions/my')}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            Δ
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tight text-indigo-950 leading-tight">
              EduTrack
            </span>
            <span className="text-[9px] font-black text-amber-500 tracking-widest uppercase">
              EXCELLENCE • GROWTH • TRUST
            </span>
          </div>
        </div>

        {/* Right: Application ID & Support Links */}
        <div className="flex items-center space-x-6">
          <div className="text-xs text-gray-500 font-medium">
            Application ID:{' '}
            <span className="font-extrabold text-indigo-950 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/80 ml-1">
              {appNumber}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/support')}
              className="flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span className="hidden sm:inline">Support</span>
            </button>

            <button
              onClick={() => navigate('/app/admissions/my')}
              className="text-xs font-bold text-gray-600 hover:text-indigo-600 transition-colors hidden md:inline"
            >
              My Applications
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors pl-3 border-l border-gray-200"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
