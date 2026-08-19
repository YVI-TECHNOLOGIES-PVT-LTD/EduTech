import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar as CalendarIcon } from 'lucide-react';

export interface TrendDataPoint {
  date: string;
  inquiries: number;
  applications: number;
  admissions: number;
}

export interface AdmissionsOverviewTrendChartProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-black border border-border/80 dark:border-zinc-800 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[140px]">
        <p className="font-bold text-foreground pb-1 border-b border-border/60">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-foreground">
              {Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AdmissionsOverviewTrendChart: React.FC<AdmissionsOverviewTrendChartProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const hasData = data && data.length > 0 && data.some((d) => d.inquiries > 0 || d.applications > 0 || d.admissions > 0);

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground font-sans">
                {t('dashboard.frontOffice.admissionsOverview.title', 'Admissions Overview')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(
                  'dashboard.frontOffice.admissionsOverview.subtitle',
                  'Time-based trend of inquiries, applications, and enrollments',
                )}
              </p>
            </div>
          </div>
        </div>

        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 shrink-0">
          Timeline Trend
        </span>
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="h-48 w-full bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-xl">
          <CalendarIcon className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t(
              'dashboard.frontOffice.admissionsOverview.noData',
              'No admissions activity recorded during the selected period.',
            )}
          </p>
          <p className="text-[11px] text-muted-foreground max-w-xs">
            Trends will populate automatically as inquiries and applications are created.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="inquiries"
                name={t('dashboard.frontOffice.admissionsOverview.inquiries', 'Inquiries')}
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInquiries)"
              />
              <Area
                type="monotone"
                dataKey="applications"
                name={t('dashboard.frontOffice.admissionsOverview.applications', 'Applications')}
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorApplications)"
              />
              <Area
                type="monotone"
                dataKey="admissions"
                name={t('dashboard.frontOffice.admissionsOverview.admissions', 'Admissions')}
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAdmissions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
