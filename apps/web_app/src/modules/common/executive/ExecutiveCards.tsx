import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import type { DashboardCard } from '../../dashboard/types/dashboard.types';

interface ExecutiveCardsProps {
    kpis: DashboardCard[];
    loading?: boolean;
}

const TREND_ICON = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const TREND_COLOR = { up: 'text-emerald-500', down: 'text-red-500', neutral: 'text-muted-foreground' };

export function ExecutiveCards({ kpis, loading }: ExecutiveCardsProps) {
    if (loading) {
        return (
            <div className="grid md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
            </div>
        );
    }

    const modules = ['Admissions', 'Revenue', 'Attendance', 'Exams', 'Transport', 'HR'];
    const cards = modules.map((mod, i) => {
        const kpi = kpis[i] || { id: mod, label: mod, value: '—' };
        const direction = kpi.trend?.direction || 'neutral';
        const TrendIcon = TREND_ICON[direction];
        return { ...kpi, module: mod, TrendIcon, direction };
    });

    return (
        <div className="grid md:grid-cols-3 gap-4">
            {cards.map(card => (
                <div
                    key={card.id}
                    className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-2xl p-5 flex items-start justify-between"
                >
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            {card.module}
                        </p>
                        <p className="text-xl font-black mt-2">{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                    </div>
                    <card.TrendIcon className={`w-5 h-5 ${TREND_COLOR[card.direction]}`} />
                </div>
            ))}
        </div>
    );
}
