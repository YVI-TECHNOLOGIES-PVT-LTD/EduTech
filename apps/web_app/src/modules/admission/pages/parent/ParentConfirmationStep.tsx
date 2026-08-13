import React from 'react';
import { PartyPopper, Download, ArrowRight, Phone, Mail, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';

interface ParentConfirmationStepProps {
  submittedApp: {
    id?: string;
    application_number: string;
    status: string;
    created_at?: string;
    student_name: string;
    grade_applied_for?: string;
    parent_email?: string;
  };
}

export const ParentConfirmationStep: React.FC<ParentConfirmationStepProps> = ({ submittedApp }) => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 font-sans text-center">
      {/* Top Celebratory Party Icon */}
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <PartyPopper className="w-10 h-10" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      </div>

      {/* Main Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-indigo-950 tracking-tight">
          Application Submitted!
        </h1>
        <p className="text-xs font-semibold text-gray-500 max-w-md mx-auto leading-relaxed">
          Your application for{' '}
          <span className="font-bold text-gray-900">
            {submittedApp.student_name || 'Arjun Rajesh Sharma'}
          </span>{' '}
          has been received. Our admissions team is now reviewing your details.
        </p>
      </div>

      {/* 2 Status Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
        {/* Card 1: Application ID */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
            APPLICATION ID
          </span>
          <p className="text-xl font-black text-indigo-950 tracking-tight">
            {submittedApp.application_number}
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              UNDER REVIEW
            </span>
          </div>
        </div>

        {/* Card 2: Next Milestone */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
            NEXT MILESTONE
          </span>
          <p className="text-sm font-bold text-gray-900">Document Verification</p>
          <p className="text-[11px] text-gray-500 leading-relaxed font-medium pt-1">
            Expect a verification update within 48-72 hours on your dashboard.
          </p>
        </div>
      </div>

      {/* Dark Navy Confirmation Banner */}
      <div className="bg-indigo-950 text-white rounded-3xl p-8 max-w-2xl mx-auto text-left relative overflow-hidden shadow-xl">
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-black tracking-tight">A confirmation email has been sent!</h2>
          <p className="text-xs text-indigo-200 leading-relaxed font-medium">
            We&apos;ve sent the application acknowledgement and next steps to{' '}
            <span className="text-white font-bold">
              {submittedApp.parent_email || 'rajesh.sharma@gmail.com'}
            </span>
            . Please keep this for your records.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-gray-100 transition-colors shadow-sm gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Slip</span>
            </button>

            <button
              onClick={() => navigate('/app/admissions/my')}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-900/50 gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact Line Footer */}
      <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-gray-400 pt-2">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span>HELPLINE: +91 80 4567 8900</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-gray-400" />
          <span>ADMISSIONS@EDUTRACK3.IN</span>
        </div>
      </div>
    </div>
  );
};
