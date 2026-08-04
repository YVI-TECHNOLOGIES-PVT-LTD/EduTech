import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';

export const AttendanceAnalyticsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/attendance')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Attendance Engagement Analytics
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Monthly class heatmaps, patterns, and student risk forecasting index deltas.
                    </p>
                </div>
            </div>

            {/* Performance charts matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <div className="md:col-span-2 bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-gray-150">
                        <BarChart3 className="w-4.5 h-4.5 text-primary" />
                        Monthly Engagement Trends
                    </h3>

                    <div className="space-y-4 text-xs">
                        <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <span className="font-bold text-gray-400">Present Class Average Ratios</span>
                            <span className="font-black text-primary">94.20%</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <span className="font-bold text-gray-400">Late Arrivals Rates</span>
                            <span className="font-black text-primary">2.10%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-950 to-slate-900 text-white rounded-3xl p-6 shadow-premium-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-bl-full filter blur-xl"></div>
                    
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4.5 h-4.5 text-primary" />
                        Predictive Engagement Risk
                    </h3>

                    <p className="text-[10px] text-gray-400 leading-relaxed relative z-10">
                        Dropout warning prediction index mapped to consecutive absence counts.
                    </p>
                </div>
            </div>
        </div>
    );
};
export default AttendanceAnalyticsPage;
