import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Layers } from 'lucide-react';

export interface PipelineItem {
  status: string;
  label: string;
  count: number;
  color?: string;
}

export interface ApplicationPipelineBarChartProps {
  data: PipelineItem[];
  isLoading?: boolean;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  draft: '#94a3b8',
  submitted: '#38bdf8',
  under_review: '#f59e0b',
  docs_pending: '#fb7185',
  evaluation: '#818cf8',
  approved: '#34d399',
  rejected: '#f43f5e',
  enrolled: '#10b981',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white dark:bg-black border border-border/80 dark:border-zinc-800 rounded-xl p-2.5 shadow-xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.color || item.fill }} />
          <span>{item.payload.label || item.payload.status}</span>
        </div>
        <p className="text-muted-foreground font-mono">
          <strong className="text-foreground">{Number(item.value).toLocaleString()}</strong> applications
        </p>
      </div>
    );
  }
  return null;
};

export const ApplicationPipelineBarChart: React.FC<ApplicationPipelineBarChartProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const localizedData = React.useMemo(() => {
    return (data || []).map((item) => ({
      ...item,
      label: t(`dashboard.frontOffice.pipeline.statuses.${item.status.toLowerCase()}`, item.label || item.status),
    }));
  }, [data, t]);

  const hasData = localizedData.length > 0 && localizedData.some((d) => d.count > 0);

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.pipeline.title', 'Application Pipeline')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.pipeline.subtitle',
                'Breakdown of applicant files across workflow stages',
              )}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 shrink-0">
          Status Breakdown
        </span>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-48 w-full bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-xl">
          <Layers className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t('dashboard.frontOffice.pipeline.noData', 'No applications in pipeline.')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Applications will appear here as they are submitted and reviewed.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={localizedData} margin={{ top: 15, right: 10, left: -25, bottom: 25 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {localizedData.map((entry) => (
                  <Cell
                    key={`cell-${entry.status}`}
                    fill={entry.color || STATUS_COLOR_MAP[entry.status.toLowerCase()] || '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
