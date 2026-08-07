import React from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_CONFIG } from '@/config/app';
import { toast } from 'sonner';

export const FeePaymentTab: React.FC = () => {
  const handlePayment = () => {
    toast.success('Admission fee payment of ₹25,000 collected successfully');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Admission Fee Payment Collection
          </h3>
          <p className="text-xs text-slate-500">
            Record fee receipt for approved admission applications
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Application Number
            </label>
            <Input defaultValue="APP-2026-043" className="text-xs h-9" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Admission Fee Amount ({APP_CONFIG.currency.symbol})
            </label>
            <Input defaultValue="25000" className="text-xs h-9" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Mode
            </label>
            <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 h-9">
              <option value="ONLINE">Online Portal Payment</option>
              <option value="CHEQUE">Cheque / Demand Draft</option>
              <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
              <option value="CASH">Cash Payment</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
        >
          <CreditCard size={14} className="mr-1.5" />
          Process Fee Collection
        </Button>
      </div>
    </div>
  );
};
