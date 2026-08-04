import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface ChartBuilderProps {
    data: Record<string, unknown>[];
    columns: string[];
    chartType: 'bar' | 'line' | 'pie';
    onChartTypeChange: (type: 'bar' | 'line' | 'pie') => void;
}

export function ChartBuilder({ data, columns, chartType, onChartTypeChange }: ChartBuilderProps) {
    const chartData = useMemo(() => {
        if (columns.length === 0 || data.length === 0) return [];
        const labelKey = columns[0];
        const valueKey = columns[1] || columns[0];
        const grouped: Record<string, number> = {};
        data.forEach(row => {
            const label = String(row[labelKey] ?? 'Unknown');
            const val = Number(row[valueKey]) || 1;
            grouped[label] = (grouped[label] || 0) + val;
        });
        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [data, columns]);

    return (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider">Chart</h3>
                <select
                    value={chartType}
                    onChange={e => onChartTypeChange(e.target.value as 'bar' | 'line' | 'pie')}
                    className="text-xs border border-border rounded-lg px-2 py-1"
                >
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                </select>
            </div>
            <ResponsiveContainer width="100%" height={240}>
                {chartType === 'bar' ? (
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                ) : chartType === 'line' ? (
                    <LineChart data={chartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                ) : (
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
