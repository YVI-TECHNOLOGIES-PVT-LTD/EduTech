import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { DashboardCard } from '../../dashboard/types/dashboard.types';

interface ExecutiveForecastProps {
    kpis: DashboardCard[];
}

export function ExecutiveForecast({ kpis }: ExecutiveForecastProps) {
    const projections = [
        { label: 'Projected Admissions (Next Month)', value: kpis[0]?.value ?? '—', confidence: '85%' },
        { label: 'Expected Fee Collection', value: kpis[1]?.value ?? '—', confidence: '78%' },
        { label: 'Attendance Forecast', value: '92%', confidence: '91%' },
    ];

    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-wider">Forecast</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
                {projections.map(p => (
                    <div key={p.label} className="p-4 bg-muted/20 rounded-xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.label}</p>
                        <p className="text-lg font-black mt-2">{p.value}</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">{p.confidence} confidence</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
