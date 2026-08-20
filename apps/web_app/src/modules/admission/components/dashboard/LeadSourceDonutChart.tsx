import React, { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export interface LeadSourceItem {
  source: string;
  count: number;
  label?: string;
}

export interface LeadSourceDonutChartProps {
  data: LeadSourceItem[];
  totalLeads?: number;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

const DEFAULT_CHART_COLORS = [
  'hsl(238 82% 67%)',  // Indigo
  'hsl(187 92% 43%)',  // Cyan
  'hsl(160 84% 39%)',  // Emerald
  'hsl(38 92% 50%)',   // Amber
  'hsl(270 76% 60%)',  // Purple
  'hsl(330 81% 60%)',  // Rose
  'hsl(215 16% 47%)',  // Slate
];

export const LeadSourceDonutChart: React.FC<LeadSourceDonutChartProps> = ({
  data = [],
  totalLeads = 0,
  isLoading = false,
  title,
  subtitle,
  className = '',
}) => {
  const { t } = useLanguage();

  const formattedData = useMemo(() => {
    return data.filter((d) => d.count > 0);
  }, [data]);

  const total = totalLeads || formattedData.reduce((acc, curr) => acc + curr.count, 0);

  const formatSourceLabel = (src: string) => {
    return src
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Generate dynamic chartConfig for shadcn ChartContainer
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: t('dashboard.frontOffice.leadSources.title', 'Leads'),
      },
    };

    formattedData.forEach((item, index) => {
      const key = item.source.toLowerCase().replace(/[\s-]/g, '_');
      config[key] = {
        label: item.label || formatSourceLabel(item.source),
        color: DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length],
      };
    });

    return config;
  }, [formattedData, t]);

  const chartData = useMemo(() => {
    return formattedData.map((item, index) => {
      const key = item.source.toLowerCase().replace(/[\s-]/g, '_');
      return {
        source: key,
        label: item.label || formatSourceLabel(item.source),
        count: item.count,
        fill: DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length],
      };
    });
  }, [formattedData]);

  return (
    <Card className={`flex flex-col justify-between h-full bg-white dark:bg-black border border-border/80 dark:border-zinc-800 shadow-sm rounded-2xl ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 sm:p-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-100 dark:border-cyan-900/60">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-extrabold text-foreground font-sans">
              {title || t('dashboard.frontOffice.leadSources.title', 'Lead Sources')}
            </CardTitle>
            <CardDescription className="text-xs font-normal text-muted-foreground mt-0.5 normal-case tracking-normal">
              {subtitle ||
                t(
                  'dashboard.frontOffice.leadSources.subtitle',
                  'Distribution of applicant inquiry channels',
                )}
            </CardDescription>
          </div>
        </div>

        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 shrink-0">
          Source Share
        </span>
      </CardHeader>

      <CardContent className="flex-1 p-5 sm:p-6 pt-0 flex flex-col justify-center">
        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full bg-muted/40 dark:bg-zinc-900/50 animate-pulse" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-xl">
            <PieChartIcon className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              {t('dashboard.frontOffice.leadSources.noData', 'No lead source data available.')}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Inquiry channels will be visualized here once leads are recorded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mt-2">
            {/* Labeled Pie Chart with shadcn ChartContainer */}
            <div className="sm:col-span-6 relative flex items-center justify-center">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square w-full max-h-[220px] pb-0 [&_.recharts-pie-label-text]:fill-foreground [&_.recharts-pie-label-text]:text-[10px] [&_.recharts-pie-label-text]:font-mono [&_.recharts-pie-label-text]:font-bold"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="source"
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    innerRadius={45}
                    outerRadius={70}
                    stroke="transparent"
                    paddingAngle={2}
                    isAnimationActive={true}
                  />
                </PieChart>
              </ChartContainer>

              {/* Center Total Count Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-foreground font-mono ltr-isolate">
                  {total.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('dashboard.frontOffice.leadSources.totalLeads', 'Total')}
                </span>
              </div>
            </div>

            {/* Formatted Legend Stream */}
            <div className="sm:col-span-6 space-y-1.5 max-h-52 overflow-y-auto pe-1">
              {chartData.map((item) => {
                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={item.source}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/40 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-bold text-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-foreground ltr-isolate">
                        {item.count.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60 font-mono ltr-isolate">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 sm:p-6 pt-3 border-t border-border/60 dark:border-zinc-850 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>Active Inquiries Distribution</span>
        </div>
        <span className="font-mono font-bold text-foreground">
          {total.toLocaleString()} leads
        </span>
      </CardFooter>
    </Card>
  );
};

export const LeadSourcePieChart = LeadSourceDonutChart;
export default LeadSourceDonutChart;

