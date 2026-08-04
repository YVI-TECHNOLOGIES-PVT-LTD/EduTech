import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';

export const AttendanceCalendarManager: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/attendance')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Attendance Calendar Manager
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Configure working days, half-days, public holidays, and makeup class schedules.
                    </p>
                </div>
            </div>

            {/* List calendar days settings logs */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-gray-900 uppercase">Calendar overrides</h3>
                    <button className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        Add Holiday Override
                    </button>
                </div>

                <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <span className="font-bold text-gray-900">National Day Holiday</span>
                            <p className="text-[9px] text-gray-400">Date: 2026-12-02</p>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[9px] font-black uppercase">HOLIDAY</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AttendanceCalendarManager;
