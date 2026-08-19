import React, { useMemo } from 'react';
import { LucideIcon, TrendingUp, PieChart as DefaultIcon } from 'lucide-react';
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

export interface PieChartLabelItem {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface PieChartLabelCardProps {
  title: string;
  description?: string;
  badgeText?: string;
  data: PieChartLabelItem[];
  totalLabel?: string;
  footerTrendText?: string;
  footerSubtext?: string;
  trendIcon?: LucideIcon;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

const DEFAULT_PALETTE = [
  'hsl(238 82% 67%)',  // Indigo
  'hsl(187 92% 43%)',  // Cyan
  'hsl(160 84% 39%)',  // Emerald
  'hsl(38 92% 50%)',   // Amber
  'hsl(270 76% 60%)',  // Purple
  'hsl(330 81% 60%)',  // Rose
  'hsl(215 16% 47%)',  // Slate
];

export const PieChartLabelCard: React.FC<PieChartLabelCardProps> = ({
  title,
  description,
  badgeText,
  data = [],
  totalLabel = 'Total',
  footerTrendText,
  footerSubtext,
  trendIcon: TrendIcon = TrendingUp,
  icon: Icon = DefaultIcon,
  iconBg = 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-100 dark:border-cyan-900/60',
  iconColor = 'text-cyan-600 dark:text-cyan-400',
  isLoading = false,
  emptyMessage = 'No data available for display.',
  innerRadius = 45,
  outerRadius = 70,
  className = '',
}) => {
  const formattedData = useMemo(() => {
    return data.filter((d) => d.value > 0);
  }, [data]);

  const total = useMemo(() => {
    return formattedData.reduce((acc, curr) => acc + curr.value, 0);
  }, [formattedData]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: title,
      },
    };

    formattedData.forEach((item, index) => {
      config[item.id] = {
        label: item.label,
        color: item.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
      };
    });

    return config;
  }, [formattedData, title]);

  const chartData = useMemo(() => {
    return formattedData.map((item, index) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      fill: item.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
    }));
  }, [formattedData]);

  return (
    <Card className={`flex flex-col justify-between h-full bg-white dark:bg-black border border-border/80 dark:border-zinc-800 shadow-sm rounded-2xl ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 sm:p-6 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${iconBg} ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-extrabold text-foreground font-sans">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs font-normal text-muted-foreground mt-0.5 normal-case tracking-normal">
                {description}
              </CardDescription>
            )}
          </div>
        </div>

        {badgeText && (
          <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 shrink-0">
            {badgeText}
          </span>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-5 sm:p-6 pt-0 flex flex-col justify-center">
        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full bg-muted/40 dark:bg-zinc-900/50 animate-pulse" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-xl">
            <Icon className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-bold text-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mt-2">
            {/* Labeled Pie Chart Container */}
            <div className="sm:col-span-6 relative flex items-center justify-center">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square w-full max-h-[220px] pb-0 [&_.recharts-pie-label-text]:fill-foreground [&_.recharts-pie-label-text]:text-[10px] [&_.recharts-pie-label-text]:font-mono [&_.recharts-pie-label-text]:font-bold"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="id"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    stroke="transparent"
                    paddingAngle={2}
                    isAnimationActive={true}
                  />
                </PieChart>
              </ChartContainer>

              {/* Center Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-foreground font-mono">
                  {total.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  {totalLabel}
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="sm:col-span-6 space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {chartData.map((item) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={item.id}
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
                      <span className="font-mono font-bold text-foreground">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60 font-mono">
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

      {(footerTrendText || footerSubtext || total > 0) && (
        <CardFooter className="p-5 sm:p-6 pt-3 border-t border-border/60 dark:border-zinc-850 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <TrendIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>{footerTrendText || 'Live Distribution Summary'}</span>
          </div>
          <span className="font-mono font-bold text-foreground">
            {footerSubtext || `${total.toLocaleString()} total`}
          </span>
        </CardFooter>
      )}
    </Card>
  );
};
