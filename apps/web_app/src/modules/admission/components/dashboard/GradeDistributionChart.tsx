import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { GraduationCap } from 'lucide-react';

export interface GradeDistributionItem {
  grade: string;
  count: number;
}

export interface GradeDistributionChartProps {
  data: GradeDistributionItem[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white dark:bg-black border border-border/80 dark:border-zinc-800 rounded-xl p-2.5 shadow-xl text-xs space-y-1">
        <p className="font-bold text-foreground">{item.payload.grade}</p>
        <p className="text-muted-foreground font-mono">
          <strong className="text-foreground">{Number(item.value).toLocaleString()}</strong> applicants
        </p>
      </div>
    );
  }
  return null;
};

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const hasData = data && data.length > 0 && data.some((d) => d.count > 0);

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.gradeDistribution.title', 'Applications by Grade')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.gradeDistribution.subtitle',
                'Applicant demand distribution across grades',
              )}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 shrink-0">
          Grade Demand
        </span>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-48 w-full bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-xl">
          <GraduationCap className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t(
              'dashboard.frontOffice.gradeDistribution.noData',
              'No grade application data available.',
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Demand breakdown will populate as applications are submitted.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="grade"
                tickLine={false}
                axisLine={false}
                width={70}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
