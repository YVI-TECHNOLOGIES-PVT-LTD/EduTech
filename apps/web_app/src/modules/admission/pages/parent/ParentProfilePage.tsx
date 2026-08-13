import React from 'react';
import { User, Phone, Mail, ShieldCheck, MapPin } from 'lucide-react';
import { useAuthStore } from '../../../../store/auth.store';

export function ParentProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
            <span>PARENT PORTAL</span>
            <span>&gt;</span>
            <span>GUARDIAN PROFILE</span>
          </div>
          <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
            Parent &amp; Guardian Profile
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Authenticated profile information, primary contact phone, and official email address.
          </p>
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 border-b border-gray-100 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl border border-indigo-200">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h2 className="text-lg font-black text-indigo-950">
              {user?.full_name || 'Rajesh Sharma'}
            </h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
              AUTHENTICATED PARENT GUARDIAN
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              FULL NAME
            </span>
            <p className="font-bold text-indigo-950">{user?.full_name || 'Rajesh Sharma'}</p>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              PRIMARY EMAIL
            </span>
            <p className="font-bold text-indigo-950">{user?.email || 'rajesh.sharma@gmail.com'}</p>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              CONTACT PHONE
            </span>
            <p className="font-bold text-indigo-950">{user?.phone || '+91 98765 43210'}</p>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              ACCOUNT STATUS
            </span>
            <p className="font-bold text-emerald-700">VERIFIED ACTIVE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentProfilePage;
