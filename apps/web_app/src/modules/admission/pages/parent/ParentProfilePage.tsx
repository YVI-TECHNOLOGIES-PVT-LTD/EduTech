import React from 'react';
import { User, Phone, Mail, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function ParentProfilePage() {
  const { user } = useAuth();

  const fullName =
    user?.full_name ||
    (user as any)?.name ||
    ((user as any)?.firstName
      ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
      : '') ||
    (user?.email
      ? user.email
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Parent Guardian');

  const email = user?.email || 'Registered Email';
  const phone = (user as any)?.phone || (user as any)?.phoneNumber || 'Not Provided';

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-card rounded-3xl p-6 border border-border shadow-sm flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
            <span>ADMISSION PORTAL</span>
            <span>&gt;</span>
            <span>GUARDIAN PROFILE</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Parent &amp; Guardian Profile
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Authenticated profile information, primary contact phone, and official email address.
          </p>
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="bg-card rounded-3xl p-6 border border-border shadow-sm space-y-6">
        <div className="flex items-center space-x-4 border-b border-border/60 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xl border border-indigo-200 dark:border-indigo-800">
            {fullName ? fullName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">{fullName}</h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
              AUTHENTICATED PARENT GUARDIAN
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              FULL NAME
            </span>
            <p className="font-bold text-foreground">{fullName}</p>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              PRIMARY EMAIL
            </span>
            <p className="font-bold text-foreground">{email}</p>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              CONTACT PHONE
            </span>
            <p className="font-bold text-foreground">{phone}</p>
          </div>

          <div className="space-y-1 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              ACCOUNT STATUS
            </span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">VERIFIED ACTIVE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentProfilePage;
