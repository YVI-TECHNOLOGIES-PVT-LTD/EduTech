import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Receipt, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FeeCollectionData {
  expected: number;
  collected: number;
  pending: number;
  currency?: string;
  collectionRate?: number;
}

export interface FeeCollectionWidgetProps {
  data?: FeeCollectionData | null;
  isLoading?: boolean;
}

export const FeeCollectionWidget: React.FC<FeeCollectionWidgetProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const safeData = data || { expected: 0, collected: 0, pending: 0 };
  const currencySymbol = safeData.currency || '₹';

  const formatAmount = (amt: number | string | null | undefined): string => {
    const num = Number(amt);
    if (!Number.isFinite(num)) return `${currencySymbol}0`;
    return `${currencySymbol}${num.toLocaleString('en-IN')}`;
  };

  const expectedVal = Math.max(0, Number(safeData.expected) || 0);
  const collectedVal = Math.max(0, Number(safeData.collected) || 0);
  const pendingVal =
    safeData.pending !== undefined && safeData.pending !== null
      ? Math.max(0, Number(safeData.pending) || 0)
      : Math.max(0, expectedVal - collectedVal);

  const rate =
    typeof safeData.collectionRate === 'number' && Number.isFinite(safeData.collectionRate)
      ? Math.max(0, Math.min(100, Math.round(safeData.collectionRate)))
      : expectedVal > 0
        ? Math.max(0, Math.min(100, Math.round((collectedVal / expectedVal) * 100)))
        : collectedVal > 0
          ? 100
          : 0;

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.feeCollection.title', 'Fee Collection Overview')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.feeCollection.subtitle',
                'Application and admission fee realization',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            {rate}% {t('dashboard.frontOffice.feeCollection.collectionRate', 'Realized')}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/app/front-office/fees')}
            className="h-7 px-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1 hidden sm:inline-flex"
            title="Open Fee Collection Desk"
          >
            <span>Desk</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-4">
          <div className="h-12 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          <div className="h-16 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>
                {t('dashboard.frontOffice.feeCollection.collectionRate', 'Collection Rate')}
              </span>
              <span className="font-mono text-foreground font-extrabold ltr-isolate">{rate}%</span>
            </div>
            <div className="h-3 w-full bg-muted/50 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t('dashboard.frontOffice.feeCollection.expected', 'Expected')}
              </span>
              <p className="text-base font-black text-foreground font-mono ltr-isolate mt-1">
                {formatAmount(expectedVal || collectedVal + pendingVal)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <CheckCircle className="w-3 h-3" />
                <span>{t('dashboard.frontOffice.feeCollection.collected', 'Collected')}</span>
              </div>
              <p className="text-base font-black text-emerald-900 dark:text-emerald-200 font-mono ltr-isolate mt-1">
                {formatAmount(collectedVal)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                <span>{t('dashboard.frontOffice.feeCollection.pending', 'Pending')}</span>
              </div>
              <p className="text-base font-black text-amber-900 dark:text-amber-200 font-mono ltr-isolate mt-1">
                {formatAmount(pendingVal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
