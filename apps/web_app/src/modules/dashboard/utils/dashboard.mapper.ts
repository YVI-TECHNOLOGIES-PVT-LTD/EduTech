import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { DashboardTrend, DashboardMetric } from '../types/dashboard.types';

export const DashboardMapper = {
    normalizeMetric(
        id: string,
        label: string,
        rawValue: any,
        format: 'currency' | 'number' | 'percentage' | 'text' = 'text',
        trendValue?: number,
        trendDirection?: 'up' | 'down' | 'neutral',
        subtext?: string
    ): DashboardMetric {
        let value = rawValue ?? '-';
        
        if (rawValue !== null && rawValue !== undefined) {
            if (format === 'currency') {
                try {
                    value = formatCurrency(Number(rawValue));
                } catch {
                    value = `₹${Number(rawValue).toLocaleString('en-IN')}`;
                }
            } else if (format === 'percentage') {
                value = `${rawValue}%`;
            } else if (format === 'number') {
                value = Number(rawValue).toLocaleString();
            }
        }

        let trend: DashboardTrend | undefined;
        if (trendValue !== undefined) {
            trend = {
                value: trendValue,
                direction: trendDirection ?? (trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral'),
                percentage: trendValue
            };
        }

        return {
            id,
            label,
            value,
            trend,
            subtext,
            format
        };
    },

    formatRupee(val: any): string {
        const num = Number(val || 0);
        try {
            return formatCurrency(num);
        } catch {
            return `₹${num.toLocaleString('en-IN')}`;
        }
    },

    safeNumber(val: any, fallback = 0): number {
        if (val === null || val === undefined) return fallback;
        const num = Number(val);
        return isNaN(num) ? fallback : num;
    },

    safeString(val: any, fallback = ''): string {
        if (val === null || val === undefined) return fallback;
        return String(val);
    },

    normalizeDate(dateString: any): string {
        if (!dateString) return '-';
        try {
            return formatDate(new Date(dateString));
        } catch {
            return new Date(dateString).toLocaleDateString();
        }
    },

    calculatePercentageChange(current: number, previous: number): number {
        if (!previous) return current ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
    }
};

export default DashboardMapper;
