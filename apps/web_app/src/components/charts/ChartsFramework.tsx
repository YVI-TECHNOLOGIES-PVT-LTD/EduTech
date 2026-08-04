import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line
} from 'recharts';

// Color Palette for Charts
const CHART_COLORS = ['#1e3a8a', '#eab308', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

interface ChartData {
    name: string;
    value: number;
}

interface CommonChartProps {
    data: ChartData[];
    height?: number;
}

export const BarChartWrapper = ({ data, height = 300 }: CommonChartProps) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const AreaChartWrapper = ({ data, height = 300 }: CommonChartProps) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export const PieChartWrapper = ({ data, height = 300 }: CommonChartProps) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    );
};

export const SparklineChart = ({ data, height = 50 }: CommonChartProps) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
                <Tooltip labelStyle={{ display: 'none' }} contentStyle={{ padding: '4px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="value" stroke="#eab308" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};
