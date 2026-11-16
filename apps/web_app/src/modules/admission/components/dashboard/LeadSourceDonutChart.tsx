import React, { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

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
    return (data || []).filter((d) => d.count > 0);
  }, [data]);

  const total = totalLeads || formattedData.reduce((acc, curr) => acc + curr.count, 0);

  const formatSourceLabel = (src: string) => {
    return src.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Generate dynamic chartConfig for shadcn ChartContainer with valid HSL colors
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      leads: {
        label: t('dashboard.frontOffice.leadSources.title', 'Leads'),
      },
    };

    formattedData.forEach((item, index) => {
      const key = item.source.toLowerCase().replace(/[\s-]/g, '_');
      const chartColorIndex = (index % 8) + 1;
      config[key] = {
        label: item.label || formatSourceLabel(item.source),
        color: `hsl(var(--chart-${chartColorIndex}))`,
      };
    });

    return config;
  }, [formattedData, t]);

  const chartData = useMemo(() => {
    return formattedData.map((item, index) => {
      const key = item.source.toLowerCase().replace(/[\s-]/g, '_');
      const chartColorIndex = (index % 8) + 1;
      return {
        source: key,
        label: item.label || formatSourceLabel(item.source),
        count: item.count,
        fill: `hsl(var(--chart-${chartColorIndex}))`,
      };
    });
  }, [formattedData]);

  return (
    <Card
      className={`flex flex-col justify-between h-full bg-card border border-border shadow-xs rounded-2xl ${className}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 pb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm sm:text-base font-extrabold text-foreground font-sans whitespace-nowrap truncate">
              {title || t('dashboard.frontOffice.leadSources.title', 'Lead Sources')}
            </CardTitle>
            <CardDescription className="text-[11px] font-normal text-muted-foreground truncate">
              {subtitle ||
                t(
                  'dashboard.frontOffice.leadSources.subtitle',
                  'Distribution of applicant inquiry channels',
                )}
            </CardDescription>
          </div>
        </div>

        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/60 shrink-0">
          Source Share
        </span>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-5 pt-0 flex flex-col justify-center">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex flex-wrap gap-2 justify-center w-full max-w-xs">
              <Skeleton className="h-3.5 w-16 rounded-md" />
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-3.5 w-16 rounded-md" />
              <Skeleton className="h-3.5 w-18 rounded-md" />
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-xl">
            <PieChartIcon className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              {t('dashboard.frontOffice.leadSources.noData', 'No lead source data available.')}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Inquiry channels will be visualized here once leads are recorded.
            </p>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto w-full h-[260px] pb-0 [&_.recharts-pie-label-text]:fill-foreground [&_.recharts-pie-label-text]:text-[10px] [&_.recharts-pie-label-text]:font-mono [&_.recharts-pie-label-text]:font-bold"
            >
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any, name: any, item: any) => {
                        const numVal = typeof value === 'number' ? value : Number(value || 0);
                        const pct = total > 0 ? ((numVal / total) * 100).toFixed(1) : '0.0';
                        const label = item.payload?.label || name;
                        return (
                          <div className="flex items-center justify-between w-full min-w-[140px] gap-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.payload?.fill || item.color }}
                              />
                              <span className="font-semibold text-foreground truncate">
                                {label}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-foreground shrink-0">
                              {numVal.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="40%"
                  innerRadius={46}
                  outerRadius={68}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                  paddingAngle={2}
                  isAnimationActive={true}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 2}
                              className="fill-foreground text-xl font-black font-mono"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 14}
                              className="fill-muted-foreground text-[9px] font-bold uppercase tracking-wider"
                            >
                              {t('dashboard.frontOffice.leadSources.totalLeads', 'Total')}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey="source"
                      className="flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px] font-medium pt-2 max-h-28 overflow-y-auto"
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 sm:p-5 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Active Inquiries</span>
        </div>
        <span className="font-mono font-bold text-foreground">{total.toLocaleString()} Leads</span>
      </CardFooter>
    </Card>
  );
};

export const LeadSourcePieChart = LeadSourceDonutChart;
export default LeadSourceDonutChart;
