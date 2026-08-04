import { Card } from '../../../../components/ui/card';
import { Layers, Activity, TrendingUp, Compass } from 'lucide-react';

export function AttendancePieChart() {
    return (
        <Card className="p-5 border-0 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> Status Breakdown
            </h3>
            <div className="flex items-center gap-6 py-2 justify-center flex-wrap">
                {/* Simulated donut chart */}
                <div className="relative w-28 h-28 rounded-full border-[10px] border-emerald-500 border-t-rose-500 border-r-amber-500 flex items-center justify-center">
                    <span className="text-sm font-black text-slate-800">92%</span>
                </div>
                <div className="space-y-1.5 text-xs font-bold text-gray-600">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Present (92%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span>Absent (5%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Late (3%)</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function AttendanceGauge({ value }: { value: number }) {
    return (
        <Card className="p-5 border-0 shadow-sm space-y-4 text-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center justify-center gap-1.5">
                <Compass className="w-4 h-4 text-primary" /> Class Attendance Goal
            </h3>
            <div className="py-4">
                <div className="text-3xl font-black text-primary">{value}%</div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 max-w-[200px] mx-auto">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${value}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-2">Target threshold is 95%</p>
            </div>
        </Card>
    );
}

export function AttendanceTrendChart() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const rates = [91, 93, 94, 92, 95, 96];

    return (
        <Card className="p-5 border-0 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" /> Monthly Attendance Trend
            </h3>
            <div className="h-32 flex items-end justify-between gap-2 pt-6 border-b border-gray-100">
                {rates.map((rate, idx) => (
                    <div key={months[idx]} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-primary/10 rounded-t-lg relative flex flex-col justify-end hover:bg-primary/20 transition-colors" style={{ height: `${rate}%` }}>
                            <div className="bg-primary h-3/4 rounded-t-lg"></div>
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-primary">{rate}%</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{months[idx]}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function AttendanceHeatMap() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const weeks = [1, 2, 3, 4];

    // Simulated values (0.7 to 1.0)
    const heatValues = [
        [0.95, 0.92, 0.94, 0.98, 0.91],
        [0.96, 0.95, 0.93, 0.97, 0.92],
        [0.98, 0.97, 0.96, 0.99, 0.95],
        [0.94, 0.93, 0.92, 0.96, 0.90]
    ];

    const getColor = (val: number) => {
        if (val >= 0.96) return 'bg-emerald-500';
        if (val >= 0.93) return 'bg-emerald-300';
        return 'bg-amber-300';
    };

    return (
        <Card className="p-5 border-0 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" /> Daily Attendance Heatmap
            </h3>
            <div className="space-y-1.5">
                {days.map((day, dIdx) => (
                    <div key={day} className="flex items-center gap-2">
                        <span className="w-8 text-[10px] font-black text-gray-400 uppercase">{day}</span>
                        <div className="flex gap-1.5 flex-1">
                            {weeks.map((w, wIdx) => {
                                const val = heatValues[wIdx][dIdx];
                                return (
                                    <div
                                        key={w}
                                        className={`flex-1 h-6 rounded-md ${getColor(val)} transition-all hover:scale-105`}
                                        title={`Week ${w} ${day}: ${(val * 100).toFixed(0)}% attendance`}
                                    ></div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-3 text-[9px] font-black text-gray-400 uppercase pt-2">
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-300"></span>
                    <span>&lt; 93%</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-300"></span>
                    <span>93% - 96%</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                    <span>&gt; 96%</span>
                </div>
            </div>
        </Card>
    );
}
