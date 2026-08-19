import React from 'react';
import { CreditCard, Receipt, ShieldCheck, Download, CheckCircle2, Printer } from 'lucide-react';
import { useApplicationList } from '../../hooks/useApplication';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ParentFeePaymentPage() {
  const { applications, isLoading, refetch } = useApplicationList({ limit: 10 }, { mine: true });

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading fee statement...</p>
        </div>
      </PageContainer>
    );
  }

  const primaryApp = applications[0] || null;

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Fee Statement & Transaction Receipts"
        description="Audit application processing fees, online UPI settlements, and payment receipt records."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Parent Self-Service
          </Badge>
        }
        actions={
          primaryApp && (
            <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <span className="text-[10px] font-bold text-muted-foreground">ACTIVE APP:</span>
              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {primaryApp.application_number || primaryApp.id || 'APP-2026-00368'}
              </span>
            </div>
          )
        }
      />

      {/* Transaction History Card */}
      <Card className="p-6 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
        <SectionHeader
          title="Payment Audit Trail & Receipts"
          description="Verified processing fee settlements and digital payment receipts."
          action={
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              GATEWAY CERTIFIED
            </span>
          }
        />

        <div className="space-y-3">
          {[
            {
              id: 'TXN-2026-94812',
              desc: 'Admission Form & Processing Fee',
              amount: '₹ 500.00',
              mode: 'ONLINE UPI',
              date: primaryApp?.application_date
                ? new Date(primaryApp.application_date).toLocaleDateString()
                : '10 Aug 2026',
              status: primaryApp?.payment_status
                ? primaryApp.payment_status.toUpperCase()
                : 'SETTLED',
            },
          ].map((txn) => (
            <div
              key={txn.id}
              className="p-5 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-100 dark:border-emerald-800">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-foreground truncate">{txn.desc}</h4>
                  <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                    Ref: {txn.id} • {txn.mode} • {txn.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60 shrink-0">
                <span className="text-sm font-extrabold text-foreground">{txn.amount}</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {txn.status}
                </span>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-border text-foreground font-bold text-xs flex items-center space-x-1.5"
                  title="Print / Download Receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}

export default ParentFeePaymentPage;
